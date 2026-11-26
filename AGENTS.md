# AGENTS.md

Arbeitsregeln für alle Agenten, die an diesem Repository arbeiten.

## Sprache und Ton
- Projektdokumentation und UI-Texte auf Deutsch und Englisch (UI über `_locales`).
- Sachlich, knapp, keine Marketing-Formulierungen.

## Ehrlichkeitspflicht (wichtigste Regel)
- Keine Funktion als „implementiert“ oder „funktionsfähig“ bezeichnen, wenn sie nur simuliert,
  theoretisch beschrieben oder gegen ein lokales Mock getestet wurde.
- Jeder Funktionsstand wird eindeutig gekennzeichnet:
  `[geplant]` / `[implementiert]` / `[getestet]` / `[funktionsfähig]` / `[technisch blockiert]`.
- Blocker müssen mit konkreter Quelle belegt werden (Datei + Commit, Bugzilla-Bug, MDN-Seite,
  eigener API-Test), nicht mit Vermutungen.

## Architektur-Grenzen
- Die Zielarchitektur ist eine **reine Firefox-WebExtension**. Keine Windows-Dienste, keine
  zusätzlichen Executables, keine Native-Messaging-Hosts, keine Treiber, keine Admin-Rechte,
  keine Registry-Eingriffe, keine eigene Firefox-Version, keine externen lokalen Webserver.
- Abweichungen (Varianten B–E aus FEASIBILITY.md) nur nach ausdrücklicher Freigabe des
  Projektleiters mit technischer Begründung.
- Die räumliche Näheprüfung des Hybrid-Protokolls (BLE) darf **nicht** deaktiviert oder umgangen werden.

## Sicherheit
- Keine privaten Schlüssel, Passwörter, Tokens oder `.env`-Inhalte committen oder ausgeben.
- Keine Umgehung von Browser-Sandbox, WebAuthn-Sicherheitsprüfungen oder Origin-Bindung.
- Keine dynamisch nachgeladenen ausführbaren Codes, keine Telemetrie, keine versteckte
  externe Kommunikation. Der einzige vorgesehene Netzverkehr ist der caBLE-v2-Tunnel
  (wss) zum Rendezvous-Server des jeweiligen Anbieters während einer expliziten Anmeldung.
- Siehe [SECURITY.md](SECURITY.md).

## Code-Stil
- Kein Neuschreiben kryptografischer Verfahren; Web Crypto API bzw. etablierte
  Open-Source-Bibliotheken verwenden (Lizenz prüfen und in THIRD_PARTY_LICENSES.md eintragen).
- Keine Code-Kommentare; Code selbsterklärend halten.
- Übergenommene Quellteile dokumentieren: Ursprungsrepo, Commit-ID, Lizenz, vorgenommene Änderungen
  (siehe CHROMIUM_COMPONENTS.md / THIRD_PARTY_LICENSES.md).
- Tests in `tests/` (Node, ohne Abhängigkeiten), Ausführung mit `npm test`.

## Git
- Kleine, thematisch fokussierte Commits. Keine Secrets, keine Build-Artefakte (XPI) committen.
