#!/bin/bash
# 2-line Layout Module - 2줄 레이아웃
# Line 1: Git 정보 + 컨텍스트
# Line 2: 모델 + Rate limit + 세션

LAYOUT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$LAYOUT_DIR/common.sh"

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
        line1_parts+=("$(format_git_status_common "  ")")
        line1_parts+=("$(format_git_sync_common "  ")")
    else
        line1_parts+=("${C_DIM_STATUS}${ICON_GIT_STATUS} status${RST}")
        line1_parts+=("${C_DIM_SYNC}${ICON_SYNC} sync${RST}")
    fi

    # 컨텍스트 (경고 색상 유지 - lsd/rainbow 제외)
    line1_parts+=("$(format_context_common)")

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
