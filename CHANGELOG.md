# CHANGELOG.md

## 0.1.0 – PoC (Phase 1/2)

- Machbarkeitsanalyse Chromium (caBLE v2) und Firefox mit Quellenangaben (FEASIBILITY.md, CHROMIUM_COMPONENTS.md).
- Extension-Grundgerüst (MV3): Manifest, Hintergrund, Popup (de/en), Content-Skripte.
- Portiert und per Node-Tests verifiziert (`npm test`):
  - kanonisches CBOR (`extension/lib/cbor.js`)
  - Dezimalkodierung + `FIDO:/`-QR-Payload Build/Parse (`extension/lib/cable-qr.js`)
  - HKDF-SHA-256-Derive (Tunnel-ID/PSK/EID-Key) via Web Crypto (`extension/lib/derive.js`, RFC-5869-Vektor)
  - Noise `NKpsk0_P256_AESGCM_SHA256` beide Rollen via Web Crypto (`extension/lib/noise.js`)
  - Tunnel-URLs + WebSocket-Client-Skelett (`extension/lib/tunnel.js`)
- P-256-Punktarithmetik für QR-Schlüssel (`extension/lib/p256.js`).
- Laufzeit-Diagnose WebAuthn/BLE/WebCrypto (`extension/lib/diagnostics.js`, Popup).
- MAIN-Welt-Shim für `navigator.credentials` als Pass-Through-Demo (`extension/content/shim.js`).
- Vendored: qrcodejs (MIT) zum QR-Rendering.
- Dokumentation: README, AGENTS, ARCHITECTURE, FEASIBILITY, CHROMIUM_COMPONENTS,
  THIRD_PARTY_LICENSES, SECURITY, TESTPLAN, ROADMAP, CHANGELOG; Lizenz MPL-2.0.

Bekannte Blocker (dokumentiert, nicht umgangen): BLE-Advert-Empfang/Näheprüfung und damit
der vollständige Hybrid-Fluss in reiner WebExtension; siehe FEASIBILITY.md.
