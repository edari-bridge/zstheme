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
        # 글자 단위 그라데이션
        local add_text mod_text del_text
        [[ "$GIT_ADDED" -gt 0 ]] && add_text="+${GIT_ADDED}" || add_text="+0"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod_text="~${GIT_MODIFIED}" || mod_text="~0"
        [[ "$GIT_DELETED" -gt 0 ]] && del_text="-${GIT_DELETED}" || del_text="-0"
        add=$(colorize_text "$add_text" 3)
        mod=$(colorize_text "$mod_text" 5)
        del=$(colorize_text "$del_text" 7)
    elif [[ "$ANIMATION_MODE" == "rainbow" ]]; then
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

    echo "${C_I_STATUS}${ICON_GIT_STATUS}${RST} ${add}  ${mod}  ${del}"
}

format_git_sync_card() {
    local ahead behind

    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        # 글자 단위 그라데이션
        local ahead_text behind_text
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead_text="↑ ${GIT_AHEAD}" || ahead_text="↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind_text="↓ ${GIT_BEHIND}" || behind_text="↓ 0"
        ahead=$(colorize_text "$ahead_text" 0)
        behind=$(colorize_text "$behind_text" 4)
    elif [[ "$ANIMATION_MODE" == "rainbow" ]]; then
        local c1 c2
        c1=$(echo -e "$(get_animated_color 6)")
        c2=$(echo -e "$(get_animated_color 7)")
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${c1}↑ ${GIT_AHEAD}${RST}" || ahead="${c1}↑ 0${RST}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${c2}↓ ${GIT_BEHIND}${RST}" || behind="${c2}↓ 0${RST}"
    else
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}${RST}" || ahead="${C_DIM_SYNC}↑ 0${RST}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}${RST}" || behind="${C_DIM_SYNC}↓ 0${RST}"
    fi

    echo "${C_I_SYNC}${ICON_SYNC}${RST} ${ahead}  ${behind}"
}

# ============================================================
# 렌더링 함수
# ============================================================

render() {
    init_colors

    local V="${C_BOX}│${RST}"
    local W=24  # 카드 내부 너비 (긴 테마명 수용)

    # 왼쪽 카드 내용
    local L1 L2 L3 L4 L5
    # 왼쪽 카드 내용
    local L1 L2 L3 L4 L5
    if [[ "$ANIMATION_MODE" != "static" && -n "$ANIMATION_MODE" ]]; then
        local raw_branch="${ICON_BRANCH} ${BRANCH:-branch}"
        local raw_tree="${ICON_TREE} ${WORKTREE:-worktree}"
        local raw_dir="${ICON_DIR} ${DIR_NAME}"
        
        case "$ANIMATION_MODE" in
            lsd)
                L1="$(colorize_text "$raw_branch" 0)"
                L2="$(colorize_text "$raw_tree" 3)"
                L3="$(colorize_text "$raw_dir" 6)"
                ;;
            plasma)
                L1="$(colorize_bg_plasma "$raw_branch" 0 "\033[30m")"
                L2="$(colorize_bg_plasma "$raw_tree" 10 "\033[30m")"
                L3="$(colorize_bg_plasma "$raw_dir" 20 "\033[30m")"
                ;;
            neon)
                L1="$(colorize_bg_neon "$raw_branch" 0 "\033[97m")"
                L2="$(colorize_bg_neon "$raw_tree" 10 "\033[30m")"
                L3="$(colorize_bg_neon "$raw_dir" 20 "\033[97m")"
                ;;
            noise)
                L1="$(colorize_bg_noise "$raw_branch")"
                L2="$(colorize_bg_noise "$raw_tree")"
                L3="$(colorize_bg_noise "$raw_dir")"
                ;;
            rainbow)
                local c0 c1 c2
                c0=$(echo -e "$(get_animated_color 0)")
                c1=$(echo -e "$(get_animated_color 1)")
                c2=$(echo -e "$(get_animated_color 2)")
                L1="${c0}${raw_branch}${RST}"
                L2="${c1}${raw_tree}${RST}"
                L3="${c2}${raw_dir}${RST}"
                ;;
        esac
    else
        L1="${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}${RST}"
        L2="${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}${RST}"
        L3="${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}${RST}"
    fi
    L4="$(format_git_status_card)"
    L5="$(format_git_sync_card)"

    # 오른쪽 카드 내용
    local R1 R2 R3 R4 R5
    # 오른쪽 카드 내용
    local R1 R2 R3 R4 R5
    if [[ "$ANIMATION_MODE" != "static" && -n "$ANIMATION_MODE" ]]; then
        local raw_model="${ICON_MODEL} ${MODEL}"
        local raw_theme="${ICON_THEME} ${THEME_NAME}"
        
        case "$ANIMATION_MODE" in
             lsd)
                 R1="$(colorize_text "$raw_model" 2)"
                 R5="$(colorize_text "$raw_theme" 5)"
                 ;;
             plasma)
                 R1="$(colorize_bg_plasma "$raw_model" 50 "\033[30m")"
                 R5="$(colorize_bg_plasma "$raw_theme" 30 "\033[30m")"
                 ;;
             neon)
                 R1="$(colorize_bg_neon "$raw_model" 50 "\033[30m")" # Neon Purple
                 R5="$(colorize_bg_neon "$raw_theme" 30 "\033[97m")" # Neon Cyan
                 ;;
             noise)
                 R1="$(colorize_bg_noise "$raw_model")"
                 R5="$(colorize_bg_noise "$raw_theme")"
                 ;;
             rainbow)
                 local c9 c0
                 c9=$(echo -e "$(get_animated_color 9)")
                 c0=$(echo -e "$(get_animated_color 0)")
                 R1="${c9}${raw_model}${RST}"
                 R5="${c0}${raw_theme}${RST}"
                 ;;
        esac
    else
        R1="${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}${RST}"
        R5="${C_I_THEME}${ICON_THEME} ${C_RATE}${THEME_NAME}${RST}"
    fi

    # 테두리 (W=24 + 양쪽 공백 2 = 26)
    local TOP1="${C_BOX}╭──────────────────────────╮${RST}"
    local BOT1="${C_BOX}╰──────────────────────────╯${RST}"
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
