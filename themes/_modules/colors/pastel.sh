#!/bin/bash
# Default Color Module - 기본 컬러 팔레트
# 각 요소별 고유 색상 (노랑, 녹색, 시안, 마젠타 등)

COLORS_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$COLORS_DIR/base_colors.sh"

# ============================================================
# 기본 색상 팔레트 (컨텍스트 상태별)
# ============================================================

init_colors() {
    RST=$'\033[0m'
    _init_icon_colors
    _init_box_colors
    _init_battery_empty
    _init_context_icon

    # Git 상태 색상 (고정)
    C_DIM_STATUS=$'\033[38;5;111m'
    C_BRIGHT_STATUS=$'\033[1;38;5;153m'
    C_DIM_SYNC=$'\033[38;5;141m'
    C_BRIGHT_SYNC=$'\033[1;38;5;183m'

    # Rate limit 색상 (고정)
    C_RATE=$'\033[38;5;229m'
    C_BURN=$'\033[38;5;216m'
    C_TIME=$'\033[38;5;75m'

    # badges 레이아웃용 배경색 (글자색의 어두운 버전)
    C_BG_BRANCH=$'\033[48;5;58m'    # Yellow → Dark Yellow/Olive
    C_BG_TREE=$'\033[48;5;22m'      # Green → Dark Green
    C_BG_DIR=$'\033[48;5;23m'       # Cyan → Dark Cyan/Teal
    C_BG_STATUS=$'\033[48;5;24m'    # Blue
    C_BG_SYNC=$'\033[48;5;53m'      # Purple → Dark Purple
    C_BG_MODEL=$'\033[48;5;53m'     # Magenta → Dark Magenta
    C_BG_RATE=$'\033[48;5;58m'      # Yellow → Dark Yellow
    C_BG_TIME=$'\033[48;5;24m'      # Blue
    C_BG_BURN=$'\033[48;5;94m'      # Orange → Dark Orange
    C_BG_CTX=$'\033[48;5;22m'       # Context → Dark Green (정상)
    C_BG_CTX_WARN=$'\033[48;5;94m'  # Context → Dark Orange (경고)
    C_BG_CTX_CRIT=$'\033[48;5;52m'  # Context → Dark Red (위험)

    # 칩 테두리
    C_CHIP=$'\033[38;5;245m'

    # 칩/카드 배경색 (그룹별 색상 구분)
    C_BG_LOC=$'\033[48;5;23m'   # Teal (위치 정보)
    C_BG_GIT=$'\033[48;5;24m'   # Blue (Git 상태)
    C_BG_SES=$'\033[48;5;53m'   # Purple (세션 정보)
    C_BG=$'\033[48;5;235m'

    # 배터리 배경색 (고정)
    C_BAT_GREEN=$'\033[48;5;23m'
    C_BAT_YELLOW=$'\033[48;5;94m'
    C_BAT_RED=$'\033[48;5;52m'

    # 컨텍스트 기반 동적 색상
    if [[ "$CONTEXT_PCT" -ge 70 ]]; then
        # 위험: 밝은 색상
        C_BRANCH=$'\033[1;93m'
        C_TREE=$'\033[1;92m'
        C_DIR=$'\033[1;96m'
        C_MODEL=$'\033[1;95m'
        C_STATUS=$'\033[1;38;5;153m'
        C_SYNC=$'\033[1;38;5;183m'
        C_CTX=$'\033[1;91m'
        C_CTX_TEXT=$'\033[1;91m'
        C_BAT_FILL="$C_BAT_RED"
    elif [[ "$CONTEXT_PCT" -ge 50 ]]; then
        # 경고: 중간 밝기
        C_BRANCH=$'\033[1;33m'
        C_TREE=$'\033[1;32m'
        C_DIR=$'\033[1;36m'
        C_MODEL=$'\033[1;35m'
        C_STATUS=$'\033[1;38;5;117m'
        C_SYNC=$'\033[1;38;5;147m'
        C_CTX=$'\033[1;38;5;208m'
        C_CTX_TEXT=$'\033[1;38;5;208m'
        C_BAT_FILL="$C_BAT_YELLOW"
    else
        # 정상: 기본 색상
        C_BRANCH=$'\033[93m'
        C_TREE=$'\033[92m'
        C_DIR=$'\033[96m'
        C_MODEL=$'\033[95m'
        C_STATUS=$'\033[38;5;111m'
        C_SYNC=$'\033[38;5;141m'
        C_CTX=$'\033[92m'
        C_CTX_TEXT=$'\033[0m'
        C_BAT_FILL="$C_BAT_GREEN"
    fi
}

# Rate limit 동적 색상
get_rate_color() {
    if [[ "$RATE_LIMIT_PCT" -ge 80 ]]; then
        echo $'\033[1;91m'
    elif [[ "$RATE_LIMIT_PCT" -ge 50 ]]; then
        echo $'\033[1;38;5;208m'
    else
        echo $'\033[38;5;229m'
    fi
}
