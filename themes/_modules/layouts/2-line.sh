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

    echo "${C_STATUS}${ICON_GIT_STATUS}${RST} ${add}  ${mod}  ${del}"
}

format_git_sync() {
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

    echo "${C_SYNC}${ICON_SYNC}${RST} ${ahead}  ${behind}"
}

# ============================================================
# 렌더링 함수
# ============================================================

render() {
    init_colors

    # Line 1: Git 정보 + 컨텍스트
    local line1_parts=()

    # 브랜치
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c
        c=$(echo -e "$(get_animated_color 0)")
        line1_parts+=("${c}${ICON_BRANCH} ${BRANCH:-branch}${RST}")
    else
        line1_parts+=("${C_BRANCH}${ICON_BRANCH} ${BRANCH:-branch}${RST}")
    fi

    # 워크트리
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c
        c=$(echo -e "$(get_animated_color 1)")
        line1_parts+=("${c}${ICON_TREE} ${WORKTREE:-worktree}${RST}")
    else
        line1_parts+=("${C_TREE}${ICON_TREE} ${WORKTREE:-worktree}${RST}")
    fi

    # 디렉토리
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c
        c=$(echo -e "$(get_animated_color 2)")
        line1_parts+=("${c}${ICON_DIR} ${DIR_NAME}${RST}")
    else
        line1_parts+=("${C_DIR}${ICON_DIR} ${DIR_NAME}${RST}")
    fi

    # Git 상태
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        line1_parts+=("$(format_git_status)")
        line1_parts+=("$(format_git_sync)")
    else
        line1_parts+=("${C_DIM_STATUS}${ICON_GIT_STATUS} status${RST}")
        line1_parts+=("${C_DIM_SYNC}${ICON_SYNC} sync${RST}")
    fi

    # 컨텍스트 (Nerd: 아이콘=녹색, %=기본 / 이모지: 전체 기본)
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c
        c=$(echo -e "$(get_animated_color 8)")
        line1_parts+=("${c}${CTX_ICON} ${CONTEXT_PCT}%${RST}")
    elif [[ "$ICON_MODE" == "nerd" ]]; then
        line1_parts+=("${C_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}")
    else
        line1_parts+=("${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}")
    fi

    # Line 2: 세션 정보 + 테마
    local line2_parts=()

    # 모델
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c
        c=$(echo -e "$(get_animated_color 9)")
        line2_parts+=("${c}${ICON_MODEL} ${MODEL}${RST}")
    else
        line2_parts+=("${C_MODEL}${ICON_MODEL} ${MODEL}${RST}")
    fi

    # Rate limit 정보
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        line2_parts+=("${C_RATE}${ICON_TIME} ${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${rate_color}${RATE_LIMIT_PCT}%${C_RATE})${RST}")
    elif [[ -n "$RATE_LIMIT_PCT" ]]; then
        line2_parts+=("${C_RATE}${ICON_TIME} ${RATE_LIMIT_PCT}%${RST}")
    fi

    # 세션 시간
    line2_parts+=("${C_TIME}${ICON_SESSION} ${SESSION_DURATION_MIN}m${RST}")

    # 번레이트
    [[ -n "$BURN_RATE" ]] && line2_parts+=("${C_BURN}${ICON_COST} ${BURN_RATE}${RST}")

    # 현재 테마
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c
        c=$(echo -e "$(get_animated_color 0)")
        line2_parts+=("${c}${ICON_THEME} ${THEME_NAME}${RST}")
    else
        line2_parts+=("${C_RATE}${ICON_THEME} ${THEME_NAME}${RST}")
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
