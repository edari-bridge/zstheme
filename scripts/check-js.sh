#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

count=0

while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    node --check "$file"
    count=$((count + 1))
done < <(rg --files src bin -g '*.js')

if [[ $count -eq 0 ]]; then
    echo "No JavaScript files found."
    exit 0
fi

echo "JavaScript syntax check passed ($count files)."
