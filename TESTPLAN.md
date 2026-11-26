# TESTPLAN.md

## Automatisierte Tests (implementiert, `npm test`, Node ≥ 20, keine Abhängigkeiten)

| Suite | Prüft | Status |
|---|---|---|
| `tests/test-cbor.mjs` | Kanonisches CBOR: bekannte Vektoren (`1000`→`1903e8`, `"IETF"`→`6449455446`, `-1`→`20`), Roundtrips (Map/bstr/int/bool/string/array) | [getestet] bestanden |
| `tests/test-derive.mjs` | HKDF-SHA-256 gegen RFC-5869-Testvektor 1; Längen der Derive-Ausgaben | [getestet] bestanden |
| `tests/test-cable-qr.mjs` | Dezimalkodierung (Roundtrip versch. Längen, Overflow-Ablehnung), `FIDO:/`-QR Build+Parse, komprimierter Schlüssel aus Seed, Tunnel-ID/PSK/EID-Key-Längen | [getestet] bestanden |
| `tests/test-noise.mjs` | Noise NKpsk0 beide Rollen: Payload-Entschlüsselung, identische Traffic-Keys, falscher PSK schlägt fehl, Post-Handshake-AEAD | [getestet] bestanden |
| `tests/test-tunnel.mjs` | Tunnel-URL-Builder (Domain-IDs 0/1, Routing-/Tunnel-ID-Validierung) | [getestet] bestanden |

## Manuelle Browsertests (Firefox ≥ 128, `about:debugging` → temporäre Erweiterung)

1. Popup → „Diagnose ausführen“: erwartet `webBluetooth: no`, `webCrypto*: yes`,
   `PublicKeyCredential` vorhanden, `clientCapabilities` ohne `hybrid`.
2. Popup → „Test-QR erzeugen“: QR wird gerendert, `FIDO:/…`-Payload + Tunnel-ID werden angezeigt.
3. Auf einer WebAuthn-Testseite (z. B. webauthn.io, demo.testportal) Shim-Verhalten prüfen:
   `navigator.credentials.get` wird durchgereicht (Hybrid blockiert) und funktioniert normal.

## Integrationstests gegen echtes iPhone (Phase 3, derzeit blockiert)

- [blockiert] QR-Scan mit iPhone, Face-ID-Freigabe, gültige WebAuthn-Antwort an Test-RP
  (z. B. eigener Test-RP oder webauthn.io-Demo) — erfordert BLE-Zugang (Variante C/D/E).
- Testumgebungen: eigene RP-Demo (webauthn.io-ähnlich), nie produktive Konten;
  Ziel-SSO `sso.arbeitsagentur.de` erst nach erfolgreicher Sicherheitsprüfung.

## Windows-Kompatibilität

- [geplant] Windows 10 und Windows 11: Diagnose-Protokoll + (nach BLE-Lösung) Hybrid-Fluss.
