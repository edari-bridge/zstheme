#!/bin/bash
# Chips Layout Module - 칩 그룹핑 + 배경색
# [위치 정보 칩]  [Git 정보 칩]  컨텍스트
# [세션 정보 칩]  테마
#
# CHIP_STYLE 환경변수로 칩 스타일 선택 가능:
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
# Git 상태 포맷팅
# ============================================================

format_git_status_chips() {
    local bg="$1"
    local add mod del

    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c1 c2 c3
        c1=$(echo -e "$(get_animated_color 3)")
        c2=$(echo -e "$(get_animated_color 4)")
        c3=$(echo -e "$(get_animated_color 5)")
        [[ "$GIT_ADDED" -gt 0 ]] && add="${c1}+${GIT_ADDED}${RST}${bg}" || add="${c1}+0${RST}${bg}"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${c2}~${GIT_MODIFIED}${RST}${bg}" || mod="${c2}~0${RST}${bg}"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${c3}-${GIT_DELETED}${RST}${bg}" || del="${c3}-0${RST}${bg}"
    else
        [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}${RST}${bg}" || add="${C_DIM_STATUS}+0${RST}${bg}"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}${RST}${bg}" || mod="${C_DIM_STATUS}~0${RST}${bg}"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}${RST}${bg}" || del="${C_DIM_STATUS}-0${RST}${bg}"
    fi

    echo "${ICON_GIT_STATUS} ${add}  ${mod}  ${del}"
}

format_git_sync_chips() {
    local bg="$1"
    local ahead behind

    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c1 c2
        c1=$(echo -e "$(get_animated_color 6)")
        c2=$(echo -e "$(get_animated_color 7)")
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${c1}↑ ${GIT_AHEAD}${RST}${bg}" || ahead="${c1}↑ 0${RST}${bg}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${c2}↓ ${GIT_BEHIND}${RST}${bg}" || behind="${c2}↓ 0${RST}${bg}"
    else
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}${RST}${bg}" || ahead="${C_DIM_SYNC}↑ 0${RST}${bg}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}${RST}${bg}" || behind="${C_DIM_SYNC}↓ 0${RST}${bg}"
    fi

    echo "${ICON_SYNC} ${ahead}  ${behind}"
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
        local c0 c1 c2
        c0=$(echo -e "$(get_animated_color 0)")
        c1=$(echo -e "$(get_animated_color 1)")
        c2=$(echo -e "$(get_animated_color 2)")
        loc_content="${c0}${ICON_BRANCH} ${BRANCH:-branch}${RST}${bg_loc}  "
        loc_content="${loc_content}${c1}${ICON_TREE} ${WORKTREE:-worktree}${RST}${bg_loc}  "
        loc_content="${loc_content}${c2}${ICON_DIR} ${DIR_NAME}${RST}"
    else
        loc_content="${C_BRANCH}${ICON_BRANCH} ${BRANCH:-branch}${RST}${bg_loc}  "
        loc_content="${loc_content}${C_TREE}${ICON_TREE} ${WORKTREE:-worktree}${RST}${bg_loc}  "
        loc_content="${loc_content}${C_DIR}${ICON_DIR} ${DIR_NAME}${RST}"
    fi

    local git_content=""
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        git_content="$(format_git_status_chips "$bg_git")    $(format_git_sync_chips "$bg_git")"
    else
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            local c3 c6
            c3=$(echo -e "$(get_animated_color 3)")
            c6=$(echo -e "$(get_animated_color 6)")
            git_content="${c3}${ICON_GIT_STATUS} status${RST}${bg_git}    ${c6}${ICON_SYNC} sync${RST}"
        else
            git_content="${C_DIM_STATUS}${ICON_GIT_STATUS} status${RST}${bg_git}    ${C_DIM_SYNC}${ICON_SYNC} sync${RST}"
        fi
    fi

    local ctx_display
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c8
        c8=$(echo -e "$(get_animated_color 8)")
        ctx_display="${c8}${CTX_ICON} ${CONTEXT_PCT}%${RST}"
    else
        ctx_display="${C_CTX}${CTX_ICON} ${CONTEXT_PCT}%${RST}"
    fi

    local line1="$(make_chip "$bg_loc" "$loc_content")  $(make_chip "$bg_git" "$git_content")    ${ctx_display}"

    # Line 2: 세션 칩 + 테마
    local ses_content=""
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c9
        c9=$(echo -e "$(get_animated_color 9)")
        ses_content="${c9}${ICON_MODEL} ${MODEL}${RST}${bg_ses}"
    else
        ses_content="${C_MODEL}${ICON_MODEL} ${MODEL}${RST}${bg_ses}"
    fi

    # Rate limit
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        ses_content="${ses_content}     ${C_RATE}${ICON_TIME} ${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${rate_color}${RATE_LIMIT_PCT}%${C_RATE})${RST}${bg_ses}"
    fi

    # 세션 시간
    ses_content="${ses_content}     ${C_TIME}${ICON_SESSION} ${SESSION_DURATION_MIN}m${RST}${bg_ses}"

    # 번레이트
    [[ -n "$BURN_RATE" ]] && ses_content="${ses_content}     ${C_BURN}${ICON_COST} ${BURN_RATE}${RST}"

    local theme_display
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c0
        c0=$(echo -e "$(get_animated_color 0)")
        theme_display="${c0}${ICON_THEME} ${THEME_NAME}${RST}"
    else
        theme_display="${C_RATE}${ICON_THEME} ${THEME_NAME}${RST}"
    fi

    local line2="$(make_chip "$bg_ses" "$ses_content")     ${theme_display}"

    echo -e "$line1"
    echo -e "$line2"
}
