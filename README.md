# Apple Passkey Bridge für Firefox (PoC)

Eigenständige, kostenlose Open-Source-Firefox-Erweiterung (Proof of Concept), die die
geräteübergreifende Anmeldung mit Apple-Passkeys (iPhone per QR-Code, Face ID) — den
FIDO2-Hybrid-Transport (caBLE v2) — in Firefox nachbilden soll, wo Firefox unter Windows
heute nur USB-Sicherheitsschlüssel anbietet.

**Status: Phase 1/2 (Recherche + PoC).** Die Machbarkeitsbewertung mit den nachgewiesenen
Blockern steht in [FEASIBILITY.md](FEASIBILITY.md). Kurzfassung: QR-Erzeugung, CBOR,
HKDF-Ableitungen, der komplette Noise-Handshake (`Noise_NKpsk0_P256_AESGCM_SHA256`) und
die WebSocket-Tunnel-URLs sind in einer reinen WebExtension vollständig umsetzbar und hier
implementiert + getestet. **Blockiert** ist der Hybrid-Gesamtfluss, weil Firefox kein Web
Bluetooth implementiert und das caBLE-v2-BLE-Advert des Telefons (Routing-ID + räumliche
Näheprüfung) von keiner Erweiterung empfangen werden kann.

## Projektstruktur

```
extension/          lauffähige Firefox-WebExtension (MV3, Manifest, Popup, Content-Skripte)
  lib/              portierte Protokoll-bausteine (CBOR, P-256, HKDF, caBLE-QR, Noise, Tunnel)
  background/       Hintergrund-Skript (Diagnose, QR-Erzeugung, Nachrichten)
  content/          probe.js (ISOLATED), bridge.js (ISOLATED), shim.js (MAIN-Welt)
  popup/            Diagnose- und Test-UI (de/en über _locales)
tests/              Node-Testsuite für die Protokoll-Bausteine
*.md                Projektdokumentation (siehe unten)
```

## Schnellstart PoC

1. Firefox öffnen, `about:debugging` → „Dieses Firefox“ → „Temporäre Erweiterung laden“ →
   `extension/manifest.json` wählen.
2. Erweiterungspopup öffnen: „Diagnose ausführen“ zeigt verfügbare WebAuthn-/Bluetooth-/Krypto-Schnittstellen
   in Seite und Hintergrund; „Test-QR erzeugen“ rendert einen protokollkonformen caBLE-v2-QR
   (`FIDO:/…`) samt abgeleiteter Tunnel-ID und Connect-URL.
3. Unit-Tests: `npm test` (Node ≥ 20, keine Abhängigkeiten).

## Dokumente

- [AGENTS.md](AGENTS.md) – Arbeitsregeln für Agenten
- [ARCHITECTURE.md](ARCHITECTURE.md) – Architektur und Datenflüsse
- [FEASIBILITY.md](FEASIBILITY.md) – Machbarkeitsbewertung mit Blockern und Nachweisen
- [CHROMIUM_COMPONENTS.md](CHROMIUM_COMPONENTS.md) – untersuchte/portierte Chromium-Komponenten
- [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) – Lizenzdokumentation
- [SECURITY.md](SECURITY.md) – Sicherheitsmodell und -anforderungen
- [TESTPLAN.md](TESTPLAN.md) – Testplan
- [ROADMAP.md](ROADMAP.md) – Entwicklungsphasen
- [CHANGELOG.md](CHANGELOG.md) – Änderungsprotokoll

## Lizenz

Eigener Code: [MPL-2.0](LICENSE). Fremdbibliotheken siehe [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
