#!/bin/bash
# 1-line Layout Module - 컴팩트 1줄 레이아웃
# 모든 정보를 한 줄에 표시

# ============================================================
# 공통 함수 (Git 상태)
# ============================================================

format_git_status() {
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
        local add_text mod_text del_text
        [[ "$GIT_ADDED" -gt 0 ]] && add_text="+${GIT_ADDED}" || add_text="+0"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod_text="~${GIT_MODIFIED}" || mod_text="~0"
        [[ "$GIT_DELETED" -gt 0 ]] && del_text="-${GIT_DELETED}" || del_text="-0"
        add=$(colorize_text "$add_text" 3)
        mod=$(colorize_text "$mod_text" 5)
        del=$(colorize_text "$del_text" 7)
    else
        [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}${RST}" || add="${C_DIM_STATUS}+0${RST}"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}${RST}" || mod="${C_DIM_STATUS}~0${RST}"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}${RST}" || del="${C_DIM_STATUS}-0${RST}"
    fi

    # 아이콘은 고유 색상 유지
    echo "${C_I_STATUS}${ICON_GIT_STATUS}${RST} ${add} ${mod} ${del}"
}

format_git_sync() {
    local ahead behind

    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        # 글자 단위 그라데이션
        local ahead_text behind_text
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead_text="↑ ${GIT_AHEAD}" || ahead_text="↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind_text="↓ ${GIT_BEHIND}" || behind_text="↓ 0"
        ahead=$(colorize_text "$ahead_text" 0)
        behind=$(colorize_text "$behind_text" 4)
    elif [[ "$ANIMATION_MODE" == "rainbow" ]]; then
        local ahead_text behind_text
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead_text="↑ ${GIT_AHEAD}" || ahead_text="↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind_text="↓ ${GIT_BEHIND}" || behind_text="↓ 0"
        ahead=$(colorize_text "$ahead_text" 0)
        behind=$(colorize_text "$behind_text" 4)
    else
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}${RST}" || ahead="${C_DIM_SYNC}↑ 0${RST}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}${RST}" || behind="${C_DIM_SYNC}↓ 0${RST}"
    fi

    echo "${C_I_SYNC}${ICON_SYNC}${RST} ${ahead} ${behind}"
}

# ============================================================
# 렌더링 함수
# ============================================================

render() {
    init_colors

    local parts=()

    # 브랜치
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        parts+=("${C_I_BRANCH}${ICON_BRANCH}${RST} $(colorize_text "${BRANCH:-branch}" 0)")
    else
        parts+=("${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}${RST}")
    fi

    # 워크트리
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        parts+=("${C_I_TREE}${ICON_TREE}${RST} $(colorize_text "${WORKTREE:-worktree}" 3)")
    else
        parts+=("${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}${RST}")
    fi

    # 디렉토리
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        parts+=("${C_I_DIR}${ICON_DIR}${RST} $(colorize_text "${DIR_NAME}" 6)")
    else
        parts+=("${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}${RST}")
    fi

    # Git 상태
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        parts+=("$(format_git_status)")
        parts+=("$(format_git_sync)")
    else
        parts+=("${C_DIM_STATUS}${ICON_GIT_STATUS} status${RST}")
        parts+=("${C_DIM_SYNC}${ICON_SYNC} sync${RST}")
    fi

    # 모델
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        parts+=("${C_I_MODEL}${ICON_MODEL}${RST} $(colorize_text "${MODEL}" 9)")
    else
        parts+=("${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}${RST}")
    fi

    # 컨텍스트 (경고 색상 유지 - lsd/rainbow 제외)
    if [[ "$ICON_MODE" == "nerd" ]]; then
        parts+=("${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}")
    else
        parts+=("${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}")
    fi

    # Rate limit (컴팩트)
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        parts+=("${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT} (${rate_color}${RATE_LIMIT_PCT}%${C_RATE})${RST}")
    fi

    # 출력
    local output=""
    for i in "${!parts[@]}"; do
        [[ $i -eq 0 ]] && output="${parts[$i]}" || output="$output  ${parts[$i]}"
    done

    echo -e "$output"
}
