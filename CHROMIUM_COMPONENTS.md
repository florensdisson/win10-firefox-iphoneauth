# CHROMIUM_COMPONENTS.md

Untersuchte Chromium-Komponenten (Quelle: `chromium/chromium` GitHub-Spiegel,
`main` @ Commit `bdbcbad8b9c4be61520ee27c11ff36dd06464034`; Lizenzen: BSD-3-Clause,
siehe `LICENSE` im Chromium-Root). Es wurden **keine Dateien 1:1 übernommen**; die
relevanten Algorithmen wurden nach JS/TS portiert (Portierungsliste s. u.).

## Relevante Module für den Hybrid-Transport (caBLE v2)

| Datei | Relevanz | Portierungsstatus im PoC |
|---|---|---|
| `device/fido/cable/v2_handshake.cc/.h` | QR-Payload (`qr::Encode/Parse`, `FIDO:/` + Dezimalkodierung), EID-Ver-/Schlüsselung, Tunnel-URLs, HKDF-`Derive`, Noise-Handshake-Rollen (NKpsk0/KNpsk0/NK), `DerivedValueType`-Enum | portiert: `lib/cable-qr.js`, `lib/derive.js`, `lib/tunnel.js`, `lib/noise.js` [getestet] |
| `device/fido/cable/v2_constants.h` | Bytegrößen (Advert 20, Routing 3, Tunnel-ID 16, PSK 32, QR-Key 48) | Konstanten in `lib/cable-qr.js`/`lib/tunnel.js` |
| `device/fido/cable/v2_discovery.cc/.h` | BLE-Advert-Empfang, EID-Entschlüsselung, Geräte-Erzeugung | **[nicht portierbar]** — erfordert BLE (Blocker 1) |
| `device/fido/cable/noise.cc/.h` | Noise-SymmetricState (SHA-256, HKDF2, AES-256-GCM) | portiert nach Web Crypto: `lib/noise.js` [getestet] |
| `device/fido/cable/fido_tunnel_device.cc/.h` | Tunnel-Lebenszyklus, Tunnel-ID-Ableitung aus QR-Secret | URL-Teil portiert: `lib/tunnel.js` [getestet]; Live-Client implementiert, nicht live getestet |
| `device/fido/cable/websocket_adapter.cc/.h` | WebSocket-Framing zum Tunnel-Server (inkl. Routing-ID-Header) | `TunnelClient` in `lib/tunnel.js` [implementiert] |
| `device/fido/cable/pairing.cc/.h`, `v2_registration.cc`, `v2_authenticator.cc` | „Remember this phone“-Pairing, Registrierungs-Flow | [geplant] — ohne BLE nicht nutzbar |
| `device/fido/ctap_get_assertion_request.cc`, `ctap_make_credential_request.cc`, `cbor_util.cc`, `public_key.cc` | CTAP2-CBOR-Nachrichten, COSE-Keys | CBOR portiert: `lib/cbor.js` [getestet]; CTAP2-Request-Builder [geplant] |
| `content/browser/webauth/authenticator_impl.cc` | WebAuthn→CTAP-Glue im Browser | nicht portierbar (Browserebene); in Firefox nur via MAIN-Welt-Shim erreichbar |
| `chrome/browser/webauthn/*` | Chrome-UI/Request-Scheduling | nicht portiert (UI bauen wir selbst) |
| `components/qr_code_generator/*` | QR-Rendering in C++ | ersetzt durch MIT-Bibliothek `qrcode.js` (siehe THIRD_PARTY_LICENSES.md) |
| `components/webauthn/*` | JSON-Serialisierung WebAuthn | nicht benötigt |

## Abhängigkeiten, die bei einer Portierung ersetzt werden müssten

- BoringSSL (EC/ECDH/AES/HKDF) → **Web Crypto API** (ECDH P-256, AES-256-GCM, SHA-256, HKDF) — im PoC vollständig per Web Crypto umgesetzt und getestet.
- `device/bluetooth/*` (BLE) → **nicht ersetzbar** in Firefox (kein Web Bluetooth; Blocker 1).
- Chromium `base::`/`cbor::` → eigene kleine CBOR-Implementierung (`lib/cbor.js`).
- `EC_KEY_derive_from_secret` (Seed → P-256-Private-Key) → Reduktion des Seeds mod n in `lib/p256.js`.

## Lizenzhinweis

Chromium-Quellcode steht unter BSD-3-Clause. Portierte Algorithmen werden mit
Ursprungsangabe (Datei + Commit) dokumentiert; es werden keine Chromium-Dateien
wortwörtlich kopiert.
