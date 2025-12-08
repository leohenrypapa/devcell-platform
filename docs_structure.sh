#!/bin/bash
OUT=docs_structure.txt
echo "Dumping docs folder structure to $OUT"
if command -v tree &> /dev/null; then
    tree docs > "$OUT"
else
    find docs -print | sed -e 's;[^/]*/;|   ;g;s;|   \([^|]\);\+\--- \1;' > "$OUT"
fi

echo "Done."
