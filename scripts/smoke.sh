#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_HOME="$(mktemp -d /tmp/zstheme-smoke.XXXXXX)"
trap 'rm -rf "$TMP_HOME"' EXIT

mkdir -p "$TMP_HOME/.claude"
ln -s "$ROOT_DIR/themes" "$TMP_HOME/.claude/themes"

# 테스트용 mock git repo 생성 (bash/Node.js 동일 데이터 보장)
MOCK_REPO="$TMP_HOME/mock-project"
mkdir -p "$MOCK_REPO"
git -C "$MOCK_REPO" init -q
git -C "$MOCK_REPO" config user.email "test@test.com"
git -C "$MOCK_REPO" config user.name "test"
touch "$MOCK_REPO/file.txt"
git -C "$MOCK_REPO" add file.txt
git -C "$MOCK_REPO" commit -q -m "init"

cat > "$TMP_HOME/sample.json" <<EOF
{
  "model": { "display_name": "Opus 4.5" },
  "workspace": { "current_dir": "$MOCK_REPO" },
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
    local_stripped=$(sed $'s/\x1b\\[[0-9;]*m//g' /tmp/zstheme-smoke-status.out)
    if ! echo "$local_stripped" | grep -qE "Opus|my-project|$theme"; then
        echo "statusline smoke output check failed for theme '$theme'."
        exit 1
    fi
done

# ============================================================
# bash ↔ Node.js renderer 출력 구조 비교
# 모든 레이아웃 × 애니메이션 조합에서 전체 토큰 비교
# ============================================================

strip_ansi() {
    sed $'s/\x1b\\[[0-9;]*m//g' | sed 's/  */ /g' | sed 's/^ //;s/ $//'
}

# 토큰 추출: 이모지·특수문자 제거, 의미 있는 단어/숫자만
extract_tokens() {
    # 공백 분리 → 이모지/특수문자 strip → 빈 값 제거 → 정렬
    tr ' ' '\n' | sed 's/[^a-zA-Z0-9.%$\/·↑↓+~-]//g' | sed '/^$/d' | sort
}

# 모든 레이아웃 × 대표 애니메이션 조합
compare_themes=("1line" "2line" "card" "bars" "badges" "rainbow-1line" "rainbow-2line" "rainbow-card" "rainbow-bars" "rainbow-badges" "mono-2line" "mono-rainbow-badges")
compare_fail=0

for theme in "${compare_themes[@]}"; do
    cat > "$TMP_HOME/.claude/theme-config.sh" <<EOF
CLAUDE_THEME="$theme"
EOF

    # bash output
    bash_raw=$(PATH="/usr/bin:/bin" HOME="$TMP_HOME" bash statusline.sh < "$TMP_HOME/sample.json" 2>/dev/null)
    bash_out=$(echo "$bash_raw" | strip_ansi)

    # Node.js output
    node_raw=$(HOME="$TMP_HOME" CLAUDE_THEME="$theme" node bin/statusline-node.js < "$TMP_HOME/sample.json" 2>/dev/null)
    node_out=$(echo "$node_raw" | strip_ansi)

    # 1) 줄 수 비교
    bash_lines=$(echo "$bash_out" | wc -l | tr -d ' ')
    node_lines=$(echo "$node_out" | wc -l | tr -d ' ')
    if [[ "$bash_lines" != "$node_lines" ]]; then
        echo "FAIL [$theme] line count: bash=$bash_lines node=$node_lines"
        compare_fail=1
        continue
    fi

    # 2) 전체 토큰 비교: bash에만 있는 토큰 / node에만 있는 토큰
    bash_tokens=$(echo "$bash_out" | extract_tokens)
    node_tokens=$(echo "$node_out" | extract_tokens)

    bash_only=$(comm -23 <(echo "$bash_tokens") <(echo "$node_tokens"))
    node_only=$(comm -13 <(echo "$bash_tokens") <(echo "$node_tokens"))

    if [[ -n "$bash_only" || -n "$node_only" ]]; then
        echo "FAIL [$theme] token mismatch"
        [[ -n "$bash_only" ]] && echo "  bash only: $(echo $bash_only | tr '\n' ' ')"
        [[ -n "$node_only" ]] && echo "  node only: $(echo $node_only | tr '\n' ' ')"
        compare_fail=1
    fi
done

if [[ "$compare_fail" -ne 0 ]]; then
    echo "Renderer comparison FAILED."
    exit 1
fi

rm -f "$TMP_HOME/.claude/theme-config.sh"
PATH="/usr/bin:/bin" env -u CLAUDE_THEME HOME="$TMP_HOME" bash statusline.sh < "$TMP_HOME/sample.json" >/tmp/zstheme-smoke-status.out 2>/tmp/zstheme-smoke-status.err

if [[ -s /tmp/zstheme-smoke-status.err ]]; then
    echo "statusline emitted stderr for default theme fallback."
    cat /tmp/zstheme-smoke-status.err
    exit 1
fi

default_stripped=$(sed $'s/\x1b\\[[0-9;]*m//g' /tmp/zstheme-smoke-status.out)
if ! echo "$default_stripped" | grep -q "2line"; then
    echo "statusline default theme fallback check failed (expected 2line)."
    exit 1
fi

echo "Smoke checks passed."
