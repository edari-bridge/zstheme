#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

count=0

while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    bash -n "$file"
    count=$((count + 1))
done < <(
    {
        echo "statusline.sh"
        echo "install.sh"
        echo "uninstall.sh"
        rg --files themes -g '*.sh'
    } | sort -u
)

echo "Shell syntax check passed ($count files)."
