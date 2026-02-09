#!/bin/bash
# Card Layout Module - 박스 두 장 + 배터리 시각화
# 2개 카드 (Git 정보, 세션 정보) + 우측 배터리 표시

LAYOUT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$LAYOUT_DIR/common.sh"

# ============================================================
# 패딩 함수
# ============================================================

pad_to() {
    local text="$1"
    local target_width="$2"
    local plain=$(echo -e "$text" | sed $'s/\x1b\\[[0-9;]*m//g')
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
        if is_animated; then
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

        # 아이콘은 고유 색상, 텍스트만 애니메이션
        L1="${C_I_BRANCH}${ICON_BRANCH}${RST} $(colorize_text "${BRANCH:-branch}" 0)"
        L2="${C_I_TREE}${ICON_TREE}${RST} $(colorize_text "${WORKTREE:-worktree}" 3)"
        L3="${C_I_DIR}${ICON_DIR}${RST} $(colorize_text "${DIR_NAME}" 6)"
    else
        L1="${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}${RST}"
        L2="${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}${RST}"
        L3="${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}${RST}"
    fi
    L4="$(format_git_status_common "  ")"
    L5="$(format_git_sync_common "  ")"

    # 오른쪽 카드 내용
    local R1 R2 R3 R4 R5

    # R2: Rate limit, R3: Session duration, R4: Burn rate
    local raw_rate="" raw_session="" raw_burn=""
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        raw_rate="${ICON_TIME} ${RATE_TIME_LEFT}·${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)"
    fi
    raw_session="${ICON_SESSION} ${SESSION_DURATION_MIN}m"
    [[ -n "$BURN_RATE" ]] && raw_burn="${ICON_COST} ${BURN_RATE}"

    if [[ "$ANIMATION_MODE" != "static" && -n "$ANIMATION_MODE" ]]; then
        local raw_model="${ICON_MODEL} ${MODEL}"
        local raw_theme="${ICON_THEME} ${THEME_NAME}"

        # 아이콘은 고유 색상, 텍스트만 애니메이션
        R1="${C_I_MODEL}${ICON_MODEL}${RST} $(colorize_text "${MODEL}" 9)"
        if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
            R2="${C_I_RATE}${ICON_TIME}${RST} $(colorize_text "${RATE_TIME_LEFT}·${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)" 12)"
        else
            R2=""
        fi
        R3="${C_I_TIME}${ICON_SESSION}${RST} $(colorize_text "${SESSION_DURATION_MIN}m" 22)"
        [[ -n "$BURN_RATE" ]] && R4="${C_I_BURN}${ICON_COST}${RST} $(colorize_text "${BURN_RATE}" 32)" || R4=""
        R5="${C_I_THEME}${ICON_THEME}${RST} $(colorize_text "${THEME_NAME}" 5)"
    else
        R1="${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}${RST}"
        if [[ -n "$raw_rate" ]]; then
            local rate_color=$(get_rate_color)
            R2="${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT}·${RATE_RESET_TIME} ${rate_color}(${RATE_LIMIT_PCT}%)${RST}"
        else
            R2=""
        fi
        R3="${C_I_TIME}${ICON_SESSION} ${C_TIME}${SESSION_DURATION_MIN}m${RST}"
        [[ -n "$BURN_RATE" ]] && R4="${C_I_BURN}${ICON_COST} ${C_BURN}${BURN_RATE}${RST}" || R4=""
        R5="${C_I_THEME}${ICON_THEME} ${C_RATE}${THEME_NAME}${RST}"
    fi

    # 오른쪽 카드 너비: R5(테마명)가 길 수 있으므로 동적 계산
    local WR=$W
    local r5_plain=$(echo -e "$R5" | sed $'s/\x1b\\[[0-9;]*m//g')
    local r5_emoji=$(echo "$r5_plain" | grep -oE '[🔱🌿📂💾🔮🔋🔥🪫🧠⏳💰💬🎨]' 2>/dev/null | wc -l | tr -d ' ')
    local r5_len=$(( ${#r5_plain} + r5_emoji ))
    [[ $r5_len -gt $WR ]] && WR=$r5_len

    # 테두리
    local border_l=$(printf '─%.0s' $(seq 1 $((W + 2))))
    local border_r=$(printf '─%.0s' $(seq 1 $((WR + 2))))
    local TOP1="${C_BOX}╭${border_l}╮${RST}"
    local BOT1="${C_BOX}╰${border_l}╯${RST}"
    local TOP2="${C_BOX}╭${border_r}╮${RST}"
    local BOT2="${C_BOX}╰${border_r}╯${RST}"
    local BTOP="${C_BOX}╭─────╮${RST}"
    local BBOT="${C_BOX}╰─────╯${RST}"
    local BV="${C_BOX}│${RST}"

    # 출력
    echo "${TOP1}  ${TOP2}  ${BTOP}"
    echo "${V} $(pad_to "$L1" $W) ${V}  ${V} $(pad_to "$R1" $WR) ${V}  ${BV}$(battery_line 1)${BV}"
    echo "${V} $(pad_to "$L2" $W) ${V}  ${V} $(pad_to "$R2" $WR) ${V}  ${BV}$(battery_line 2)${BV}"
    echo "${V} $(pad_to "$L3" $W) ${V}  ${V} $(pad_to "$R3" $WR) ${V}  ${BV}$(battery_line 3)${BV}"
    echo "${V} $(pad_to "$L4" $W) ${V}  ${V} $(pad_to "$R4" $WR) ${V}  ${BV}$(battery_line 4)${BV}"
    echo "${V} $(pad_to "$L5" $W) ${V}  ${V} $(pad_to "$R5" $WR) ${V}  ${BV}$(battery_line 5)${BV}"
    echo "${BOT1}  ${BOT2}  ${BBOT}"
}
