# Materialien hochladen

Die Ordnernummern bestimmen die Reihenfolge auf der Webseite. Die Nummern werden auf der Seite nicht angezeigt.

## Einzelne Datei

PDF, Bild, Video oder eine vollständig eigenständige HTML-Datei direkt in den passenden Unterordner hochladen.

## Simulation mit mehreren Dateien

Für jede Simulation einen eigenen Ordner anlegen. Die Startdatei muss `index.html` heißen. CSS-, JavaScript-, Bild- und Datendateien kommen in denselben Ordner oder dessen Unterordner. Auf der Kursseite erscheint nur die Simulation; ihre Hilfsdateien werden nicht einzeln angezeigt.

Beispiel:

```text
materialien/03 Kinematik/01 Ort-Zeit-Diagramm/Simulation Bewegung/
├── index.html
├── app.js
├── styles.css
└── bilder/
    └── auto.png
```

## Löschen

Eine Datei oder einen Simulationsordner auf GitHub löschen und committen. Der zugehörige Link verschwindet beim nächsten GitHub-Pages-Aufbau automatisch.

## Externe Links

Für externe Links eine Datei `links.json` in den passenden Ordner legen. Eine Vorlage befindet sich unter `vorlagen/links.json`. Einen nicht mehr funktionierenden Link durch Löschen des entsprechenden JSON-Eintrags entfernen.

## Klassenarbeiten

Für Klassenarbeiten nur diese beiden Ordner verwenden:

- `07 Klassenarbeiten/01 Materialsammlung/`
- `07 Klassenarbeiten/02 Klassenarbeitensammlung/`
