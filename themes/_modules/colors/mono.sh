#!/bin/bash
# Mono Color Module - 회색 그라데이션 팔레트
# 모든 색상을 회색 계열로 통일

# ============================================================
# 모노 색상 팔레트 (회색 그라데이션)
# ============================================================

init_colors() {
    RST=$'\033[0m'

    # 회색 그라데이션
    MONO_1=$'\033[38;5;255m'  # 가장 밝음 (중요값)
    MONO_2=$'\033[38;5;250m'  # 밝음
    MONO_3=$'\033[38;5;245m'  # 중간
    MONO_4=$'\033[38;5;240m'  # 어두움
    MONO_5=$'\033[38;5;236m'  # 가장 어두움

    # Git 상태 색상 (회색)
    C_DIM_STATUS=$'\033[38;5;243m'
    C_BRIGHT_STATUS=$'\033[1;38;5;252m'
    C_DIM_SYNC=$'\033[38;5;241m'
    C_BRIGHT_SYNC=$'\033[1;38;5;250m'

    # Rate limit 색상 (회색)
    C_RATE=$'\033[38;5;248m'
    C_BURN=$'\033[38;5;246m'
    C_TIME=$'\033[38;5;244m'

    # 박스/칩 테두리 (회색)
    C_BOX=$'\033[38;5;240m'
    C_CHIP=$'\033[38;5;242m'

    # 칩/카드 배경색 (어두운 회색)
    C_BG_LOC=$'\033[48;5;235m'
    C_BG_GIT=$'\033[48;5;237m'
    C_BG_SES=$'\033[48;5;233m'
    C_BG=$'\033[48;5;234m'

    # 배터리 배경색 (회색 계열)
    C_BAT_EMPTY=$'\033[48;5;236m'
    C_BAT_GREEN=$'\033[48;5;239m'
    C_BAT_YELLOW=$'\033[48;5;241m'
    C_BAT_RED=$'\033[48;5;243m'

    # 컨텍스트 기반 동적 색상 (회색 밝기 변화)
    if [[ "$CONTEXT_PCT" -ge 70 ]]; then
        # 위험: 가장 밝음
        C_BRANCH="$MONO_1"
        C_TREE="$MONO_1"
        C_DIR="$MONO_1"
        C_MODEL="$MONO_1"
        C_CTX=$'\033[1;38;5;255m'
        CTX_ICON="${ICON_CTX_CRIT:-🔥}"
        C_BAT_FILL="$C_BAT_RED"
        C_CTX_TEXT="$C_CTX"
    elif [[ "$CONTEXT_PCT" -ge 50 ]]; then
        # 경고: 밝음
        C_BRANCH="$MONO_2"
        C_TREE="$MONO_2"
        C_DIR="$MONO_2"
        C_MODEL="$MONO_2"
        C_CTX=$'\033[1;38;5;250m'
        CTX_ICON="${ICON_CTX_WARN:-🪫}"
        C_BAT_FILL="$C_BAT_YELLOW"
        C_CTX_TEXT="$C_CTX"
    else
        # 정상: 중간
        C_BRANCH="$MONO_3"
        C_TREE="$MONO_3"
        C_DIR="$MONO_3"
        C_MODEL="$MONO_3"
        C_CTX="$MONO_3"
        CTX_ICON="${ICON_CTX_NORM:-🔋}"
        C_BAT_FILL="$C_BAT_GREEN"
        C_CTX_TEXT="$C_CTX"
    fi
}

# Rate limit 동적 색상 (회색)
get_rate_color() {
    if [[ "$RATE_LIMIT_PCT" -ge 80 ]]; then
        echo $'\033[1;38;5;255m'
    elif [[ "$RATE_LIMIT_PCT" -ge 50 ]]; then
        echo $'\033[1;38;5;250m'
    else
        echo $'\033[38;5;245m'
    fi
}
