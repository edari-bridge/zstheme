#!/bin/bash
# Bars Layout Module
# 그룹 단위 배경색 (여러 요소를 막대처럼 묶음)
#
# CHIP_STYLE 환경변수로 스타일 선택 가능:
#   badge (기본)   - 배경만 (가장 미니멀)
#   pipe           - ┃ ┃

LAYOUT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$LAYOUT_DIR/common.sh"

# ============================================================
# 칩 스타일 설정
# ============================================================

CHIP_STYLE="${CHIP_STYLE:-badge}"

# ============================================================
# 칩 생성 함수
# ============================================================

make_chip() {
    local bg="$1"
    shift
    local content="$*"

    case "$CHIP_STYLE" in
        pipe)
            echo "${C_CHIP}┃${RST}${bg} ${content} ${RST}${C_CHIP}┃${RST}"
            ;;
        *)  # badge (기본) - 배경만
            echo "${bg} ${content} ${RST}"
            ;;
    esac
}

# ============================================================
# 렌더링 함수
# ============================================================

render_animated() {
    local bg_loc bg_git bg_ses
    bg_loc=$(get_animated_bg 0)
    bg_git=$(get_animated_bg 1)
    bg_ses=$(get_animated_bg 2)

    # Line 1: Location chip
    local raw_loc=" ${ICON_BRANCH} ${BRANCH:-branch}    ${ICON_TREE} ${WORKTREE:-worktree}    ${ICON_DIR} ${DIR_NAME} "

    local chip_loc
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        chip_loc="$(make_chip "$bg_loc" "$(colorize_text_dark "${ICON_BRANCH} ${BRANCH:-branch}    ${ICON_TREE} ${WORKTREE:-worktree}    ${ICON_DIR} ${DIR_NAME}" 0)")"
    elif [[ "$ANIMATION_MODE" == "p.lsd" ]]; then
        chip_loc="$(make_chip "$C_BG_LOC" "$(colorize_text_dark "${ICON_BRANCH} ${BRANCH:-branch}    ${ICON_TREE} ${WORKTREE:-worktree}    ${ICON_DIR} ${DIR_NAME}" 0)")"
    else
        chip_loc="$(make_chip "$C_BG_LOC" "${C_I_BRANCH}${ICON_BRANCH} $(colorize_text "${BRANCH:-branch}" 0)    ${C_I_TREE}${ICON_TREE} $(colorize_text "${WORKTREE:-worktree}" 10)    ${C_I_DIR}${ICON_DIR} $(colorize_text "${DIR_NAME}" 20)")"
    fi

    # Git Chip
    local chip_git
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local add mod del ahead behind
        [[ "$GIT_ADDED" -gt 0 ]] && add="+${GIT_ADDED}" || add="+0"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="~${GIT_MODIFIED}" || mod="~0"
        [[ "$GIT_DELETED" -gt 0 ]] && del="-${GIT_DELETED}" || del="-0"
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="↑ ${GIT_AHEAD}" || ahead="↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="↓ ${GIT_BEHIND}" || behind="↓ 0"

        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            chip_git="$(make_chip "$bg_git" "$(colorize_text_dark "${ICON_GIT_STATUS} ${add}  ${mod}  ${del}    ${ICON_SYNC} ${ahead}  ${behind}" 30)")"
        elif [[ "$ANIMATION_MODE" == "p.lsd" ]]; then
            chip_git="$(make_chip "$C_BG_GIT" "$(colorize_text_dark "${ICON_GIT_STATUS} ${add}  ${mod}  ${del}    ${ICON_SYNC} ${ahead}  ${behind}" 30)")"
        else
            chip_git="$(make_chip "$C_BG_GIT" "${C_I_STATUS}${ICON_GIT_STATUS} $(colorize_text "${add}  ${mod}  ${del}" 30)    ${C_I_SYNC}${ICON_SYNC} $(colorize_text "${ahead}  ${behind}" 40)")"
        fi
    else
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            chip_git="$(make_chip "$bg_git" "$(colorize_text_dark "${ICON_GIT_STATUS} ---    ${ICON_SYNC} ---" 30)")"
        elif [[ "$ANIMATION_MODE" == "p.lsd" ]]; then
            chip_git="$(make_chip "$C_BG_GIT" "$(colorize_text_dark "${ICON_GIT_STATUS} ---    ${ICON_SYNC} ---" 30)")"
        else
            chip_git="$(make_chip "$C_BG_GIT" "${C_DIM_STATUS}${ICON_GIT_STATUS} ---    ${C_DIM_SYNC}${ICON_SYNC} ---")"
        fi
    fi

    # Line 2: Session + Theme
    local chip_ses
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local ses_lsd_text="${ICON_MODEL} ${MODEL}"
        if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
            ses_lsd_text+="     ${ICON_TIME} ${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)"
        else
            ses_lsd_text+="     ${ICON_TIME} ---"
        fi
        ses_lsd_text+="     ${ICON_SESSION} ${SESSION_DURATION_MIN}m"
        ses_lsd_text+="     ${ICON_COST} ${BURN_RATE:-"---"}"
        chip_ses="$(make_chip "$bg_ses" "$(colorize_text_dark "$ses_lsd_text" 50)")"
    elif [[ "$ANIMATION_MODE" == "p.lsd" ]]; then
        local ses_raw_text="${ICON_MODEL} ${MODEL}"
        if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
            ses_raw_text+="     ${ICON_TIME} ${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)"
        else
            ses_raw_text+="     ${ICON_TIME} ---"
        fi
        ses_raw_text+="     ${ICON_SESSION} ${SESSION_DURATION_MIN}m"
        ses_raw_text+="     ${ICON_COST} ${BURN_RATE:-"---"}"
        chip_ses="$(make_chip "$C_BG_SES" "$(colorize_text_dark "$ses_raw_text" 50)")"
    else
        local ses_animated="${C_I_MODEL}${ICON_MODEL} $(colorize_text "${MODEL}" 50)"
        if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
            ses_animated+="     ${C_I_RATE}${ICON_TIME} $(colorize_text "${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)" 60)"
        else
            ses_animated+="     ${C_DIM_STATUS}${ICON_TIME} ---"
        fi
        ses_animated+="     ${C_I_TIME}${ICON_SESSION} $(colorize_text "${SESSION_DURATION_MIN}m" 70)"
        if [[ -n "$BURN_RATE" ]]; then
            ses_animated+="     ${C_I_BURN}${ICON_COST} $(colorize_text "${BURN_RATE}" 80)"
        else
            ses_animated+="     ${C_DIM_STATUS}${ICON_COST} ---"
        fi
        chip_ses="$(make_chip "$C_BG_SES" "$ses_animated")"
    fi

    local chip_theme
    chip_theme=$(colorize_text "${ICON_THEME} ${THEME_NAME}")

    local anim_line1_parts=("$chip_loc" "$chip_git" "$(format_context)")
    local anim_line2_parts=("$chip_ses" "$chip_theme")
    align_two_lines anim_line1_parts anim_line2_parts

    echo -e "$ALIGNED_LINE1"
    echo -e "$ALIGNED_LINE2"
}

render_static() {
    local bg_loc="$C_BG_LOC"
    local bg_git="$C_BG_GIT"
    local bg_ses="$C_BG_SES"

    # Line 1: 위치 칩 + Git 칩 + 컨텍스트
    local loc_content=""
    loc_content="${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}    "
    loc_content="${loc_content}${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}    "
    loc_content="${loc_content}${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}"

    local git_content=""
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local add mod del ahead behind
        [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}" || add="${C_DIM_STATUS}+0"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}" || mod="${C_DIM_STATUS}~0"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}" || del="${C_DIM_STATUS}-0"
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}" || ahead="${C_DIM_SYNC}↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}" || behind="${C_DIM_SYNC}↓ 0"
        git_content="${C_I_STATUS}${ICON_GIT_STATUS} ${add}  ${mod}  ${del}    ${C_I_SYNC}${ICON_SYNC} ${ahead}  ${behind}"
    else
        git_content="${C_DIM_STATUS}${ICON_GIT_STATUS} ---    ${C_DIM_SYNC}${ICON_SYNC} ---"
    fi

    local ctx_display
    ctx_display="$(format_context)"

    # Line 2: 세션 칩 + 테마
    local ses_content=""
    ses_content="${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}"

    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        ses_content="${ses_content}     ${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${rate_color}(${RATE_LIMIT_PCT}%)"
    else
        ses_content="${ses_content}     ${C_DIM_STATUS}${ICON_TIME} ---"
    fi

    ses_content="${ses_content}     ${C_I_TIME}${ICON_SESSION} ${C_TIME}${SESSION_DURATION_MIN}m"
    if [[ -n "$BURN_RATE" ]]; then
        ses_content="${ses_content}     ${C_I_BURN}${ICON_COST} ${C_BURN}${BURN_RATE}"
    else
        ses_content="${ses_content}     ${C_DIM_STATUS}${ICON_COST} ---"
    fi

    local theme_display
    theme_display="${C_I_THEME}${ICON_THEME} ${C_I_THEME}${THEME_NAME}${RST}"

    local static_line1_parts=("$(make_chip "$bg_loc" "$loc_content")" "$(make_chip "$bg_git" "$git_content")" "$ctx_display")
    local static_line2_parts=("$(make_chip "$bg_ses" "$ses_content")" "$theme_display")
    align_two_lines static_line1_parts static_line2_parts

    echo -e "$ALIGNED_LINE1"
    echo -e "$ALIGNED_LINE2"
}

render() {
    init_colors

    # p.lsd: bars에 badge 스타일 배경 적용
    if [[ "$ANIMATION_MODE" == "p.lsd" ]]; then
        C_BG_LOC=$(get_animated_badge_bg 0)
        C_BG_GIT=$(get_animated_badge_bg 3)
        C_BG_SES=$(get_animated_badge_bg 6)
    fi

    if is_animated; then
        render_animated
    else
        render_static
    fi
}
