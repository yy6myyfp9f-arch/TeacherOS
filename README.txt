TeacherOS 0.8 – neues Oberflächendesign (auf Basis von 0.7.2)

NEU: Überarbeitetes, responsives Dashboard mit ruhiger, moderner Farbpalette (Petrol, Salbei, Koralle), Sidebar-Navigation für große iPads/Computer und horizontalen Tabs auf kleinen Bildschirmen, neu gestalteten Karten, Formularen und Material-Upload-Bereichen. Die Funktionen und lokalen Speicherstrukturen wurden nicht verändert.

ENTHÄLT sämtliche Funktionen aus 0.7.2: Unterrichtsreihen, Materialstudio mit Kamera, Fotoauswahl und Zwischenablage, MathLab, Unterrichtsstudio, GoodNotes-Kalender. Änderungen an app.js, reihen.js oder material.js wurden nicht vorgenommen.

INSTALLATION: Vorher unter Daten JSON-Sicherung exportieren. ZIP entpacken und alle enthaltenen Dateien im GitHub-Repo-Hauptverzeichnis ersetzen (Commit changes). App nicht deinstallieren; keine Website-Daten löschen. Eventuell neue Version nach GitHub-Deployment laden.

DATENSCHUTZ: Nie Schulbuchseiten oder personenbezogene Schülerdaten ins öffentliche GitHub-Repo hochladen. Material-Dateien aus IndexedDB sind nicht Teil des JSON-Exports.

TEST: CSS und JS separat geprüft; visuelle Darstellung mit Chromium-Screenshot kontrolliert. Ein iPad-Praxistest steht noch aus.


0.8.1 – Materialstudio: Sichtbarer Hinweis auf die ausgewählte Unterrichtsstunde, eindeutige Statusrückmeldung nach dem Fotoimport, zusätzlicher Button zum erneuten Übernehmen. Der Datei-Input wird nach erfolgreichem Speichern nicht mehr geleert; iPadOS zeigt dadurch nicht fälschlich sofort „Keine Datei ausgewählt“. Bei nur einer Reihe/Stunde automatische Vorauswahl. Kein Löschen vorhandener Daten.
