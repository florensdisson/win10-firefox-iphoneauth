# SECURITY.md

## Sicherheitsmodell

- Der private Passkey-Schlüssel verlässt das iPhone nie (Signatur erfolgt auf dem Gerät,
  nach Face ID/Touch ID). Die Erweiterung sieht nur öffentliche Schlüssel, das QR-Secret,
  abgeleitete Transportschlüssel (PSK/Tunnel-ID/EID-Key), CTAP2-Antworten und Signaturen.
- Das QR-Secret und die abgeleiteten Schlüssel werden nur für die Dauer einer Anmeldung im
  Speicher gehalten und danach verworfen; keine Persistenz in `storage`.
- Keine Passwörter, keine Sitzungs-Cookies, keine Telemetrie. Keine Kommunikation außer dem
  caBLE-v2-Tunnel (wss zum Rendezvous-Server des Anbieters, z. B. `cable.ua5v.com` /
  `cable.auth.com`) während einer explizit vom Nutzer gestarteten Anmeldung.
- Die räumliche Näheprüfung (BLE-Advert des Telefons) darf nicht deaktiviert oder umgangen
  werden — genau deshalb ist der Hybrid-Fluss in einer reinen WebExtension blockiert
  (FEASIBILITY.md Blocker 1).

## Implementierte Maßnahmen im PoC

- Manifest mit minimalen Rechten (`storage`, `scripting`, `activeTab`; Host-Rechte optional).
- Kein `eval`, kein remote code, keine dynamisch nachgeladenen Skripte.
- Kryptografie ausschließlich über Web Crypto (HKDF-SHA-256, ECDH P-256, AES-256-GCM);
  P-256-Punktarithmetik nur für QR-Schlüsselgenerierung (BigInt, ohne externe Krypto).
- MAIN-Welt-Shim (`content/shim.js`) verhält sich pass-through: ohne funktionierenden
  Hybrid-Pfad wird jede Anfrage an das native `navigator.credentials` durchgereicht
  (Fallback nach 3 s). Origin-, RP-ID- und Challenge-Prüfungen bleiben vollständig beim
  Browser/RP.
- Fehlermeldungen enthalten keine Schlüsseldaten; Logs enthalten keine Secrets.

## Bekannte Risiken / Offenpunkte

- MAIN-Welt-Shim von `navigator.credentials` ist die sensitivste Stelle: eine kompromittierte
  Seite könnte den Shim missbrauchen. Gegenmaßnahmen im Produktivdesign: strikte
  Nachrichten-Validierung, kein Credential-Rücktransport ohne explizite Nutzeraktion,
  prüfen, ob AMO-Listing einen solchen Shim zulässt.
- Post-Handshake-Tunnel-Nachrichten müssen gemäß Chromium
  (`kPostHandshakeMsgPaddingGranularity = 512`) gepaddet werden, um Traffic-Analyse zu
  erschweren — im PoC noch nicht umgesetzt.
- Vor Veröffentlichung: externes Security-Audit, AMO-Review, Penetrationstest gegen
  Phishing-Szenarien (gefälschte QR-Codes).

## Meldung von Sicherheitslücken

Bitte vertraulich melden (siehe README-Kontakt des Repos); keine öffentlichen Issues mit
Reproduktionsdetails für ungepatchte Lücken.
