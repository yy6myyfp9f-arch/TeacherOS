TeacherOS 0.7.2 – Screenshot aus der Zwischenablage & Fotos, inklusive Korrektur aus 0.7.1.

NEU: Im Materialstudio unter „2 · Material hinzufügen“ gibt es „🖼️ Screenshot aus Fotos“ sowie „📋 Kopierten Screenshot einfügen“. Screenshot beispielsweise in Fotos öffnen → Teilen → Kopieren; in TeacherOS Unterrichtsreihe und Stunde auswählen → „Aus Zwischenablage übernehmen“. Je nach iPadOS/Safari kann die Browserberechtigung fehlen oder eine Freigabe erforderlich sein. Alternative: in das Einfügefeld tippen, gedrückt halten, „Einsetzen“ wählen. Wenn iPadOS den Bildinhalt per Einsetzen nicht bereitstellt, „Screenshot aus Fotos“ wählen; dieser Weg benötigt kein Kopieren. Kopierte Bilder werden nur lokal in IndexedDB der ausgewählten Unterrichtsstunde abgelegt.

ENTHÄLT v0.7.1: Neue Unterrichtsreihen erscheinen beim Wechsel ins Materialstudio, ohne die App neu zu starten. Mindestens eine Unterrichtsstunde muss vorhanden sein.

INSTALLATION: Erst Daten → JSON-Sicherung exportieren. ZIP entpacken, ALLE enthaltenen Dateien im GitHub-Repo ins Hauptverzeichnis hochladen und vorhandene Dateien ersetzen; Commit changes. App NICHT deinstallieren und keine Websitedaten löschen. Nach Deployment ggf. die Ansicht neu laden, damit der Service Worker v0.7.2 aktiv wird.

SICHERHEIT: Bildmaterialien, Screenshots und Schulbuchseiten NICHT ins öffentliche GitHub-Repository hochladen. JSON-Backup enthält die separat gespeicherten Materialdateien NICHT; Originale separat sicher aufbewahren. Keine automatische Übergabe an ChatGPT und keine zusätzlichen API-Kosten. max. 35 MB pro Datei. iPadOS-Paste-Verhalten hängt von den Browserberechtigungen ab, ist bislang nicht auf dem Nutzer-iPad getestet.
