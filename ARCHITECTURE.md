# ARCHITECTURE.md

## Zielbild (Variante A: reine WebExtension)

```
Webseite (RP)                 Extension                          iPhone (Authenticator)
  | navigator.credentials.get      |                                   |
  |-------------------------------->| MAIN-Welt-Shim (shim.js)         |
  |                                 | postMessage -> bridge.js        |
  |                                 | -> background.js                |
  |                                 |   QR (FIDO:/...) erzeugen       |
  |<--------------------------------|   QR anzeigen (Popup/Overlay)   |
  |                                 |        ^ scannen                |
  |                                 |        | BLE-Advert + wss-Tunnel |
  |                                 |<======= Tunnel (Noise, AEAD) ===|
  |                                 |   CTAP2 getAssertion über Tunnel|
  |                                 |   Signatur + authData vom iPhone |
  |<--------------------------------|   PublicKeyCredential an Seite  |
```

Aktueller Stand: Die mit „===“ markierte Strecke ist **technisch blockiert** (kein BLE in
Firefox, siehe FEASIBILITY.md Blocker 1). Alles andere ist im PoC implementiert bzw. getestet.

## Komponenten

| Pfad | Funktion | Status |
|---|---|---|
| `extension/lib/cbor.js` | Kanonisches CBOR (CTAP2-Profil), Encoder/Decoder | [funktionsfähig] (getestet) |
| `extension/lib/p256.js` | P-256-Punktarithmetik (BigInt) für QR-Schlüssel + Kompression | [funktionsfähig] (getestet) |
| `extension/lib/derive.js` | HKDF-SHA-256-Ableitungen (Tunnel-ID/PSK/EID-Key) per Web Crypto | [funktionsfähig] (RFC-5869-Vektor) |
| `extension/lib/cable-qr.js` | `FIDO:/`-QR-Payload (Build/Parse), Dezimalkodierung | [funktionsfähig] (getestet) |
| `extension/lib/noise.js` | Noise NKpsk0/KNpsk0/NK, P-256 + AES-256-GCM + SHA-256 per Web Crypto | [funktionsfähig] (Self-Test beide Rollen) |
| `extension/lib/tunnel.js` | Tunnel-URLs (`/cable/new`, `/cable/connect`, `/cable/contact`) + WebSocket-Client | [implementiert] (URLs getestet) |
| `extension/lib/qrcode.js` | QR-Rendering (Vendored, MIT, siehe THIRD_PARTY_LICENSES.md) | [funktionsfähig] |
| `extension/lib/diagnostics.js` | Laufzeit-Diagnose WebAuthn/BLE/WebCrypto/WebSocket | [implementiert] |
| `extension/background/background.js` | Nachrichten-Router, QR-Erzeugung, Hybrid-Status | [implementiert] |
| `extension/content/probe.js` | Seiten-Diagnose (ISOLATED-Welt) | [implementiert] |
| `extension/content/bridge.js` | Shim-Bridge ISOLATED ↔ Seite | [implementiert] |
| `extension/content/shim.js` | MAIN-Welt-Wrapper für `navigator.credentials` (Pass-Through, da Hybrid blockiert) | [implementiert, eingeschränkt] |
| `extension/popup/` | Diagnose-UI + Test-QR (de/en) | [implementiert] |
| BLE-Advert-Empfang / Näheprüfung | — | [technisch blockiert] |
| CTAP2-Nachrichten über Tunnel an echtes iPhone | — | [technisch blockiert] (folgt aus BLE) |

## Protokoll-Referenzpunkte (Chromium `main` @ bdbcbad8…)

- QR-Payload: `device/fido/cable/v2_handshake.cc` `qr::Encode`/`qr::Parse`, `BytesToDigits` (7 Bytes → 17 Dezimalstellen)
- Konstanten: `device/fido/cable/v2_constants.h` (Advert 20 B, Routing-ID 3 B, Tunnel-ID 16 B, PSK 32 B, QR-Seed 32 B + Secret 16 B)
- Advert-Ver-/Schlüsselung: `v2_handshake.cc` `eid::Encrypt/Decrypt`, `v2_discovery.cc` `OnBLEAdvertSeen`
- Tunnel-URLs: `v2_handshake.cc` `tunnelserver::GetNewTunnelURL/GetConnectURL/GetContactURL`, Domain-IDs 0=`cable.ua5v.com`, 1=`cable.auth.com`
- Noise: `device/fido/cable/noise.cc` (`Noise_KNpsk0_P256_AESGCM_SHA256` etc., AES-256-GCM, Nonce = BE32 counter, AD = h) und `v2_handshake.cc` (NKpsk0 für QR-Flow: Initiator = Telefon mit peer_identity = QR-Pubkey, psk0)
- HKDF-Derive: `v2_handshake.cc` `internal::Derive` (HKDF-SHA-256, info = LE32(DerivedValueType), Enum in `v2_handshake.h`: EID_KEY=1, TUNNEL_ID=2, PSK=3, …)
- Geräte-/Tunnel-Lebenszyklus: `device/fido/cable/fido_tunnel_device.cc`, `websocket_adapter.cc`
- CTAP2-Nachrichten: `device/fido/ctap_get_assertion_request.cc`, `ctap_make_credential_request.cc`, `cbor_util.cc`
- WebAuthn-Glue: `content/browser/webauth/authenticator_impl.cc`, `chrome/browser/webauthn/*`

## Berechtigungsminimierung

Manifest: `permissions: [storage, scripting, activeTab]`, `optional_host_permissions: [https://*/*, wss://*/*]`.
Keine `nativeMessaging`, keine `<all_urls>`-Pflichtberechtigung, keine Remote-Code-Pfade.
Der Shim läuft nur als Content-Skript; er leitet aktuell immer an das native
`navigator.credentials` durch (Hybrid blockiert).
