#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_HOME="$(mktemp -d /tmp/zstheme-smoke.XXXXXX)"
trap 'rm -rf "$TMP_HOME"' EXIT

mkdir -p "$TMP_HOME/.claude"
ln -s "$ROOT_DIR/themes" "$TMP_HOME/.claude/themes"

cat > "$TMP_HOME/sample.json" <<'EOF'
{
  "model": { "display_name": "Opus 4.5" },
  "workspace": { "current_dir": "/tmp/my-project" },
  "context_window": { "used_percentage": 35 },
  "cost": {
    "total_duration_ms": 3600000,
    "total_lines_added": 10,
    "total_lines_removed": 4
  }
}
EOF

HOME="$TMP_HOME" node bin/zstheme.js --list >/dev/null
HOME="$TMP_HOME" node bin/zstheme.js --preview >/dev/null
HOME="$TMP_HOME" node bin/zstheme.js 2line >/dev/null
HOME="$TMP_HOME" node bin/zstheme.js rainbow-badges >/dev/null

themes=("2line" "custom-2line" "rainbow-badges")
for theme in "${themes[@]}"; do
    cat > "$TMP_HOME/.claude/theme-config.sh" <<EOF
CLAUDE_THEME="$theme"
EOF

    PATH="/usr/bin:/bin" HOME="$TMP_HOME" bash statusline.sh < "$TMP_HOME/sample.json" >/tmp/zstheme-smoke-status.out 2>/tmp/zstheme-smoke-status.err

    if [[ -s /tmp/zstheme-smoke-status.err ]]; then
        echo "statusline emitted stderr for theme '$theme'."
        cat /tmp/zstheme-smoke-status.err
        exit 1
    fi

    # Strip ANSI codes before searching (animated themes insert codes per-character)
    local_stripped=$(sed 's/\x1b\[[0-9;]*m//g' /tmp/zstheme-smoke-status.out)
    if ! echo "$local_stripped" | grep -qE "Opus|my-project|$theme"; then
        echo "statusline smoke output check failed for theme '$theme'."
        exit 1
    fi
done

echo "Smoke checks passed."
