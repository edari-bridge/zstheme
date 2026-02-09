#!/bin/bash
# Base Color Definitions - 모든 색상 모듈 공통 로직
# pastel.sh, mono.sh, custom.sh에서 source하여 사용

# 아이콘 색상 초기화 (모든 모드 공통 - 고정 컬러)
_init_icon_colors() {
    C_I_BRANCH=$'\033[93m'
    C_I_TREE=$'\033[92m'
    C_I_DIR=$'\033[96m'
    C_I_MODEL=$'\033[95m'
    C_I_STATUS=$'\033[38;5;111m'
    C_I_SYNC=$'\033[38;5;141m'
    C_I_RATE=$'\033[38;5;229m'
    C_I_BURN=$'\033[38;5;216m'
    C_I_TIME=$'\033[38;5;75m'
    C_I_THEME=$'\033[38;5;229m'
}

# 박스/칩 테두리 초기화
_init_box_colors() {
    C_BOX=$'\033[38;5;240m'
}

# 배터리 빈칸 배경 초기화
_init_battery_empty() {
    C_BAT_EMPTY=$'\033[48;5;236m'
}

# 컨텍스트 아이콘/색상 분기 (CTX_ICON, C_I_CTX)
_init_context_icon() {
    if [[ "$CONTEXT_PCT" -ge 70 ]]; then
        CTX_ICON="${ICON_CTX_CRIT:-🔥}"
        C_I_CTX=$'\033[1;91m'
    elif [[ "$CONTEXT_PCT" -ge 50 ]]; then
        CTX_ICON="${ICON_CTX_WARN:-🪫}"
        C_I_CTX=$'\033[1;38;5;208m'
    else
        CTX_ICON="${ICON_CTX_NORM:-🔋}"
        C_I_CTX=$'\033[92m'
    fi
}
