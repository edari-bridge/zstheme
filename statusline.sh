#!/bin/bash
# Claude Code Statusline Engine
# 입력(JSON) 파싱 -> 런타임 데이터 수집 -> 테마 렌더링

set -o pipefail

INPUT="$(cat)"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_FILE="$SCRIPT_DIR/themes/_modules/engine/statusline_engine.sh"

if [[ ! -f "$ENGINE_FILE" ]]; then
    echo "🧠 Unknown  🔋 0%"
    exit 0
fi

source "$ENGINE_FILE"

init_runtime_defaults
debug_log_input "$INPUT"

parse_statusline_input "$INPUT"
collect_git_info
collect_rate_info
render_theme_output
