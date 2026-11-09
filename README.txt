TeacherOS 0.7.1 · Korrektur: Das Materialstudio aktualisiert die Unterrichtsreihen-Liste beim Öffnen. Neu angelegte Reihen erscheinen nun ohne Neustart. Für einen Datei-Upload muss mindestens eine Unterrichtsstunde in der Reihe angelegt sein.

TeacherOS 0.7 · Materialstudio (lokaler Prototyp)

UPDATE: Sichere zuerst unter Daten → JSON exportieren. Entpacke die ZIP und lade alle Dateien aus diesem Ordner (nicht den Ordner selbst) ins Wurzelverzeichnis des GitHub-Repositories, vorhandene Dateien ersetzen. Neu: material.js. Die installierte PWA NICHT deinstallieren.

NEU: Materialstudio: Kamerafoto (iPad Safari nach Geräteunterstützung), Auswahl von Bildern/PDF/DOCX/PPTX, Speicherung von Blobs lokal in IndexedDB, Zuordnung zu Unterrichtsstunden, herunterladbare Originale, Touch-Zuschnitt für Bilder und PDF-Seiten, kontextbezogener ChatGPT-Auftrag. PDF.js wird wie im MathLab beim ersten Öffnen einer PDF über CDN geladen (Internet notwendig). Dateigröße max. 35 MB. DOCX/PPTX werden gespeichert, aber nicht im Browser analysiert oder zugeschnitten.

DATENSCHUTZ & BACKUP: Materialdateien sind NICHT Teil der bisherigen JSON-Datensicherung. Originale weiterhin separat sichern. Nicht nach GitHub hochladen. Kein Login, keine Synchronisierung zwischen Geräten. ChatGPT erhält keine Datei automatisch: Materialdatei selbst im Chat hochladen. Keine API-Kosten.

Bitte testen: Reihe Weimarer Republik öffnen → Materialien → PDF/Bild wählen → Zuschnitt → speichern → App neu öffnen → Datei erhalten? KI-Auftrag enthält Materialnamen und fordert tatsächliche Dateianhänge.
