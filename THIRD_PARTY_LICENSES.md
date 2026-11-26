# THIRD_PARTY_LICENSES.md

## Eigener Code

- Dieses Repository (alle Dateien außer den unten aufgeführten Vendored-Dateien):
  **Mozilla Public License 2.0 (MPL-2.0)**, siehe [LICENSE](LICENSE).

## Vendored / wiederverwendete Komponenten

| Datei | Ursprung | Commit/Version | Lizenz | Änderungen |
|---|---|---|---|---|
| `extension/lib/qrcode.js` | https://github.com/davidshimjs/qrcodejs (`qrcode.js`) | `master` @ Abruf 2026-11 | MIT (Copyright (c) 2012 davidshimjs), Kopie: `extension/lib/qrcodejs-LICENSE.txt` | keine (unverändert übernommen) |

## Portierte (nicht kopierte) Algorithmen

| Portierter Code | Ursprung | Commit | Lizenz des Originals | Änderung |
|---|---|---|---|---|
| `extension/lib/cable-qr.js` (QR-Payload, Dezimalkodierung), `extension/lib/derive.js` (HKDF-Derive), `extension/lib/noise.js` (Noise P-256/AESGCM), `extension/lib/tunnel.js` (Tunnel-URLs), `extension/lib/cbor.js` (kanonisches CBOR) | https://github.com/chromium/chromium (chromium/src), Pfade siehe CHROMIUM_COMPONENTS.md | `bdbcbad8b9c4be61520ee27c11ff36dd06464034` | BSD-3-Clause | C++ → JavaScript; Krypto via Web Crypto statt BoringSSL; keine Dateien 1:1 kopiert |

## Nur analysiert (kein Code übernommen)

| Projekt | Lizenz | Grund |
|---|---|---|
| https://github.com/TheSmartZebra/passkey-hybrid-firefox-ext | keine LICENSE-Datei im Repo | nur Architektur inspiziert (MAIN-Welt-Shim + nativeMessaging-Front-End); wegen fehlender Lizenz kein Code übernommen |
| „Phone Passkeys“ (addons.mozilla.org/en-US/firefox/addon/phone-passkeys/) | MPL-2.0 (laut AMO) | nur Produktbeschreibung analysiert; Lösung erfordert Native-Messaging-Host (BLE) und widerspricht damit §3 des Auftrags |

## Lizenzprüf-Regel

Vor jeder Übernahme: Lizenz im Ursprungsrepo verifizieren und hier eintragen. Öffentlich
einsehbare Dateien ohne ausreichende Nutzungslizenz werden nicht übernommen.
