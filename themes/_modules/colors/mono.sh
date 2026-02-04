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

    # 기본 글씨색 (모델명과 동일)
    C_BASE="$MONO_2"  # 250

    # Git 상태 색상
    C_DIM_STATUS="$C_BASE"           # n=0: 기본 글씨
    C_BRIGHT_STATUS=$'\033[1;38;5;252m'  # n≠0: 강조 (유지)
    C_DIM_SYNC="$C_BASE"             # n=0: 기본 글씨
    C_BRIGHT_SYNC=$'\033[1;38;5;250m'    # n≠0: 강조 (유지)

    # Rate limit 색상 (기본 글씨)
    C_RATE="$C_BASE"
    C_BURN="$C_BASE"
    C_TIME="$C_BASE"

    # 아이콘 색상 (컬러 모드와 동일 - nerd 모드에서 사용)
    C_I_BRANCH=$'\033[93m'      # 노랑
    C_I_TREE=$'\033[92m'        # 녹색
    C_I_DIR=$'\033[96m'         # 시안
    C_I_MODEL=$'\033[95m'       # 마젠타
    C_I_STATUS=$'\033[38;5;111m'  # 파랑
    C_I_SYNC=$'\033[38;5;141m'    # 보라
    # C_I_CTX는 컨텍스트 조건문에서 동적 설정
    C_I_RATE=$'\033[38;5;229m'   # 노랑
    C_I_BURN=$'\033[38;5;216m'   # 주황
    C_I_TIME=$'\033[38;5;75m'    # 파랑
    C_I_THEME=$'\033[38;5;229m'  # 노랑

    # 박스/칩 테두리 (회색)
    C_BOX=$'\033[38;5;240m'
    C_CHIP=$'\033[38;5;242m'

    # 칩/카드 배경색 (밝기 차이 극대화)
    # C_DIR=MONO_4=240이므로 충돌 피해 다른 값 사용
    C_BG_LOC=$'\033[48;5;239m'  # 중간 어두움
    C_BG_GIT=$'\033[48;5;237m'  # LOC에 가깝게
    C_BG_SES=$'\033[48;5;233m'  # 더 어두움
    C_BG_CTX=$'\033[48;5;236m'  # 배터리/컨텍스트
    C_BG_THEME=$'\033[48;5;235m'  # 테마
    C_BG=$'\033[48;5;234m'

    # badges 레이아웃용 배경색 (회색 톤 섞기)
    C_BG_BRANCH=$'\033[48;5;236m'
    C_BG_TREE=$'\033[48;5;241m'
    C_BG_DIR=$'\033[48;5;234m'
    C_BG_STATUS=$'\033[48;5;239m'
    C_BG_SYNC=$'\033[48;5;235m'
    C_BG_MODEL=$'\033[48;5;240m'
    C_BG_RATE=$'\033[48;5;237m'
    C_BG_TIME=$'\033[48;5;242m'
    C_BG_BURN=$'\033[48;5;235m'
    C_BG_CTX_WARN=$'\033[48;5;240m'
    C_BG_CTX_CRIT=$'\033[48;5;244m'

    # 배터리 배경색 (위험할수록 밝게 - 눈에 띄도록)
    C_BAT_EMPTY=$'\033[48;5;236m'
    C_BAT_GREEN=$'\033[48;5;237m'   # 정상 = 어두움
    C_BAT_YELLOW=$'\033[48;5;242m'  # 경고 = 중간
    C_BAT_RED=$'\033[48;5;248m'     # 위험 = 밝음

    # 컨텍스트 기반 동적 색상 (회색 밝기 변화)
    if [[ "$CONTEXT_PCT" -ge 70 ]]; then
        # 위험: 가장 밝음
        C_BRANCH="$MONO_1"
        C_TREE="$MONO_1"
        C_DIR="$MONO_1"
        C_MODEL="$MONO_1"
        C_STATUS="$MONO_1"
        C_SYNC="$MONO_1"
        C_CTX=$'\033[1;38;5;255m'
        CTX_ICON="${ICON_CTX_CRIT:-🔥}"
        C_BAT_FILL="$C_BAT_RED"
        # 컨텍스트 % 텍스트만 빨간색 (경고 강조)
        C_CTX_TEXT=$'\033[1;91m'
        C_I_CTX=$'\033[1;91m'       # 아이콘도 빨간색 (nerd 모드용)
    elif [[ "$CONTEXT_PCT" -ge 50 ]]; then
        # 경고: 밝음
        C_BRANCH="$MONO_2"
        C_TREE="$MONO_2"
        C_DIR="$MONO_2"
        C_MODEL="$MONO_2"
        C_STATUS="$MONO_2"
        C_SYNC="$MONO_2"
        C_CTX=$'\033[1;38;5;250m'
        CTX_ICON="${ICON_CTX_WARN:-🪫}"
        C_BAT_FILL="$C_BAT_YELLOW"
        # 컨텍스트 % 텍스트만 주황색 (경고 강조)
        C_CTX_TEXT=$'\033[1;38;5;208m'
        C_I_CTX=$'\033[1;38;5;208m' # 아이콘도 주황색 (nerd 모드용)
    else
        # 정상: 기본 글씨 통일
        C_BRANCH="$C_BASE"
        C_TREE="$C_BASE"
        C_DIR="$C_BASE"
        C_MODEL="$C_BASE"
        C_STATUS="$C_BASE"
        C_SYNC="$C_BASE"
        C_CTX="$C_BASE"
        CTX_ICON="${ICON_CTX_NORM:-🔋}"
        C_BAT_FILL="$C_BAT_GREEN"
        C_CTX_TEXT="$C_BASE"
        C_I_CTX=$'\033[92m'         # 아이콘은 녹색 (nerd 모드용)
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
