#!/bin/bash
# Badges Layout Module
# 요소별 개별 배경색 (각 요소마다 개별 배지)
#
# CHIP_STYLE 환경변수로 스타일 선택 가능:
#   badge (기본)   - 배경만 (가장 미니멀)
#   pipe           - ┃ ┃

# ============================================================
# 칩 스타일 설정
# ============================================================

CHIP_STYLE="${CHIP_STYLE:-badge}"

# ============================================================
# 요소별 배경색은 colors/*.sh에서 정의
# (mono.sh, color.sh 각각 다른 배경색 사용)
# ============================================================

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

    # 컨텍스트 기반 배경색 선택
    local bg_ctx
    if [[ "$CONTEXT_PCT" -ge 70 ]]; then
        bg_ctx="$C_BG_CTX_CRIT"
    elif [[ "$CONTEXT_PCT" -ge 50 ]]; then
        bg_ctx="$C_BG_CTX_WARN"
    else
        bg_ctx="$C_BG_CTX"
    fi

    # lsd 모드: 배경색 순환, 글자색은 기존 유지
    local bg_branch bg_tree bg_dir bg_status bg_sync bg_model
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        bg_branch=$(get_animated_badge_bg 0)
        bg_tree=$(get_animated_badge_bg 1)
        bg_dir=$(get_animated_badge_bg 2)
        bg_status=$(get_animated_badge_bg 3)
        bg_sync=$(get_animated_badge_bg 4)
        bg_model=$(get_animated_badge_bg 5)
    else
        bg_branch="$C_BG_BRANCH"
        bg_tree="$C_BG_TREE"
        bg_dir="$C_BG_DIR"
        bg_status="$C_BG_STATUS"
        bg_sync="$C_BG_SYNC"
        bg_model="$C_BG_MODEL"
    fi

    # Line 1: 각 요소별 개별 칩
    local chip_branch chip_tree chip_dir chip_status chip_sync chip_ctx

    # 브랜치 칩
    if [[ "$ANIMATION_MODE" == "rainbow" ]]; then
        local c0=$(echo -e "$(get_animated_color 0)")
        chip_branch="$(make_chip "$bg_branch" "${c0}${ICON_BRANCH} ${BRANCH:-branch}")"
    else
        chip_branch="$(make_chip "$bg_branch" "${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}")"
    fi

    # 워크트리 칩
    if [[ "$ANIMATION_MODE" == "rainbow" ]]; then
        local c1=$(echo -e "$(get_animated_color 1)")
        chip_tree="$(make_chip "$bg_tree" "${c1}${ICON_TREE} ${WORKTREE:-worktree}")"
    else
        chip_tree="$(make_chip "$bg_tree" "${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}")"
    fi

    # 디렉토리 칩
    if [[ "$ANIMATION_MODE" == "rainbow" ]]; then
        local c2=$(echo -e "$(get_animated_color 2)")
        chip_dir="$(make_chip "$bg_dir" "${c2}${ICON_DIR} ${DIR_NAME}")"
    else
        chip_dir="$(make_chip "$bg_dir" "${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}")"
    fi

    # Git 상태 칩
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local status_content sync_content
        if [[ "$ANIMATION_MODE" == "rainbow" ]]; then
            local c3=$(echo -e "$(get_animated_color 3)")
            local c4=$(echo -e "$(get_animated_color 4)")
            local c5=$(echo -e "$(get_animated_color 5)")
            local add mod del
            [[ "$GIT_ADDED" -gt 0 ]] && add="${c3}+${GIT_ADDED}" || add="${c3}+0"
            [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${c4}~${GIT_MODIFIED}" || mod="${c4}~0"
            [[ "$GIT_DELETED" -gt 0 ]] && del="${c5}-${GIT_DELETED}" || del="${c5}-0"
            status_content="${C_STATUS}${ICON_GIT_STATUS}${add}  ${mod}  ${del}"

            local c6=$(echo -e "$(get_animated_color 6)")
            local c7=$(echo -e "$(get_animated_color 7)")
            local ahead behind
            [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${c6}↑ ${GIT_AHEAD}" || ahead="${c6}↑ 0"
            [[ "$GIT_BEHIND" -gt 0 ]] && behind="${c7}↓ ${GIT_BEHIND}" || behind="${c7}↓ 0"
            sync_content="${C_SYNC}${ICON_SYNC}${ahead}  ${behind}"
        else
            local add mod del
            [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}" || add="${C_DIM_STATUS}+0"
            [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}" || mod="${C_DIM_STATUS}~0"
            [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}" || del="${C_DIM_STATUS}-0"
            status_content="${C_I_STATUS}${ICON_GIT_STATUS}${add}  ${mod}  ${del}"

            local ahead behind
            [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}" || ahead="${C_DIM_SYNC}↑ 0"
            [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}" || behind="${C_DIM_SYNC}↓ 0"
            sync_content="${C_I_SYNC}${ICON_SYNC}${ahead}  ${behind}"
        fi
        chip_status="$(make_chip "$bg_status" "$status_content")"
        chip_sync="$(make_chip "$bg_sync" "$sync_content")"
    else
        chip_status="$(make_chip "$bg_status" "${C_DIM_STATUS}${ICON_GIT_STATUS} ---")"
        chip_sync="$(make_chip "$bg_sync" "${C_DIM_SYNC}${ICON_SYNC} ---")"
    fi

    # 컨텍스트 (경고 색상 유지 - lsd/rainbow 제외)
    local chip_ctx
    if [[ "$ICON_MODE" == "nerd" ]]; then
        chip_ctx="${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    else
        chip_ctx="${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    fi

    local line1="${chip_branch} ${chip_tree} ${chip_dir}  ${chip_status} ${chip_sync}  ${chip_ctx}"

    # Line 2: 각 요소별 개별 칩
    local chip_model chip_rate chip_time chip_burn chip_theme

    # 모델 칩
    if [[ "$ANIMATION_MODE" == "rainbow" ]]; then
        local c9=$(echo -e "$(get_animated_color 9)")
        chip_model="$(make_chip "$bg_model" "${c9}${ICON_MODEL} ${MODEL}")"
    else
        chip_model="$(make_chip "$bg_model" "${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}")"
    fi

    # Rate limit 칩
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        chip_rate="$(make_chip "$C_BG_RATE" "${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT}·${RATE_RESET_TIME} ${rate_color}${RATE_LIMIT_PCT}%")"
    else
        chip_rate=""
    fi

    # 세션 시간 칩
    chip_time="$(make_chip "$C_BG_TIME" "${C_I_TIME}${ICON_SESSION} ${C_TIME}${SESSION_DURATION_MIN}m")"

    # 번레이트 칩
    if [[ -n "$BURN_RATE" ]]; then
        chip_burn="$(make_chip "$C_BG_BURN" "${C_I_BURN}${ICON_COST} ${C_BURN}${BURN_RATE}")"
    else
        chip_burn=""
    fi

    # 테마 (배경 없음)
    if [[ "$ANIMATION_MODE" == "rainbow" ]]; then
        local c0=$(echo -e "$(get_animated_color 0)")
        chip_theme="${c0}${ICON_THEME} ${THEME_NAME}${RST}"
    else
        chip_theme="${C_I_THEME}${ICON_THEME} ${C_RATE}${THEME_NAME}${RST}"
    fi

    local line2="${chip_model} ${chip_rate} ${chip_time} ${chip_burn}  ${chip_theme}"
    # 빈 칩 제거
    line2=$(echo "$line2" | sed 's/  */ /g')

    echo -e "$line1"
    echo -e "$line2"
}
