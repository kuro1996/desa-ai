#!/usr/bin/env python3
"""DesaAI — validate a generated .docx by READING it back with python-docx.

Paket 47: structural checks (ZIP magic, word/document.xml) prove the file
is OOXML, but they do not prove Word/LibreOffice can actually open it.
This script opens the file with python-docx and prints its real content
(paragraphs + tables) as JSON, so the headless suite can assert on the
document Word would show — not just on raw XML bytes.

Usage: python3 scripts/validate-docx.py <file.docx> [<file2.docx> ...]
Output: one JSON object per file on stdout: {"file", "ok", "paragraphs",
"tables", "error"}.
"""
import json
import sys

try:
    import docx
except ImportError as exc:  # pragma: no cover
    print(json.dumps({"ok": False, "error": f"python-docx missing: {exc}"}))
    sys.exit(2)


def validate(path):
    try:
        doc = docx.Document(path)
    except Exception as exc:  # not a readable .docx
        return {"file": path, "ok": False, "paragraphs": [], "tables": [], "error": str(exc)}
    paragraphs = [p.text for p in doc.paragraphs]
    tables = []
    for table in doc.tables:
        tables.append([[cell.text for cell in row.cells] for row in table.rows])
    return {"file": path, "ok": True, "paragraphs": paragraphs, "tables": tables, "error": ""}


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "usage: validate-docx.py <file.docx> ..."}))
        sys.exit(2)
    for path in sys.argv[1:]:
        print(json.dumps(validate(path), ensure_ascii=False))


if __name__ == "__main__":
    main()
