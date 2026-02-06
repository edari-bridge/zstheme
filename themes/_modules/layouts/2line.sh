#!/bin/bash
# 2-line Layout Module - 2줄 레이아웃
# Line 1: Git 정보 + 컨텍스트
# Line 2: 모델 + Rate limit + 세션
# format_git_status, format_git_sync, is_animated, render_text → helpers.sh

# ============================================================
# 렌더링 함수
# ============================================================

render() {
    init_colors

    # Line 1: Git 정보 + 컨텍스트
    local line1_parts=()

    # 브랜치
    line1_parts+=("$(render_text "$C_I_BRANCH" "$ICON_BRANCH" "${BRANCH:-branch}" "$C_BRANCH" 0)")

    # 워크트리
    line1_parts+=("$(render_text "$C_I_TREE" "$ICON_TREE" "${WORKTREE:-worktree}" "$C_TREE" 3)")

    # 디렉토리
    line1_parts+=("$(render_text "$C_I_DIR" "$ICON_DIR" "${DIR_NAME}" "$C_DIR" 6)")

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
    line2_parts+=("$(render_text "$C_I_MODEL" "$ICON_MODEL" "${MODEL}" "$C_MODEL" 9)")

    # Rate limit 정보
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        if is_animated; then
             line2_parts+=("${C_I_RATE}${ICON_TIME}${RST} $(colorize_text "${RATE_TIME_LEFT} · ${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)" 10)")
        else
             line2_parts+=("${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${C_RATE}(${RATE_LIMIT_PCT}%)${RST}")
        fi
    elif [[ -n "$RATE_LIMIT_PCT" ]]; then
        if is_animated; then
             line2_parts+=("${C_I_RATE}${ICON_TIME}${RST} $(colorize_text "(${RATE_LIMIT_PCT}%)" 10)")
        else
             line2_parts+=("${C_I_RATE}${ICON_TIME} ${C_RATE}(${RATE_LIMIT_PCT}%)${RST}")
        fi
    fi

    # 세션 시간
    line2_parts+=("$(render_text "$C_I_TIME" "$ICON_SESSION" "${SESSION_DURATION_MIN}m" "$C_TIME" 20)")

    # 번레이트
    if [[ -n "$BURN_RATE" ]]; then
        line2_parts+=("$(render_text "$C_I_BURN" "$ICON_COST" "${BURN_RATE}" "$C_BURN" 30)")
    fi

    # 현재 테마
    line2_parts+=("$(render_text "$C_I_THEME" "$ICON_THEME" "${THEME_NAME}" "$C_RATE" 5)")

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
