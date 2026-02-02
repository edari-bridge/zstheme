#!/bin/bash
# Card Layout Module - 박스 두 장 + 배터리 시각화
# 2개 카드 (Git 정보, 세션 정보) + 우측 배터리 표시

# ============================================================
# 패딩 함수
# ============================================================

pad_to() {
    local text="$1"
    local target_width="$2"
    local plain=$(echo -e "$text" | sed 's/\x1b\[[0-9;]*m//g')
    # 이모지 너비 보정 (이모지는 2칸 차지)
    local emoji_count=$(echo "$plain" | grep -oE '[🔱🌿📂💾🔮🔋🔥🪫🧠⏳💰💬🎨]' 2>/dev/null | wc -l | tr -d ' ')
    local char_count=${#plain}
    local actual_width=$((char_count + emoji_count))
    local pad=$((target_width - actual_width))
    [[ $pad -lt 0 ]] && pad=0
    printf "%s%*s" "$text" "$pad" ""
}

# ============================================================
# 배터리 줄 생성
# ============================================================

battery_line() {
    local row="$1"
    local pct="$CONTEXT_PCT"
    local remaining=$((100 - pct))

    if [[ $row -eq 3 ]]; then
        # 중간 줄: 퍼센트 숫자
        local str=$(printf "%d%%" "$pct")
        local len=${#str}
        local left=$(( (5 - len) / 2 ))
        local right=$(( 5 - len - left ))
        printf "%*s${C_CTX_TEXT}%s${RST}%*s" "$left" "" "$str" "$right" ""
    else
        # 채움 (아래에서부터)
        local threshold
        case $row in
            1) threshold=75 ;;
            2) threshold=50 ;;
            4) threshold=25 ;;
            5) threshold=0 ;;
        esac

        local fill_color
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            fill_color=$(get_animated_battery_color)
        else
            fill_color="$C_BAT_FILL"
        fi

        if [[ $remaining -gt $threshold ]]; then
            printf "${fill_color}     ${RST}"
        else
            printf "${C_BAT_EMPTY}     ${RST}"
        fi
    fi
}

# ============================================================
# Git 상태 포맷팅
# ============================================================

format_git_status_card() {
    local add mod del

    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c1 c2 c3
        c1=$(echo -e "$(get_animated_color 3)")
        c2=$(echo -e "$(get_animated_color 4)")
        c3=$(echo -e "$(get_animated_color 5)")
        [[ "$GIT_ADDED" -gt 0 ]] && add="${c1}+${GIT_ADDED}${RST}" || add="${c1}+0${RST}"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${c2}~${GIT_MODIFIED}${RST}" || mod="${c2}~0${RST}"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${c3}-${GIT_DELETED}${RST}" || del="${c3}-0${RST}"
    else
        [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}${RST}" || add="${C_DIM_STATUS}+0${RST}"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}${RST}" || mod="${C_DIM_STATUS}~0${RST}"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}${RST}" || del="${C_DIM_STATUS}-0${RST}"
    fi

    echo "${ICON_GIT_STATUS} ${add}  ${mod}  ${del}"
}

format_git_sync_card() {
    local ahead behind

    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c1 c2
        c1=$(echo -e "$(get_animated_color 6)")
        c2=$(echo -e "$(get_animated_color 7)")
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${c1}↑ ${GIT_AHEAD}${RST}" || ahead="${c1}↑ 0${RST}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${c2}↓ ${GIT_BEHIND}${RST}" || behind="${c2}↓ 0${RST}"
    else
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}${RST}" || ahead="${C_DIM_SYNC}↑ 0${RST}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}${RST}" || behind="${C_DIM_SYNC}↓ 0${RST}"
    fi

    echo "${ICON_SYNC} ${ahead}  ${behind}"
}

# ============================================================
# 렌더링 함수
# ============================================================

render() {
    init_colors

    local V="${C_BOX}│${RST}"
    local W=20  # 카드 내부 너비

    # 왼쪽 카드 내용
    local L1 L2 L3 L4 L5
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c0 c1 c2 c9
        c0=$(echo -e "$(get_animated_color 0)")
        c1=$(echo -e "$(get_animated_color 1)")
        c2=$(echo -e "$(get_animated_color 2)")
        L1="${c0}${ICON_BRANCH} ${BRANCH:-branch}${RST}"
        L2="${c1}${ICON_TREE} ${WORKTREE:-worktree}${RST}"
        L3="${c2}${ICON_DIR} ${DIR_NAME}${RST}"
    else
        L1="${C_BRANCH}${ICON_BRANCH} ${BRANCH:-branch}${RST}"
        L2="${C_TREE}${ICON_TREE} ${WORKTREE:-worktree}${RST}"
        L3="${C_DIR}${ICON_DIR} ${DIR_NAME}${RST}"
    fi
    L4="$(format_git_status_card)"
    L5="$(format_git_sync_card)"

    # 오른쪽 카드 내용
    local R1 R2 R3 R4 R5
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c9 c0
        c9=$(echo -e "$(get_animated_color 9)")
        R1="${c9}${ICON_MODEL} ${MODEL}${RST}"
    else
        R1="${C_MODEL}${ICON_MODEL} ${MODEL}${RST}"
    fi
    R2="${C_RATE}${ICON_TIME} ${RATE_TIME_LEFT:-0m} · ${RATE_RESET_TIME:-00:00}${RST}"
    R3="${C_TIME}${ICON_SESSION} ${SESSION_DURATION_MIN}m${RST}"
    R4="${C_BURN}${ICON_COST} ${BURN_RATE:-\$0/h}${RST}"
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        c0=$(echo -e "$(get_animated_color 0)")
        R5="${c0}${ICON_THEME} ${THEME_NAME}${RST}"
    else
        R5="${C_RATE}${ICON_THEME} ${THEME_NAME}${RST}"
    fi

    # 테두리
    local TOP1="${C_BOX}╭──────────────────────╮${RST}"
    local BOT1="${C_BOX}╰──────────────────────╯${RST}"
    local BTOP="${C_BOX}╭─────╮${RST}"
    local BBOT="${C_BOX}╰─────╯${RST}"
    local BV="${C_BOX}│${RST}"

    # 출력
    echo "${TOP1}  ${TOP1}  ${BTOP}"
    echo "${V} $(pad_to "$L1" $W) ${V}  ${V} $(pad_to "$R1" $W) ${V}  ${BV}$(battery_line 1)${BV}"
    echo "${V} $(pad_to "$L2" $W) ${V}  ${V} $(pad_to "$R2" $W) ${V}  ${BV}$(battery_line 2)${BV}"
    echo "${V} $(pad_to "$L3" $W) ${V}  ${V} $(pad_to "$R3" $W) ${V}  ${BV}$(battery_line 3)${BV}"
    echo "${V} $(pad_to "$L4" $W) ${V}  ${V} $(pad_to "$R4" $W) ${V}  ${BV}$(battery_line 4)${BV}"
    echo "${V} $(pad_to "$L5" $W) ${V}  ${V} $(pad_to "$R5" $W) ${V}  ${BV}$(battery_line 5)${BV}"
    echo "${BOT1}  ${BOT1}  ${BBOT}"
}
