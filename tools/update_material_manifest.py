#!/usr/bin/env python3
"""Erzeugt die lokale Dateiliste für alle Dateien unter materialien/."""

from __future__ import annotations

import argparse
import json
import mimetypes
from pathlib import Path

IGNORED_NAMES = {".gitkeep", "thumbs.db", "desktop.ini"}


def build_manifest(root: Path) -> list[dict[str, object]]:
    materialien = root / "materialien"
    if not materialien.is_dir():
        raise SystemExit(f"Ordner nicht gefunden: {materialien}")

    manifest: list[dict[str, object]] = []
    for path in sorted(p for p in materialien.rglob("*") if p.is_file()):
        if path.name.lower() in IGNORED_NAMES or path.name.startswith("."):
            continue
        relative = path.relative_to(root).as_posix()
        mime, _ = mimetypes.guess_type(path.name)
        manifest.append({
            "path": relative,
            "filename": path.name,
            "size": path.stat().st_size,
            "mime": mime or "application/octet-stream",
        })
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Erzeugt data/material-files.json für die lokale Vorschau.")
    parser.add_argument(
        "root",
        nargs="?",
        default=Path(__file__).resolve().parents[1],
        type=Path,
        help="Wurzelordner der Website (Standard: Repository-Wurzel)",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    target = root / "data" / "material-files.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    manifest = build_manifest(root)
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(manifest)} Dateien erfasst: {target}")


if __name__ == "__main__":
    main()
