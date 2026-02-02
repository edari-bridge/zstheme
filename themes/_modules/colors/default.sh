#!/bin/bash
# Default Color Module - 기본 컬러 팔레트
# 각 요소별 고유 색상 (노랑, 녹색, 시안, 마젠타 등)

# ============================================================
# 기본 색상 팔레트 (컨텍스트 상태별)
# ============================================================

init_colors() {
    RST=$'\033[0m'

    # Git 상태 색상 (고정)
    C_DIM_STATUS=$'\033[38;5;111m'
    C_BRIGHT_STATUS=$'\033[1;38;5;153m'
    C_DIM_SYNC=$'\033[38;5;141m'
    C_BRIGHT_SYNC=$'\033[1;38;5;183m'

    # Rate limit 색상 (고정)
    C_RATE=$'\033[38;5;229m'
    C_BURN=$'\033[38;5;216m'
    C_TIME=$'\033[38;5;75m'

    # 박스/칩 테두리 (고정)
    C_BOX=$'\033[38;5;240m'
    C_CHIP=$'\033[38;5;245m'

    # 칩/카드 배경색 (고정)
    C_BG_LOC=$'\033[48;5;236m'
    C_BG_GIT=$'\033[48;5;238m'
    C_BG_SES=$'\033[48;5;234m'
    C_BG=$'\033[48;5;235m'

    # 배터리 배경색 (고정)
    C_BAT_EMPTY=$'\033[48;5;236m'
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
        C_CTX=$'\033[1;91m'
        CTX_ICON="${ICON_CTX_CRIT:-🔥}"
        C_BAT_FILL="$C_BAT_RED"
        C_CTX_TEXT="$C_CTX"
    elif [[ "$CONTEXT_PCT" -ge 50 ]]; then
        # 경고: 중간 밝기
        C_BRANCH=$'\033[1;33m'
        C_TREE=$'\033[1;32m'
        C_DIR=$'\033[1;36m'
        C_MODEL=$'\033[1;35m'
        C_CTX=$'\033[1;38;5;208m'
        CTX_ICON="${ICON_CTX_WARN:-🪫}"
        C_BAT_FILL="$C_BAT_YELLOW"
        C_CTX_TEXT="$C_CTX"
    else
        # 정상: 기본 색상
        C_BRANCH=$'\033[93m'
        C_TREE=$'\033[92m'
        C_DIR=$'\033[96m'
        C_MODEL=$'\033[95m'
        C_CTX=$'\033[0m'
        CTX_ICON="${ICON_CTX_NORM:-🔋}"
        C_BAT_FILL="$C_BAT_GREEN"
        C_CTX_TEXT="$C_CTX"
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
