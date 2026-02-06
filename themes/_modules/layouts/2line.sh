#!/bin/bash
# 2-line Layout Module - 2줄 레이아웃
# Line 1: Git 정보 + 컨텍스트
# Line 2: 모델 + Rate limit + 세션

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

    echo "${C_I_STATUS}${ICON_GIT_STATUS}${RST} ${add}  ${mod}  ${del}"
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

    echo "${C_I_SYNC}${ICON_SYNC}${RST} ${ahead}  ${behind}"
}

# ============================================================
# 렌더링 함수
# ============================================================

render() {
    init_colors

    # Line 1: Git 정보 + 컨텍스트
    local line1_parts=()

    # 브랜치
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        line1_parts+=("${C_I_BRANCH}${ICON_BRANCH}${RST} $(colorize_text "${BRANCH:-branch}" 0)")
    else
        line1_parts+=("${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}${RST}")
    fi

    # 워크트리
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        line1_parts+=("${C_I_TREE}${ICON_TREE}${RST} $(colorize_text "${WORKTREE:-worktree}" 3)")
    else
        line1_parts+=("${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}${RST}")
    fi

    # 디렉토리
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        line1_parts+=("${C_I_DIR}${ICON_DIR}${RST} $(colorize_text "${DIR_NAME}" 6)")
    else
        line1_parts+=("${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}${RST}")
    fi

    # Git 상태
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        line1_parts+=("$(format_git_status)")
        line1_parts+=("$(format_git_sync)")
    else
        line1_parts+=("${C_DIM_STATUS}${ICON_GIT_STATUS} status${RST}")
        line1_parts+=("${C_DIM_SYNC}${ICON_SYNC} sync${RST}")
    fi

    # 컨텍스트 (경고 색상 유지 - lsd/rainbow 제외)
    if [[ "$ICON_MODE" == "nerd" ]]; then
        line1_parts+=("${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}")
    else
        line1_parts+=("${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}")
    fi

    # Line 2: 세션 정보 + 테마
    local line2_parts=()

    # 모델
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        line2_parts+=("${C_I_MODEL}${ICON_MODEL}${RST} $(colorize_text "${MODEL}" 9)")
    else
        line2_parts+=("${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}${RST}")
    fi

    # Rate limit 정보
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
             line2_parts+=("${C_I_RATE}${ICON_TIME}${RST} $(colorize_text "${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)" 10)")
        else
             line2_parts+=("${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${C_RATE}(${RATE_LIMIT_PCT}%)${RST}")
        fi
    elif [[ -n "$RATE_LIMIT_PCT" ]]; then
        if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
             line2_parts+=("${C_I_RATE}${ICON_TIME}${RST} $(colorize_text "(${RATE_LIMIT_PCT}%)" 10)")
        else
             line2_parts+=("${C_I_RATE}${ICON_TIME} ${C_RATE}(${RATE_LIMIT_PCT}%)${RST}")
        fi
    fi

    # 세션 시간
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
         line2_parts+=("${C_I_TIME}${ICON_SESSION}${RST} $(colorize_text "${SESSION_DURATION_MIN}m" 20)")
    else
         line2_parts+=("${C_I_TIME}${ICON_SESSION} ${C_TIME}${SESSION_DURATION_MIN}m${RST}")
    fi

    # 번레이트
    if [[ -n "$BURN_RATE" ]]; then
        if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
             line2_parts+=("${C_I_BURN}${ICON_COST}${RST} $(colorize_text "${BURN_RATE}" 30)")
        else
             line2_parts+=("${C_I_BURN}${ICON_COST} ${C_BURN}${BURN_RATE}${RST}")
        fi
    fi

    # 현재 테마
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        line2_parts+=("${C_I_THEME}${ICON_THEME}${RST} $(colorize_text "${THEME_NAME}" 5)")
    else
        line2_parts+=("${C_I_THEME}${ICON_THEME} ${C_RATE}${THEME_NAME}${RST}")
    fi

    # 출력
    local line1="" line2=""
    for i in "${!line1_parts[@]}"; do
        [[ $i -eq 0 ]] && line1="${line1_parts[$i]}" || line1="$line1    ${line1_parts[$i]}"
    done
    for i in "${!line2_parts[@]}"; do
        [[ $i -eq 0 ]] && line2="${line2_parts[$i]}" || line2="$line2     ${line2_parts[$i]}"
    done

    echo -e "$line1"
    echo -e "$line2"
}
