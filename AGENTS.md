# Arbeitsregeln für win10-firefox-iphoneauth

## Zusammenarbeit von Agenten

Diese Regeln gelten für Codex, Vibe und andere Agenten, die in diesem Repository arbeiten.

### Aufgabe übernehmen

1. Den aktuellen Standardbranch, diese Datei, offene Issues und Pull Requests sowie die Remote-Branches prüfen. Prüfen, ob dieselbe Aufgabe oder dieselben Dateien bereits bearbeitet werden. Bei Überschneidungen zuerst die Zuständigkeit absprechen.
2. Eine gemeinsame Aufgabenkennung verwenden, vorzugsweise die Nummer des bestehenden GitHub-Issues. Gibt es noch kein Issue, zuerst anhand des Auftrags nach einer bestehenden Kennung suchen. Für denselben Auftrag muss jede Sitzung dieselbe Kennung verwenden. Bei unklarer Zuordnung vor der Bearbeitung abstimmen.
3. Die Aufgabe vor der ersten Dateiänderung über den Remote-Branch `work/<kennung>` reservieren. Existiert er bereits, gilt die Aufgabe als belegt. Für die Neuanlage lokal vom aktuellen Standardbranch einen leeren Startcommit mit Agent, UTC-Zeit und eindeutiger Sitzungs-ID erzeugen. Diesen Commit mit einem regulären Push ohne Force auf den Reservierungsbranch schreiben. Bei gleichzeitiger Übernahme unterscheiden sich die Startcommits, sodass Git den zweiten Push ablehnt. Nur beginnen, wenn GitHub den eigenen Startcommit als Spitze des neuen Branches bestätigt. Bei unklarem Ergebnis die Remote-Referenz erneut lesen.
4. Nach erfolgreicher Reservierung GitHub-Issue oder Draft-PR mit Branch, Zuständigkeit, geplantem Umfang und Status aktualisieren. Beim Warten auf Rückmeldung bleibt die Aufgabe reserviert.

### Parallel arbeiten und übergeben

- Pro Aufgabe einen eigenen Checkout oder Worktree und den zugehörigen Branch verwenden. Unabhängige Aufgaben dürfen parallel laufen. Bei Änderungen an denselben Dateien, Schnittstellen oder Migrationen die Reihenfolge im Issue oder PR abstimmen.
- Änderungen anderer Sitzungen erhalten. Kleine, nachvollziehbare Commits pro Funktion oder Korrektur erstellen. Vor dem Merge aktuellen Standardbranch und offene Änderungen noch einmal prüfen, Konflikte gezielt auflösen und relevante Tests ausführen.
- Im PR festhalten, was geändert und geprüft wurde und welche Schritte offen sind. Während der Bearbeitung hängen Entscheidungen, Testbefunde und Blockaden am Issue oder PR, damit die nächste Sitzung den Stand nachvollziehen kann.
- Eine laufende Aufgabe nur nach ausdrücklicher Übergabe oder Freigabe durch Florens übernehmen. Die bisher zuständige Sitzung dokumentiert im Issue oder PR den letzten Commit, Testergebnisse, offene Punkte und den nächsten Schritt. Die übernehmende Sitzung bestätigt die Übergabe und arbeitet auf demselben Branch weiter. Zeitablauf allein gibt die Aufgabe nicht frei.
- Abschluss erst nach geprüftem Merge oder dokumentiertem Abbruch. Bei Abbruch zuerst sicherstellen, dass benötigte Änderungen weiter erreichbar sind. Den Arbeitsbranch nur nach abgeschlossenem Merge oder abgestimmter Freigabe entfernen.

### Versionen und Rückkehr

- GitHub ist der maßgebliche Arbeitsstand. Die Synology erhält die wöchentlichen Backups. Projektspezifische Vorgaben zu Prüfung, Versionen und Veröffentlichung weiter anwenden.
- Freigegebene Stände über die bestehende Versionskonvention einem festen Commit zuordnen. Gibt es noch keine Konvention, einen eindeutigen Versions-Tag für den geprüften Stand setzen.
- Für die Rücknahme einer einzelnen Funktion einen gezielten Revert oder Korrekturcommit erstellen. Für einen vollständigen früheren Stand einen Wiederherstellungsbranch von der gewünschten Version anlegen. Vor einer Veröffentlichung die Auswirkungen auf Schnittstellen, Migrationen und Bestandsdaten prüfen.
