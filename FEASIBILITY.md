# FEASIBILITY.md – Machbarkeitsbewertung (Phase 1)

Untersuchungsstände: Chromium `main` @ `bdbcbad8b9c4be61520ee27c11ff36dd06464034`,
mozilla-central (gecko-dev `master`) @ `5836a062726f715fda621338a17b51aff30d0a8c`.

## Kurzfazit

| Anforderung | Status | Nachweis |
|---|---|---|
| QR-Code-Erzeugung (caBLE-v2-Payload `FIDO:/…`) | **[funktionsfähig]** (implementiert + getestet) | `extension/lib/cable-qr.js`, `tests/test-cable-qr.mjs` |
| CBOR (kanonisch, CTAP2-Profil) | **[funktionsfähig]** | `extension/lib/cbor.js`, `tests/test-cbor.mjs` |
| HKDF-Ableitungen (Tunnel-ID, PSK, EID-Key) per Web Crypto | **[funktionsfähig]** (RFC-5869-Vektor bestanden) | `extension/lib/derive.js`, `tests/test-derive.mjs` |
| Noise-Handshake `Noise_NKpsk0_P256_AESGCM_SHA256` (beide Rollen, AES-256-GCM/SHA-256/HKDF per Web Crypto) | **[funktionsfähig]** (Self-Test: identische Traffic-Keys, AEAD-Roundtrip, falscher PSK schlägt fehl) | `extension/lib/noise.js`, `tests/test-noise.mjs` |
| WebSocket-Tunnel-URLs und -Client (wss zum Anbieter-Rendezvous) | **[implementiert]** (URL-Builder getestet; Live-Tunnel nicht getestet) | `extension/lib/tunnel.js`, `tests/test-tunnel.mjs` |
| WebAuthn-/BLE-/Krypto-Diagnose in Seite + Hintergrund | **[implementiert]** | `extension/lib/diagnostics.js`, Popup |
| WebAuthn-Interception ohne Browser-API | **[implementiert, eingeschränkt]** – nur via MAIN-Welt-Shim von `navigator.credentials` (Firefox ≥ 128, `world: "MAIN"`); s. u. | `extension/content/shim.js` |
| **BLE-Advert-Empfang (Routing + Näheprüfung)** | **[technisch blockiert]** | s. u. |
| **Vollständiger Hybrid-Fluss (QR → iPhone → gültige WebAuthn-Antwort an die Seite)** | **[technisch blockiert]** in reiner WebExtension | s. u. |

## Blocker 1: Kein Bluetooth-Zugriff für Firefox-Erweiterungen (hart, protokolleben)

- Firefox implementiert **Web Bluetooth in keiner Version und in keinem Kontext** – auch nicht
  für Webseiten und nicht für Erweiterungen. Tracking-Bug: [Bug 674737](https://bugzilla.mozilla.org/show_bug.cgi?id=674737)
  (WONTFIX), MDN/BCD: `navigator.bluetooth` in Firefox nicht vorhanden.
- Es gibt **keinen** Erweiterungs-API-Namespace für Bluetooth. Verifiziert gegen
  `toolkit/components/extensions/schemas/` in mozilla-central: keine `bluetooth.json`,
  keine `webauthn.json` o. ä.
- caBLE v2 benötigt den **Empfang des BLE-Adverts des Telefons** zwingend: Das Advert
  (20 Bytes: AES-blockverschlüsseltes EID + 4-Byte-HMAC, Schlüssel aus dem QR-Secret
  abgeleitet) liefert die **Routing-ID** und ist die **räumliche Näheprüfung**.
  Chromium: `device/fido/cable/v2_discovery.cc` (`OnBLEAdvertSeen`, `eid::Decrypt`),
  `device/fido/cable/v2_constants.h` (`kAdvertSize = 20`, `kRoutingIdSize = 3`).
  Ohne passenden Advert wird in Chromium überhaupt kein caBLE-Gerät erzeugt
  (`Discovery` „creates caBLEv2 devices … when a BLE advert is seen that matches |qr_generator_key|“).
- Konsequenz: Eine reine WebExtension kann den Hybrid-Transport **nicht** abschließen, ohne
  die Näheprüfung zu deaktivieren — was die Projektanforderungen ausdrücklich verbieten.
  Beide existierenden Lösungen bestätigen das: „Phone Passkeys“ (AMO) verlangt einen
  **Native-Messaging-Host** (Rust) genau für BLE; „passkey-hybrid-firefox-ext“ (TheSmartZebra)
  ist ein Front-End für den systemseitigen `credentialsd`-Dienst (ebenfalls native).

## Blocker 2: Keine browserseitige WebAuthn-Schnittstelle für Erweiterungen

- Es existiert kein `browser.webauthn` o. Ä. (Schema-Liste s. o.). Firefox 150 erlaubt
  Erweiterungs**dokumenten** zwar, eine RP-ID für Domains aus den Host-Berechtigungen zu
  assertieren ([Bug 1956484](https://bugzilla.mozilla.org/show_bug.cgi?id=1956484),
  MDN „Use the WebAuthn API in web extensions“), aber `clientDataJSON.origin` bleibt dann
  `moz-extension://<sha256>` — die RP-seitige Origin-Prüfung schlägt fehl. Damit kann eine
  gültige Antwort **nicht** von einer Erweiterungsseite an die anfragende Webseite
  zurückgegeben werden.
- Einzige Interceptionsmöglichkeit in reiner Extension: Content-Skript in der
  **MAIN-Welt** (`world: "MAIN"`, Firefox ≥ 128), das `navigator.credentials.get/create`
  umhüllt und an den Hintergrund delegiert (PoC: `extension/content/shim.js` +
  `bridge.js`; dasselbe Muster nutzt das TheSmartZebra-Repo). Einschränkungen:
  - Conditional UI / Autofill (`mediation: "conditional"`) wird durch den Shim unterbrochen.
  - Jedes iframe benötigt eigene Injection (`all_frames`).
  - Öffentliches AMO-Listing eines All-Origin-WebAuthn-Interceptors ist riskant (das
    TheSmartZebra-README räumt das selbst ein).
- Firefox auf Windows: `dom/webauthn` nutzt die Win32-WebAuthn-API (`winwebauthn`); dort
  steht kein Hybrid-Transport zur Verfügung (beobachtet: nur USB-Schlüssel wird angeboten).
  macOS ist davon ausgenommen (Plattform-Authenticator, Bug 1925785 „hybrid“-Tagging).

## Was in reiner WebExtension nachweislich funktioniert (PoC)

- QR-Payload exakt nach Chromium `device/fido/cable/v2_handshake.cc` (`qr::Encode`):
  `FIDO:/` + Dezimalkodierung (7-Byte-Chunks → 17 Dezimalstellen, Breiten {0,3,5,8,10,13,15,17})
  von kanonischem CBOR `{0: komprimierter P-256-Pubkey aus 32-Byte-Seed, 1: 16-Byte-Secret,
  2: numKnownDomains, 3: Timestamp, 4: linking, 5: "ga"|"mc"|"dcp"}`.
- Ableitungen per HKDF-SHA-256 (Web Crypto), Info = LE32(DerivedValueType):
  Tunnel-ID = Typ 2 (16 B), PSK = Typ 3 (32 B), EID-Key = Typ 1 (64 B).
- Noise-Handshake komplett per Web Crypto (ECDH P-256, AES-256-GCM mit Nonce = BE32(counter)||zeros,
  AD = h, HKDF2) — im Test stimmen Initiator- und Responder-Traffic-Keys überein.
- Tunnel-URLs: `wss://cable.ua5v.com/cable/new/<hex16>`, `wss://cable.ua5v.com/cable/connect/<hex3-routing>/<hex16-tunnel>`
  (Domain-IDs: 0 = `cable.ua5v.com`, 1 = `cable.auth.com`), `wss://…/cable/contact/<b64url>`.
- WebSocket-Verbindungen aus dem Hintergrund sind mit Host-Berechtigung möglich
  (im PoC nicht live getestet; ohne BLE ohnehin nicht sinnvoll).

## Alternativenbewertung (Reihenfolge aus dem Projektauftrag)

- **A. Reine WebExtension:** blockiert durch Blocker 1 (BLE) und Blocker 2 (keine Rückgabe
  an die Seite ohne MAIN-Welt-Shim). Teilumfang (QR, Krypto, Tunnel-Client, Diagnose) umgesetzt.
- **B. Optionale Chrome-Integration:** keine offiziell unterstützte Schnittstelle vorhanden
  (Extensions haben keinen CDP-Zugriff; Chrome exponiert keine WebAuthn-Bridge für Extensions).
  Nicht zulässig, da Sicherheitsgarantien (Origin-Bindung an die Firefox-Sitzung) nicht
  voll erhalten blieben.
- **C. Portables Hilfsprogramm bei Bedarf / D. Native Messaging Host:** technisch umsetzbar
  (Beleg: „Phone Passkeys“, `credentialsd`), widersprechen aber §3 des Auftrags; erfordern
  ausdrückliche Freigabe.
- **E. Firefox-Patch:** Hybrid-Transport + BLE-Zugriff in `dom/webauthn` upstream — der
  nachhaltige Weg; als Feature-Request bei Mozilla adressierbar.

**Empfehlung:** PoC-Dokumentation als Nachweis liefern; für einen produktiven Hybrid-Fluss
ist Variante A nach aktuellem Stand nicht ausreichend — Freigabe für C/D oder Investition in E
erforderlich.
