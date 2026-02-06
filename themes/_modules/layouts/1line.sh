#!/bin/bash
# 1-line Layout Module - 컴팩트 1줄 레이아웃
# 모든 정보를 한 줄에 표시

LAYOUT_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$LAYOUT_DIR/common.sh"

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
        parts+=("$(format_git_status_common " ")")
        parts+=("$(format_git_sync_common " ")")
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
    parts+=("$(format_context_common)")

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
