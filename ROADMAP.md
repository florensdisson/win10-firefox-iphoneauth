# ROADMAP.md

## Phase 1 – Recherche und Machbarkeit [abgeschlossen]
- Chromium-caBLE-v2-Module analysiert (CHROMIUM_COMPONENTS.md), Lizenzen geprüft (THIRD_PARTY_LICENSES.md).
- Firefox-Schnittstellen analysiert: kein Web Bluetooth (Bug 674737), kein WebAuthn-Extension-API,
  RP-ID-Assertion ab FF 150 nur für Extension-Dokumente (Bug 1956484).
- Ergebnis: FEASIBILITY.md mit Blockern und Alternativenbewertung A–E.

## Phase 2 – Proof of Concept [abgeschlossen]
- Lauffähige Extension: Manifest MV3, Popup (de/en), Diagnose, Test-QR.
- Portiert + getestet: CBOR, Dezimalkodierung, QR-Payload, HKDF-Derive, Noise-Handshake
  (beide Rollen), Tunnel-URLs (`npm test` grün).
- Shim-Mechanik (MAIN-Welt) implementiert, pass-through.

## Phase 3 – Funktionaler Prototyp [blockiert auf Freigabe]
Voraussetzung: Lösung für Blocker 1 (BLE). Ohne Freigabe für Variante C/D/E nicht startbar.
- CTAP2-Request/Response über Tunnel (ein Kommando pro Verbindung, wie iOS/Android es verlangen).
- Echtes iPhone testen (QR-Scan, Face ID, Signatur), Fehlerbehandlung, Timeouts, Abbruch.
- Windows 10/11 testen.

## Phase 4 – Veröffentlichung [geplant]
- Externes Security-Audit, automatisierte + manuelle Integrationstests (TESTPLAN.md).
- Lizenzdokumentation finalisieren, Installationsanleitung, GitHub-Repo, XPI, AMO-Vorbereitung.
- Offen: ob AMO einen All-Origin-WebAuthn-Shim im öffentlichen Listing akzeptiert.

## Varianten-Entscheidung (aus FEASIBILITY.md)
- A reine Extension: nur Teilumfang möglich (aktueller Stand).
- B Chrome-Integration: keine offiziell unterstützte Schnittstelle → nicht zulässig.
- C portables Hilfsprogramm bei Bedarf / D Native Messaging: technisch bewährt
  („Phone Passkeys“, credentialsd), widersprechen §3 → Freigabe erforderlich.
- E Firefox-Patch (Hybrid + BLE in dom/webauthn): upstream als Feature-Request einreichen.
