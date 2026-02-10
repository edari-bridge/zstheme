#!/bin/bash
# Badges Layout Module
# 요소별 개별 배경색 (각 요소마다 개별 배지)
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

    # lsd/rainbow 모드: 배경색 순환, 글자색은 기존 유지
    local bg_branch bg_tree bg_dir bg_status bg_sync bg_model bg_rate bg_time bg_burn
    if is_animated; then
        bg_branch=$(get_animated_badge_bg 0)
        bg_tree=$(get_animated_badge_bg 1)
        bg_dir=$(get_animated_badge_bg 2)
        bg_status=$(get_animated_badge_bg 3)
        bg_sync=$(get_animated_badge_bg 4)
        bg_model=$(get_animated_badge_bg 5)
        bg_rate=$(get_animated_badge_bg 6)
        bg_time=$(get_animated_badge_bg 7)
        bg_burn=$(get_animated_badge_bg 8)
    else
        bg_branch="$C_BG_BRANCH"
        bg_tree="$C_BG_TREE"
        bg_dir="$C_BG_DIR"
        bg_status="$C_BG_STATUS"
        bg_sync="$C_BG_SYNC"
        bg_model="$C_BG_MODEL"
        bg_rate="$C_BG_RATE"
        bg_time="$C_BG_TIME"
        bg_burn="$C_BG_BURN"
    fi

    # Line 1: 각 요소별 개별 칩
    local chip_branch chip_tree chip_dir chip_status chip_sync chip_ctx

    # 브랜치 칩
    chip_branch="$(make_animated_content "bg_chip" "${BRANCH:-branch}" 0 "${C_I_BRANCH}" "${ICON_BRANCH}" "$bg_branch" "${C_BRANCH}")"

    # 워크트리 칩
    chip_tree="$(make_animated_content "bg_chip" "${WORKTREE:-worktree}" 10 "${C_I_TREE}" "${ICON_TREE}" "$bg_tree" "${C_TREE}")"

    # 디렉토리 칩
    chip_dir="$(make_animated_content "bg_chip" "${DIR_NAME}" 20 "${C_I_DIR}" "${ICON_DIR}" "$bg_dir" "${C_DIR}")"

    # Git 상태 칩
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local add mod del ahead behind
        if is_animated; then
            [[ "$GIT_ADDED" -gt 0 ]] && add="+${GIT_ADDED}" || add="+0"
            [[ "$GIT_MODIFIED" -gt 0 ]] && mod="~${GIT_MODIFIED}" || mod="~0"
            [[ "$GIT_DELETED" -gt 0 ]] && del="-${GIT_DELETED}" || del="-0"
            chip_status="$(make_animated_content "bg_chip" "${add} ${mod} ${del}" 30 "${C_I_STATUS}" "${ICON_GIT_STATUS}" "$bg_status" "")"

            [[ "$GIT_AHEAD" -gt 0 ]] && ahead="↑ ${GIT_AHEAD}" || ahead="↑ 0"
            [[ "$GIT_BEHIND" -gt 0 ]] && behind="↓ ${GIT_BEHIND}" || behind="↓ 0"
            chip_sync="$(make_animated_content "bg_chip" "${ahead} ${behind}" 40 "${C_I_SYNC}" "${ICON_SYNC}" "$bg_sync" "")"
        else
            [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}" || add="${C_DIM_STATUS}+0"
            [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}" || mod="${C_DIM_STATUS}~0"
            [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}" || del="${C_DIM_STATUS}-0"
            chip_status="$(make_chip "$bg_status" "${C_I_STATUS}${ICON_GIT_STATUS}${add}  ${mod}  ${del}")"

            [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}" || ahead="${C_DIM_SYNC}↑ 0"
            [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}" || behind="${C_DIM_SYNC}↓ 0"
            chip_sync="$(make_chip "$bg_sync" "${C_I_SYNC}${ICON_SYNC}${ahead}  ${behind}")"
        fi
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
    chip_model="$(make_animated_content "bg_chip" "${MODEL}" 50 "${C_I_MODEL}" "${ICON_MODEL}" "$bg_model" "${C_MODEL}")"

    # Rate limit 칩
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        if is_animated; then
            chip_rate="$(make_animated_content "bg_chip" "${RATE_TIME_LEFT}·${RATE_RESET_TIME} (${RATE_LIMIT_PCT}%)" 60 "${C_I_RATE}" "${ICON_TIME}" "$bg_rate" "")"
        else
            local rate_color=$(get_rate_color)
            chip_rate="$(make_chip "$bg_rate" "${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT}·${RATE_RESET_TIME} ${rate_color}(${RATE_LIMIT_PCT}%)")"
        fi
    else
        chip_rate=""
    fi

    # 세션 시간 칩
    chip_time="$(make_animated_content "bg_chip" "${SESSION_DURATION_MIN}m" 70 "${C_I_TIME}" "${ICON_SESSION}" "$bg_time" "${C_TIME}")"

    # 번레이트 칩
    if [[ -n "$BURN_RATE" ]]; then
        chip_burn="$(make_animated_content "bg_chip" "${BURN_RATE}" 80 "${C_I_BURN}" "${ICON_COST}" "$bg_burn" "${C_BURN}")"
    else
        chip_burn=""
    fi

    # 테마 (배경 없음, 텍스트 그라데이션)
    if is_animated; then
        chip_theme="$(colorize_text "${ICON_THEME} ${THEME_NAME}")"
    else
        chip_theme="${C_I_THEME}${ICON_THEME} ${C_I_THEME}${THEME_NAME}${RST}"
    fi

    local line2="${chip_model} ${chip_rate} ${chip_time} ${chip_burn}  ${chip_theme}"
    # 빈 칩 제거
    line2=$(echo "$line2" | sed 's/  */ /g')

    echo -e "$line1"
    echo -e "$line2"
}
