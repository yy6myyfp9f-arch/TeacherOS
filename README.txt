TEACHEROS 1.0 – MEINE WOCHE · UNTERRICHTSPLANUNG · SPRACHE
===========================================================
Stand: 10. November 2026

UPDATE AUS DER VORHERIGEN VERSION (0.8.1):
1. TeacherOS auf iPad unter "Werkzeuge & Daten" -> "Daten & Sicherung" als JSON sichern.
2. Die entpackten Dateien dieses Pakets in das öffentliche GitHub-Repository
   yy6myyfp9f-arch/TeacherOS hochladen und bestehende Dateien ersetzen.
   Nicht die JSON-Datei, keine Schulbuchfotos, keine Schülerdaten zu GitHub hochladen!
3. "Commit changes" bestätigen und nach dem Deploy die bestehende TeacherOS-App öffnen.
   Bitte die App NICHT löschen – dadurch könnten lokal gespeicherte Materialien verschwinden.
4. Ab jetzt erscheint "Meine Woche" als Startseite.
5. Falls die PWA noch alte Dateien anzeigt: im Browser erneut die GitHub-Pages-Seite
   öffnen und wiederholt neu laden; Service Worker benötigt u. U. einen weiteren Start.

WAS IST NEU?
- Grundstundenplan einmalig, danach wöchentlich wiederkehrend.
- iPad: Wochenraster Montag bis Freitag / 1.–9. Stunde.
- iPhone: großflächige Tageskarten, Wochentage einzeln anwählbar.
- Einzeltermine vs. dauerhafte Änderungen ab gewähltem Datum.
- Stunden tauschen, in freie Felder verschieben, Stunden entfallen lassen.
  Verknüpfte Unterrichtsplanung geht beim Tauschen/Verschieben mit.
- Unterrichtsreihen und bereits angelegte Reihenstunden mit Terminen verknüpfen.
- Aus einem Unterrichtstermin: Planung speichern, Materialstudio öffnen,
  ChatGPT-Materialauftrag erzeugen, Sprachplanung / Rückblick starten.
- Geplante Inhalte auf den nächsten passenden Termin derselben Klasse/Fach übernehmen.
- Offizielle BW-Schulferien 2026/27 und 2027/28 (auch 2028/29 schon enthalten),
  Gründonnerstage/Reformationsfeste gemäß Ministeriumsangabe und gesetzliche Feiertage.
- Individuelle bewegliche Ferientage / schulfreie Tage eintragbar.
- Navigation vereinfacht: Woche, Reihen, Aufgaben, Kalender, Werkzeuge & Daten.
- Sprachplanung, lokaler Audio-Recorder und WebUntis-Weblink aus 0.9 enthalten.
  Version 0.9 muss NICHT separat installiert werden.

SO LEGST DU DEN GRUNDSTUNDENPLAN AN:
- "Meine Woche" öffnen, eine leere Stundenplankachel antippen.
- Fach und Klasse eingeben. Optional Unterrichtsreihe wählen.
- Bei einem freien Feld ist "Dauerhaft ab diesem Datum" vorausgewählt.
- "Stundenplan speichern" tippen. Der Eintrag wiederholt sich wöchentlich.
- Einmalige Änderungen über "Nur diesen Termin".
- Stunden tauschen: "Stunden tauschen" -> Ausgang -> Ziel. Für Verschieben
  ein freies Zielfeld wählen. Auch über mehrere Wochen möglich.

UNTERRICHTSPLANUNG DIREKT AUS DER STUNDE:
- Stunde antippen, Reihe verknüpfen, Stundenthema/Lernziel/Planung/Status bearbeiten.
- "Unterrichtsplanung speichern".
- "Material hinzufügen" eröffnet das Materialstudio mit derselben Reihe und Stunde.
- "Material erstellen" zeigt einen kopierbaren KI-Auftrag an – echte Dateien
  werden nicht innerhalb dieser kostenlosen, lokalen PWA generiert. Für die
  Materialerstellung ChatGPT öffnen und vorhandene Dateien dort selbst anhängen.
- "Sprachplanung" / "Rückblick" verwendet Diktat der iOS-Tastatur oder lokale
  Audioaufnahme. Audio wird NICHT transkribiert und NICHT per JSON exportiert.

FERIEN & UNTERRICHTSFREIE TAGE:
- Offizielle Ferien: https://km.baden-wuerttemberg.de/de/service/ferien
- Gesetzliche Feiertage BW werden nach Kalenderdaten berechnet.
- Schulinterne bewegliche Ferientage sind NICHT bekannt und müssen manuell unter
  "Unterrichtsfreie Tage & Grundstundenplan verwalten" ergänzt werden.
- Unterricht während Ferien kann als Einzel-Ausnahme manuell eingetragen werden.
- Ferien entfernen keine Planungen oder Unterrichtsreihen.

DATEN & SICHERHEIT:
- Daten bleiben unter dem bisherigen LocalStorage-Schlüssel teacheros-v01.
- Alte Datenfelder (tasks, notes, events, reihen, slots, lessons) bleiben erhalten.
- Neue Stundenplandaten im JSON-Export unter data.scheduleV1.
- Bereits bestehende Einträge aus dem alten Stundenplan werden vorsichtig als
  unklassifizierte Termine übernommen, Fach/Klasse also nicht erraten.
- Bilder/PDFs aus dem Materialstudio und Audioaufnahmen sind separat lokal
  gespeichert und NICHT Teil der JSON-Sicherung.
- Geräte synchronisieren NICHT automatisch. iPad -> iPhone nur über manuelle
  JSON-Übertragung (z. B. AirDrop) und anschließenden Import.
- Keine WebUntis-API: nur Schnelllink zur WebUntis-Webseite.
- Es handelt sich um eine private PWA, kein Schulverwaltungssystem.
- Datenschutz beachten: keine personenbezogenen Schülerdaten speichern.

TECHNISCHE PRÜFUNG:
- JavaScript-Syntax der Module geprüft.
- Browser-Test der Wochenansicht, wöchentlichen Wiederholung, Zuordnung zu Reihen,
  Planungsdaten, KI-Auftrag und Materialstudio-Navigation durchgeführt.
- Darstellung der Wochenansicht auf Desktop und in schmaler Handy-Ansicht geprüft.
- Echte Kamera-/Mikrofon-Berechtigungen unter iOS sowie PWA-Cache-Aktualisierung
  sind weiterhin am Zielgerät zu testen.
