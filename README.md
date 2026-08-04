# TGM11-Physikkurs auf GitHub Pages

Die Seite ist so aufgebaut, dass Unterrichtsmaterialien nur noch in den passenden Ordner unter `materialien/` hochgeladen werden müssen. PDFs, Bilder, Videos, Downloads, eigenständige HTML-Übungen und komplette Simulationen werden automatisch auf der Kursseite angezeigt.

## Neue Materialien hochladen

1. Auf GitHub den Ordner `materialien` öffnen.
2. Den passenden Themen- und Unterthemenordner öffnen.
3. **Add file → Upload files** wählen.
4. Datei(en) hochladen und **Commit changes** drücken.
5. Nach dem GitHub-Pages-Aufbau erscheint das Material automatisch.

Die Nummern am Anfang der Ordnernamen legen nur die Reihenfolge fest und werden auf der Webseite ausgeblendet.

### PDF, Bild, Video oder Download

Die Datei direkt in den passenden Unterthemenordner hochladen.

### Eigenständige HTML-Übung

Eine einzelne HTML-Datei, die keine weiteren Dateien benötigt, direkt in den passenden Unterthemenordner hochladen.

### Simulation oder HTML-Übung mit CSS, JavaScript und Bildern

Einen eigenen Unterordner für die Simulation anlegen und die Startdatei `index.html` nennen. Alle zugehörigen Dateien bleiben in diesem Simulationsordner. Auf der Kursseite wird nur ein Eintrag für die Simulation angezeigt; Hilfsdateien wie JavaScript, CSS und Bilder werden ausgeblendet.

```text
materialien/03 Kinematik/01 Ort-Zeit-Diagramm/Simulation Bewegung/
├── index.html
├── app.js
├── styles.css
└── bilder/
    └── auto.png
```

Eine einfache Vorlage liegt unter `vorlagen/simulation/`.

### Externe Links ohne HTML-Datei

Eine Datei namens `links.json` in den gewünschten Themenordner legen. Eine Vorlage liegt unter `vorlagen/links.json`. Beispiel:

```json
[
  {
    "title": "PhET-Simulation",
    "url": "https://example.org/",
    "description": "Kurze Beschreibung"
  }
]
```

Zum Entfernen eines externen Links einfach den zugehörigen Eintrag aus `links.json` löschen. Ungültige Einträge ohne `http://` oder `https://` werden nicht angezeigt.

## Material oder fehlerhaften Link entfernen

Die betreffende Datei oder den vollständigen Simulationsordner auf GitHub löschen und committen. Weil die Webseite ihre Materialliste aus den tatsächlich vorhandenen Dateien erzeugt, verschwindet der Eintrag automatisch. Es bleiben keine alten Dateilinks zurück.

Die früheren, nicht funktionierenden Moodle-Forum-Verweise wurden entfernt. Externe Links werden entweder in einer eigenen HTML-Datei oder übersichtlich über `links.json` gepflegt.

## Neues Unterthema oder neues Thema anlegen

Ein neuer Ordner reicht aus. Für eine feste Reihenfolge eine Nummer voranstellen, zum Beispiel:

```text
materialien/03 Kinematik/05 Kreisbewegung/
materialien/08 Quantenphysik/01 Grundlagen/
```

Neue Themen ohne vorhandenes Titelbild erhalten automatisch eine neutrale Kachel.

## GitHub Pages veröffentlichen

1. Repository **Settings → Pages** öffnen.
2. Unter **Build and deployment** die Quelle **Deploy from a branch** auswählen.
3. Branch **main** und Ordner **/(root)** wählen.
4. Speichern.

Wichtig: Keine Datei namens `.nojekyll` anlegen. GitHub Pages erstellt bei jedem Commit automatisch `data/material-files-auto.json` aus allen Dateien unter `materialien/`.

## Lokal testen

```bash
python3 tools/update_material_manifest.py .
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen. Optional können lokale Verweise vorab geprüft werden:

```bash
python3 tools/check_internal_links.py .
```

## Datenschutz und Rechte

Alles im öffentlichen Repository und auf der GitHub-Pages-Seite ist öffentlich abrufbar. Vor dem Hochladen personenbezogene Daten und Materialien ohne Veröffentlichungsrecht entfernen.
