#!/bin/bash
# Bars Layout Module
# 그룹 단위 배경색 (여러 요소를 막대처럼 묶음)
#
# CHIP_STYLE 환경변수로 스타일 선택 가능:
#   badge (기본)   - 배경만 (가장 미니멀)
#   pipe           - ┃ ┃

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

render() {
    init_colors

    # 배경색 가져오기 (lsd일 때 순환)
    local bg_loc bg_git bg_ses
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        bg_loc=$(get_animated_bg 0)
        bg_git=$(get_animated_bg 1)
        bg_ses=$(get_animated_bg 2)
    else
        bg_loc="$C_BG_LOC"
        bg_git="$C_BG_GIT"
        bg_ses="$C_BG_SES"
    fi

    # Line 1: 위치 칩 + Git 칩 + 컨텍스트
    local loc_content=""
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c0=$(echo -e "$(get_animated_color 0)")
        local c1=$(echo -e "$(get_animated_color 1)")
        local c2=$(echo -e "$(get_animated_color 2)")
        loc_content="${c0}${ICON_BRANCH} ${BRANCH:-branch}${RST}${bg_loc}    "
        loc_content="${loc_content}${c1}${ICON_TREE} ${WORKTREE:-worktree}${RST}${bg_loc}    "
        loc_content="${loc_content}${c2}${ICON_DIR} ${DIR_NAME}${RST}"
    else
        loc_content="${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}${RST}${bg_loc}    "
        loc_content="${loc_content}${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}${RST}${bg_loc}    "
        loc_content="${loc_content}${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}${RST}"
    fi

    local git_content=""
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local add mod del ahead behind
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            local c3=$(echo -e "$(get_animated_color 3)")
            local c4=$(echo -e "$(get_animated_color 4)")
            local c5=$(echo -e "$(get_animated_color 5)")
            local c6=$(echo -e "$(get_animated_color 6)")
            local c7=$(echo -e "$(get_animated_color 7)")
            [[ "$GIT_ADDED" -gt 0 ]] && add="${c3}+${GIT_ADDED}${RST}${bg_git}" || add="${c3}+0${RST}${bg_git}"
            [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${c4}~${GIT_MODIFIED}${RST}${bg_git}" || mod="${c4}~0${RST}${bg_git}"
            [[ "$GIT_DELETED" -gt 0 ]] && del="${c5}-${GIT_DELETED}${RST}${bg_git}" || del="${c5}-0${RST}${bg_git}"
            [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${c6}↑ ${GIT_AHEAD}${RST}${bg_git}" || ahead="${c6}↑ 0${RST}${bg_git}"
            [[ "$GIT_BEHIND" -gt 0 ]] && behind="${c7}↓ ${GIT_BEHIND}${RST}${bg_git}" || behind="${c7}↓ 0${RST}${bg_git}"
        else
            [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}${RST}${bg_git}" || add="${C_DIM_STATUS}+0${RST}${bg_git}"
            [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}${RST}${bg_git}" || mod="${C_DIM_STATUS}~0${RST}${bg_git}"
            [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}${RST}${bg_git}" || del="${C_DIM_STATUS}-0${RST}${bg_git}"
            [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}${RST}${bg_git}" || ahead="${C_DIM_SYNC}↑ 0${RST}${bg_git}"
            [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}${RST}${bg_git}" || behind="${C_DIM_SYNC}↓ 0${RST}${bg_git}"
        fi
        git_content="${C_I_STATUS}${ICON_GIT_STATUS}${RST}${bg_git} ${add}  ${mod}  ${del}    ${C_I_SYNC}${ICON_SYNC}${RST}${bg_git} ${ahead}  ${behind}"
    else
        git_content="${C_DIM_STATUS}${ICON_GIT_STATUS} ---${RST}${bg_git}    ${C_DIM_SYNC}${ICON_SYNC} ---${RST}"
    fi

    # 컨텍스트 (Nerd: 아이콘=컬러, %=텍스트색 / 이모지: 전체 텍스트색)
    local ctx_display
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c8=$(echo -e "$(get_animated_color 8)")
        ctx_display="${c8}${CTX_ICON} ${CONTEXT_PCT}%${RST}"
    elif [[ "$ICON_MODE" == "nerd" ]]; then
        ctx_display="${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    else
        ctx_display="${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    fi

    local line1="$(make_chip "$bg_loc" "$loc_content")    $(make_chip "$bg_git" "$git_content")    ${ctx_display}"

    # Line 2: 세션 칩 + 테마
    local ses_content=""
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c9=$(echo -e "$(get_animated_color 9)")
        ses_content="${c9}${ICON_MODEL} ${MODEL}${RST}${bg_ses}"
    else
        ses_content="${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}${RST}${bg_ses}"
    fi

    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        ses_content="${ses_content}     ${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${rate_color}${RATE_LIMIT_PCT}%${RST}${bg_ses}"
    fi

    ses_content="${ses_content}     ${C_I_TIME}${ICON_SESSION} ${C_TIME}${SESSION_DURATION_MIN}m${RST}${bg_ses}"
    [[ -n "$BURN_RATE" ]] && ses_content="${ses_content}     ${C_I_BURN}${ICON_COST} ${C_BURN}${BURN_RATE}${RST}"

    local theme_display
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c0=$(echo -e "$(get_animated_color 0)")
        theme_display="${c0}${ICON_THEME} ${THEME_NAME}${RST}"
    else
        theme_display="${C_I_THEME}${ICON_THEME} ${C_RATE}${THEME_NAME}${RST}"
    fi

    local line2="$(make_chip "$bg_ses" "$ses_content")    ${theme_display}"

    echo -e "$line1"
    echo -e "$line2"
}
