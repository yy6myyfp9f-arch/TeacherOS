TeacherOS v0.1 – Funktionsfähiger lokaler Web-App-Prototyp

INHALT
index.html, app.js, manifest.webmanifest, sw.js, App-Symbole.

TESTEN AM RECHNER
Im entpackten Ordner: python3 -m http.server 8000
Im Browser: http://localhost:8000

IPAD-NUTZUNG
Für eine Installation als Home-Bildschirm-App muss der gesamte Ordner auf einem HTTPS-Webhost veröffentlicht werden, z. B. GitHub Pages (nur App-Code, KEINE privaten Schul-/Schülerdaten ins Repository!). Danach die HTTPS-Adresse auf dem iPad in Safari öffnen > Teilen > Zum Home-Bildschirm > Als Web-App öffnen.

FUNKTIONEN
Aufgaben (Termine, Priorität, erledigt), Wochenstundenplan, Notizen/Gesprächsprotokolle, ICS-Kalenderimport (einfache VEVENT), externe GoodNotes-/Drive-Links, regelbasierte Dashboard-Hinweise, KI-Arbeitsauftrag zur manuellen Übergabe, JSON-Sicherung/Wiederherstellung, Offline-App-Shell.

BEKANNTE GRENZEN
Keine OpenAI-API oder serverseitige KI, keine automatischen Erinnerungen, keine Google-Calendar-OAuth-Synchronisierung, keine GoodNotes-Daten-Synchronisierung. Keine Verarbeitung von RRULE-Serienterminen, Zeitzonen oder Kalenderupdates/Absagen. Kein Zugriffsschutz und keine lokale Verschlüsselung. LocalStorage ist kein sicherer Speicher für personenbezogene Schülerdaten. Nutzung nur mit unsensiblen Test-/Organisationsdaten.

ARCHITEKTUR NÄCHSTER AUSBAU
Frontend PWA (TypeScript/React möglich) -> abgesichertes Backend -> Auth -> Datenbank/Postgres mit Rechtekonzept -> Kalender OAuth -> KI-Proxy mit minimierten Daten -> Scheduler/Push -> Audit/Backups. Datenschutzprüfung vor Verarbeitung von Schülerdaten.
