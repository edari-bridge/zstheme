#!/bin/bash
# Bars/Badges Layout Module
#
# TINTED_MODE (loader.sh에서 설정):
#   false (기본) - bars: 그룹 단위 배경색 (여러 요소를 막대처럼 묶음)
#   true         - badges: 요소별 개별 배경색 (각 요소마다 개별 배지)
#
# CHIP_STYLE 환경변수로 스타일 선택 가능:
#   badge (기본)   - 배경만 (가장 미니멀)
#   pipe           - ┃ ┃

# ============================================================
# 칩 스타일 설정
# ============================================================

CHIP_STYLE="${CHIP_STYLE:-badge}"

# ============================================================
# Tinted 모드용 역상 배경색 (글자색의 어두운 버전)
# ============================================================

C_BG_BRANCH=$'\033[48;5;58m'    # Yellow(93) → Dark Yellow/Olive
C_BG_TREE=$'\033[48;5;22m'      # Green(92) → Dark Green
C_BG_DIR=$'\033[48;5;23m'       # Cyan(96) → Dark Cyan/Teal
C_BG_STATUS=$'\033[48;5;24m'    # Blue - grouped chips와 동일
C_BG_SYNC=$'\033[48;5;53m'      # Purple(141) → Dark Purple
C_BG_MODEL=$'\033[48;5;53m'     # Magenta(95) → Dark Magenta
C_BG_RATE=$'\033[48;5;58m'      # Yellow(229) → Dark Yellow
C_BG_TIME=$'\033[48;5;24m'      # Blue - grouped chips와 동일
C_BG_BURN=$'\033[48;5;94m'      # Orange(216) → Dark Orange
C_BG_CTX=$'\033[48;5;22m'       # Context → Dark Green (정상)
C_BG_CTX_WARN=$'\033[48;5;94m'  # Context → Dark Orange (경고)
C_BG_CTX_CRIT=$'\033[48;5;52m'  # Context → Dark Red (위험)

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
# 렌더링 함수 - Grouped (기본)
# ============================================================

render_grouped() {
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
        loc_content="${C_BRANCH}${ICON_BRANCH} ${BRANCH:-branch}${RST}${bg_loc}    "
        loc_content="${loc_content}${C_TREE}${ICON_TREE} ${WORKTREE:-worktree}${RST}${bg_loc}    "
        loc_content="${loc_content}${C_DIR}${ICON_DIR} ${DIR_NAME}${RST}"
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
        git_content="${C_STATUS}${ICON_GIT_STATUS}${RST}${bg_git} ${add}  ${mod}  ${del}    ${C_SYNC}${ICON_SYNC}${RST}${bg_git} ${ahead}  ${behind}"
    else
        git_content="${C_DIM_STATUS}${ICON_GIT_STATUS} ---${RST}${bg_git}    ${C_DIM_SYNC}${ICON_SYNC} ---${RST}"
    fi

    local ctx_display
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c8=$(echo -e "$(get_animated_color 8)")
        ctx_display="${c8}${CTX_ICON} ${CONTEXT_PCT}%${RST}"
    else
        ctx_display="${C_CTX_TEXT}${CTX_ICON} ${CONTEXT_PCT}%${RST}"
    fi

    local line1="$(make_chip "$bg_loc" "$loc_content")    $(make_chip "$bg_git" "$git_content")    ${ctx_display}"

    # Line 2: 세션 칩 + 테마
    local ses_content=""
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c9=$(echo -e "$(get_animated_color 9)")
        ses_content="${c9}${ICON_MODEL} ${MODEL}${RST}${bg_ses}"
    else
        ses_content="${C_MODEL}${ICON_MODEL} ${MODEL}${RST}${bg_ses}"
    fi

    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        ses_content="${ses_content}     ${C_RATE}${ICON_TIME} ${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${rate_color}${RATE_LIMIT_PCT}%${RST}${bg_ses}"
    fi

    ses_content="${ses_content}     ${C_TIME}${ICON_SESSION} ${SESSION_DURATION_MIN}m${RST}${bg_ses}"
    [[ -n "$BURN_RATE" ]] && ses_content="${ses_content}     ${C_BURN}${ICON_COST} ${BURN_RATE}${RST}"

    local theme_display
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c0=$(echo -e "$(get_animated_color 0)")
        theme_display="${c0}${ICON_THEME} ${THEME_NAME}${RST}"
    else
        theme_display="${C_RATE}${ICON_THEME} ${THEME_NAME}${RST}"
    fi

    local line2="$(make_chip "$bg_ses" "$ses_content")    ${theme_display}"

    echo -e "$line1"
    echo -e "$line2"
}

# ============================================================
# 렌더링 함수 - Tinted (요소별 역상 배경색)
# ============================================================

render_tinted() {
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

    # Line 1: 각 요소별 개별 칩
    local chip_branch chip_tree chip_dir chip_status chip_sync chip_ctx

    # 브랜치 칩
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c0=$(echo -e "$(get_animated_color 0)")
        chip_branch="$(make_chip "$C_BG_BRANCH" "${c0}${ICON_BRANCH} ${BRANCH:-branch}")"
    else
        chip_branch="$(make_chip "$C_BG_BRANCH" "${C_BRANCH}${ICON_BRANCH} ${BRANCH:-branch}")"
    fi

    # 워크트리 칩
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c1=$(echo -e "$(get_animated_color 1)")
        chip_tree="$(make_chip "$C_BG_TREE" "${c1}${ICON_TREE} ${WORKTREE:-worktree}")"
    else
        chip_tree="$(make_chip "$C_BG_TREE" "${C_TREE}${ICON_TREE} ${WORKTREE:-worktree}")"
    fi

    # 디렉토리 칩
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c2=$(echo -e "$(get_animated_color 2)")
        chip_dir="$(make_chip "$C_BG_DIR" "${c2}${ICON_DIR} ${DIR_NAME}")"
    else
        chip_dir="$(make_chip "$C_BG_DIR" "${C_DIR}${ICON_DIR} ${DIR_NAME}")"
    fi

    # Git 상태 칩
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local status_content sync_content
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
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
            status_content="${C_STATUS}${ICON_GIT_STATUS}${add}  ${mod}  ${del}"

            local ahead behind
            [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}" || ahead="${C_DIM_SYNC}↑ 0"
            [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}" || behind="${C_DIM_SYNC}↓ 0"
            sync_content="${C_SYNC}${ICON_SYNC}${ahead}  ${behind}"
        fi
        chip_status="$(make_chip "$C_BG_STATUS" "$status_content")"
        chip_sync="$(make_chip "$C_BG_SYNC" "$sync_content")"
    else
        chip_status="$(make_chip "$C_BG_STATUS" "${C_DIM_STATUS}${ICON_GIT_STATUS} ---")"
        chip_sync="$(make_chip "$C_BG_SYNC" "${C_DIM_SYNC}${ICON_SYNC} ---")"
    fi

    # 컨텍스트 (배경 없음)
    local chip_ctx
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c8=$(echo -e "$(get_animated_color 8)")
        chip_ctx="${c8}${CTX_ICON} ${CONTEXT_PCT}%${RST}"
    else
        chip_ctx="${C_CTX_TEXT}${CTX_ICON} ${CONTEXT_PCT}%${RST}"
    fi

    local line1="${chip_branch} ${chip_tree} ${chip_dir}  ${chip_status} ${chip_sync}  ${chip_ctx}"

    # Line 2: 각 요소별 개별 칩
    local chip_model chip_rate chip_time chip_burn chip_theme

    # 모델 칩
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c9=$(echo -e "$(get_animated_color 9)")
        chip_model="$(make_chip "$C_BG_MODEL" "${c9}${ICON_MODEL} ${MODEL}")"
    else
        chip_model="$(make_chip "$C_BG_MODEL" "${C_MODEL}${ICON_MODEL} ${MODEL}")"
    fi

    # Rate limit 칩
    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        chip_rate="$(make_chip "$C_BG_RATE" "${C_RATE}${ICON_TIME} ${RATE_TIME_LEFT}·${RATE_RESET_TIME} ${rate_color}${RATE_LIMIT_PCT}%")"
    else
        chip_rate=""
    fi

    # 세션 시간 칩
    chip_time="$(make_chip "$C_BG_TIME" "${C_TIME}${ICON_SESSION} ${SESSION_DURATION_MIN}m")"

    # 번레이트 칩
    if [[ -n "$BURN_RATE" ]]; then
        chip_burn="$(make_chip "$C_BG_BURN" "${C_BURN}${ICON_COST} ${BURN_RATE}")"
    else
        chip_burn=""
    fi

    # 테마 (배경 없음)
    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local c0=$(echo -e "$(get_animated_color 0)")
        chip_theme="${c0}${ICON_THEME} ${THEME_NAME}${RST}"
    else
        chip_theme="${C_RATE}${ICON_THEME} ${THEME_NAME}${RST}"
    fi

    local line2="${chip_model} ${chip_rate} ${chip_time} ${chip_burn}  ${chip_theme}"
    # 빈 칩 제거
    line2=$(echo "$line2" | sed 's/  */ /g')

    echo -e "$line1"
    echo -e "$line2"
}

# ============================================================
# 메인 렌더 함수 - 모드에 따라 선택
# ============================================================

render() {
    if [[ "$TINTED_MODE" == "true" ]]; then
        render_tinted
    else
        render_grouped
    fi
}
