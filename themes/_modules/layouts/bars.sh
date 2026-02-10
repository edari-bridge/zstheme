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
        chip_loc=$(colorize_bg_lsd "$raw_loc" 0 "\033[30m")
    else
        chip_loc="$(make_chip "$C_BG_LOC" "${C_I_BRANCH}${ICON_BRANCH} $(colorize_text "${BRANCH:-branch}" 0)    ${C_I_TREE}${ICON_TREE} $(colorize_text "${WORKTREE:-worktree}" 10)    ${C_I_DIR}${ICON_DIR} $(colorize_text "${DIR_NAME}" 20)")"
    fi

    local line1_chips="${chip_loc}    "

    # Git Chip
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local add mod del ahead behind
        [[ "$GIT_ADDED" -gt 0 ]] && add="+${GIT_ADDED}" || add="+0"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="~${GIT_MODIFIED}" || mod="~0"
        [[ "$GIT_DELETED" -gt 0 ]] && del="-${GIT_DELETED}" || del="-0"
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="↑ ${GIT_AHEAD}" || ahead="↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="↓ ${GIT_BEHIND}" || behind="↓ 0"

        local raw_git=" ${ICON_GIT_STATUS} ${add}  ${mod}  ${del}    ${ICON_SYNC} ${ahead}  ${behind} "

        local chip_git
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            chip_git=$(colorize_bg_lsd "$raw_git" 30 "\033[30m")
        else
            chip_git="$(make_chip "$C_BG_GIT" "${C_I_STATUS}${ICON_GIT_STATUS} $(colorize_text "${add}  ${mod}  ${del}" 30)    ${C_I_SYNC}${ICON_SYNC} $(colorize_text "${ahead}  ${behind}" 40)")"
        fi
        line1_chips+="${chip_git}    "
    else
        local raw_git=" ${ICON_GIT_STATUS} ---    ${ICON_SYNC} --- "
        local chip_git
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            chip_git=$(colorize_bg_lsd "$raw_git" 30 "\033[30;2m")
        else
            chip_git="$(make_chip "$C_BG_GIT" "${C_DIM_STATUS}${ICON_GIT_STATUS} ---    ${C_DIM_SYNC}${ICON_SYNC} ---")"
        fi
        line1_chips+="${chip_git}    "
    fi

    # Context
    line1_chips+="$(format_context)"

    local line1="${line1_chips}"

    # Line 2: Session + Theme
    local ses_raw=" ${ICON_MODEL} ${MODEL}"
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        ses_raw+="     ${ICON_TIME} ${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)"
    fi
    ses_raw+="     ${ICON_SESSION} ${SESSION_DURATION_MIN}m"
    [[ -n "$BURN_RATE" ]] && ses_raw+="     ${ICON_COST} ${BURN_RATE}"
    ses_raw+=" "

    local chip_ses
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        chip_ses=$(colorize_bg_lsd "$ses_raw" 50 "\033[30m")
    else
        local ses_animated="${C_I_MODEL}${ICON_MODEL} $(colorize_text "${MODEL}" 50)"
        if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
            ses_animated+="     ${C_I_RATE}${ICON_TIME} $(colorize_text "${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)" 60)"
        fi
        ses_animated+="     ${C_I_TIME}${ICON_SESSION} $(colorize_text "${SESSION_DURATION_MIN}m" 70)"
        [[ -n "$BURN_RATE" ]] && ses_animated+="     ${C_I_BURN}${ICON_COST} $(colorize_text "${BURN_RATE}" 80)"
        chip_ses="$(make_chip "$C_BG_SES" "$ses_animated")"
    fi

    local chip_theme
    chip_theme=$(colorize_text "${ICON_THEME} ${THEME_NAME}")

    local line2="${chip_ses}    ${chip_theme}"

    echo -e "$line1"
    echo -e "$line2"
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

    local line1="$(make_chip "$bg_loc" "$loc_content")    $(make_chip "$bg_git" "$git_content")    ${ctx_display}"

    # Line 2: 세션 칩 + 테마
    local ses_content=""
    ses_content="${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}"

    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        ses_content="${ses_content}     ${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${rate_color}(${RATE_LIMIT_PCT}%)"
    fi

    ses_content="${ses_content}     ${C_I_TIME}${ICON_SESSION} ${C_TIME}${SESSION_DURATION_MIN}m"
    [[ -n "$BURN_RATE" ]] && ses_content="${ses_content}     ${C_I_BURN}${ICON_COST} ${C_BURN}${BURN_RATE}"

    local theme_display
    theme_display="${C_I_THEME}${ICON_THEME} ${C_I_THEME}${THEME_NAME}${RST}"

    local line2="$(make_chip "$bg_ses" "$ses_content")    ${theme_display}"

    echo -e "$line1"
    echo -e "$line2"
}

render() {
    init_colors

    if is_animated; then
        render_animated
    else
        render_static
    fi
}
