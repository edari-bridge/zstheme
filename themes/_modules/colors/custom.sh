#!/bin/bash
# Custom Color Module Template - 사용자 커스텀 색상 템플릿
# 이 파일은 직접 사용되지 않습니다.
# zstheme --edit 로 생성된 ~/.config/zstheme/custom-color.sh가 사용됩니다.
#
# 수동으로 커스텀 색상을 만들려면:
# 1. 이 파일을 ~/.config/zstheme/custom-color.sh로 복사
# 2. 아래 색상 코드 값을 수정
# 3. export CLAUDE_THEME=custom-2line 설정

# ============================================================
# 색상 코드 (256 color palette)
# 값 범위: 0-255
# 색상표 참고: https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit
# ============================================================

# Foreground color codes
C_BRANCH_CODE=93    # Yellow - Branch name
C_TREE_CODE=92      # Green - Worktree name
C_DIR_CODE=96       # Cyan - Directory name
C_MODEL_CODE=95     # Magenta - Model name
C_STATUS_CODE=111   # Light Blue - Git status
C_SYNC_CODE=141     # Light Purple - Sync status
C_RATE_CODE=229     # Light Yellow - Rate limit
C_BURN_CODE=216     # Light Orange - Burn rate
C_TIME_CODE=75      # Sky Blue - Time info
C_CTX_CODE=92       # Green - Context info

# Background color codes
C_BG_BRANCH_CODE=58  # Dark Yellow/Olive
C_BG_TREE_CODE=22    # Dark Green
C_BG_DIR_CODE=23     # Dark Cyan/Teal
C_BG_STATUS_CODE=24  # Dark Blue
C_BG_SYNC_CODE=53    # Dark Purple
C_BG_MODEL_CODE=53   # Dark Magenta
C_BG_LOC_CODE=23     # Teal (Location group)
C_BG_GIT_CODE=24     # Blue (Git group)
C_BG_SES_CODE=53     # Purple (Session group)

# ============================================================
# 색상 초기화 함수
# ============================================================

init_colors() {
    RST=$'\033[0m'

    # Git 상태 색상
    C_DIM_STATUS=$'\033[38;5;'"${C_STATUS_CODE}"'m'
    C_BRIGHT_STATUS=$'\033[1;38;5;'"${C_STATUS_CODE}"'m'
    C_DIM_SYNC=$'\033[38;5;'"${C_SYNC_CODE}"'m'
    C_BRIGHT_SYNC=$'\033[1;38;5;'"${C_SYNC_CODE}"'m'

    # Rate limit 색상
    C_RATE=$'\033[38;5;'"${C_RATE_CODE}"'m'
    C_BURN=$'\033[38;5;'"${C_BURN_CODE}"'m'
    C_TIME=$'\033[38;5;'"${C_TIME_CODE}"'m'

    # 아이콘 색상
    C_I_BRANCH=$'\033[38;5;'"${C_BRANCH_CODE}"'m'
    C_I_TREE=$'\033[38;5;'"${C_TREE_CODE}"'m'
    C_I_DIR=$'\033[38;5;'"${C_DIR_CODE}"'m'
    C_I_MODEL=$'\033[38;5;'"${C_MODEL_CODE}"'m'
    C_I_STATUS=$'\033[38;5;'"${C_STATUS_CODE}"'m'
    C_I_SYNC=$'\033[38;5;'"${C_SYNC_CODE}"'m'
    C_I_CTX=$'\033[38;5;'"${C_CTX_CODE}"'m'
    C_I_RATE=$'\033[38;5;'"${C_RATE_CODE}"'m'
    C_I_BURN=$'\033[38;5;'"${C_BURN_CODE}"'m'
    C_I_TIME=$'\033[38;5;'"${C_TIME_CODE}"'m'
    C_I_THEME=$'\033[38;5;229m'

    # 배경색
    C_BG_BRANCH=$'\033[48;5;'"${C_BG_BRANCH_CODE}"'m'
    C_BG_TREE=$'\033[48;5;'"${C_BG_TREE_CODE}"'m'
    C_BG_DIR=$'\033[48;5;'"${C_BG_DIR_CODE}"'m'
    C_BG_STATUS=$'\033[48;5;'"${C_BG_STATUS_CODE}"'m'
    C_BG_SYNC=$'\033[48;5;'"${C_BG_SYNC_CODE}"'m'
    C_BG_MODEL=$'\033[48;5;'"${C_BG_MODEL_CODE}"'m'
    C_BG_RATE=$'\033[48;5;58m'
    C_BG_TIME=$'\033[48;5;24m'
    C_BG_BURN=$'\033[48;5;94m'
    C_BG_CTX=$'\033[48;5;22m'
    C_BG_CTX_WARN=$'\033[48;5;94m'
    C_BG_CTX_CRIT=$'\033[48;5;52m'

    # 박스/칩 테두리
    C_BOX=$'\033[38;5;240m'
    C_CHIP=$'\033[38;5;245m'

    # 칩/카드 배경색
    C_BG_LOC=$'\033[48;5;'"${C_BG_LOC_CODE}"'m'
    C_BG_GIT=$'\033[48;5;'"${C_BG_GIT_CODE}"'m'
    C_BG_SES=$'\033[48;5;'"${C_BG_SES_CODE}"'m'
    C_BG=$'\033[48;5;235m'

    # 배터리 배경색
    C_BAT_EMPTY=$'\033[48;5;236m'
    C_BAT_GREEN=$'\033[48;5;23m'
    C_BAT_YELLOW=$'\033[48;5;94m'
    C_BAT_RED=$'\033[48;5;52m'

    # 컨텍스트 기반 동적 색상
    if [[ "$CONTEXT_PCT" -ge 70 ]]; then
        C_BRANCH=$'\033[1;38;5;'"${C_BRANCH_CODE}"'m'
        C_TREE=$'\033[1;38;5;'"${C_TREE_CODE}"'m'
        C_DIR=$'\033[1;38;5;'"${C_DIR_CODE}"'m'
        C_MODEL=$'\033[1;38;5;'"${C_MODEL_CODE}"'m'
        C_STATUS=$'\033[1;38;5;'"${C_STATUS_CODE}"'m'
        C_SYNC=$'\033[1;38;5;'"${C_SYNC_CODE}"'m'
        C_CTX=$'\033[1;91m'
        C_CTX_TEXT=$'\033[1;91m'
        CTX_ICON="${ICON_CTX_CRIT:-🔥}"
        C_BAT_FILL="$C_BAT_RED"
    elif [[ "$CONTEXT_PCT" -ge 50 ]]; then
        C_BRANCH=$'\033[1;38;5;'"${C_BRANCH_CODE}"'m'
        C_TREE=$'\033[1;38;5;'"${C_TREE_CODE}"'m'
        C_DIR=$'\033[1;38;5;'"${C_DIR_CODE}"'m'
        C_MODEL=$'\033[1;38;5;'"${C_MODEL_CODE}"'m'
        C_STATUS=$'\033[1;38;5;'"${C_STATUS_CODE}"'m'
        C_SYNC=$'\033[1;38;5;'"${C_SYNC_CODE}"'m'
        C_CTX=$'\033[1;38;5;208m'
        C_CTX_TEXT=$'\033[1;38;5;208m'
        CTX_ICON="${ICON_CTX_WARN:-🪫}"
        C_BAT_FILL="$C_BAT_YELLOW"
    else
        C_BRANCH=$'\033[38;5;'"${C_BRANCH_CODE}"'m'
        C_TREE=$'\033[38;5;'"${C_TREE_CODE}"'m'
        C_DIR=$'\033[38;5;'"${C_DIR_CODE}"'m'
        C_MODEL=$'\033[38;5;'"${C_MODEL_CODE}"'m'
        C_STATUS=$'\033[38;5;'"${C_STATUS_CODE}"'m'
        C_SYNC=$'\033[38;5;'"${C_SYNC_CODE}"'m'
        C_CTX=$'\033[38;5;'"${C_CTX_CODE}"'m'
        C_CTX_TEXT=$'\033[0m'
        CTX_ICON="${ICON_CTX_NORM:-🔋}"
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
        echo $'\033[38;5;'"${C_RATE_CODE}"'m'
    fi
}
