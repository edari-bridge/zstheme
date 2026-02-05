#!/bin/bash
# Bars Layout Module
# 그룹 단위 배경색 (여러 요소를 막대처럼 묶음)
#
# CHIP_STYLE 환경변수로 스타일 선택 가능:
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
# 렌더링 함수
# ============================================================

render() {
    init_colors

    # 배경색 가져오기 (lsd/rainbow일 때 순환)
    local bg_loc bg_git bg_ses
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
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
    if [[ "$ANIMATION_MODE" == "rainbow" || "$ANIMATION_MODE" == "lsd" ]]; then
        # Raw content for gradient background
        # Padding spaces added directly to string for colorize_bg to color them
        local raw_loc=" ${ICON_BRANCH} ${BRANCH:-branch}    ${ICON_TREE} ${WORKTREE:-worktree}    ${ICON_DIR} ${DIR_NAME} "
        # Use colorize_bg with Black text
        # Offset 0
        local chip_loc=$(colorize_bg "$raw_loc" 0 "\033[30m")
        # Reuse chip_loc as the full chip since background is applied

        # We construct chips individually or as a block?
        # make_chip applies padding.
        # If I use colorize_bg, I should include padding in the text.
        # Let's construct the whole line 1 chips.
        
        local line1_chips=""
        
        # Loc Chip
        line1_chips+="${chip_loc}    "
        
        # Git Chip
        if [[ "$IS_GIT_REPO" == "true" ]]; then
             local add mod del ahead behind
             [[ "$GIT_ADDED" -gt 0 ]] && add="+${GIT_ADDED}" || add="+0"
             [[ "$GIT_MODIFIED" -gt 0 ]] && mod="~${GIT_MODIFIED}" || mod="~0"
             [[ "$GIT_DELETED" -gt 0 ]] && del="-${GIT_DELETED}" || del="-0"
             [[ "$GIT_AHEAD" -gt 0 ]] && ahead="↑ ${GIT_AHEAD}" || ahead="↑ 0"
             [[ "$GIT_BEHIND" -gt 0 ]] && behind="↓ ${GIT_BEHIND}" || behind="↓ 0"
             
             local raw_git=" ${ICON_GIT_STATUS} ${add}  ${mod}  ${del}    ${ICON_SYNC} ${ahead}  ${behind} "
             local chip_git=$(colorize_bg "$raw_git" 20 "\033[30m")
             line1_chips+="${chip_git}    "
        else
             local raw_git=" ${ICON_GIT_STATUS} ---    ${ICON_SYNC} --- "
             local chip_git=$(colorize_bg "$raw_git" 20 "\033[30;2m") # Dim black?
             line1_chips+="${chip_git}    "
        fi
        
        # Context (Keep standard)
        if [[ "$ICON_MODE" == "nerd" ]]; then
            line1_chips+="${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
        else
            line1_chips+="${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
        fi
        
        local line1="${line1_chips}"
        
        # Line 2: Session + Theme
        local line2_chips=""
        
        # Session Chip
        local ses_raw=" ${ICON_MODEL} ${MODEL}"
        if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
            ses_raw+="     ${ICON_TIME} ${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${RATE_LIMIT_PCT}"
        fi
        ses_raw+="     ${ICON_SESSION} ${SESSION_DURATION_MIN}m"
        [[ -n "$BURN_RATE" ]] && ses_raw+="     ${ICON_COST} ${BURN_RATE}"
        ses_raw+=" "
        
        local chip_ses=$(colorize_bg "$ses_raw" 40 "\033[30m")
        line2_chips+="${chip_ses}    "
        
        # Theme
        local theme_raw="${ICON_THEME} ${THEME_NAME}"
        # Theme is usually just text. Let's keep it simple or apply gradient?
        # Let's apply gradient to theme too for consistency.
        local chip_theme=$(colorize_text "$theme_raw") # Theme uses text gradient usually?
        # User said "LSD text effect... on background".
        # Let's use text gradient for Theme name (as it has no background chip usually).
        # OR should Theme name also have background?
        # In bars, Theme name is standalone.
        # Let's keep Theme name as Text Gradient (colorize_text) as it fits better without a bar.
        
        line2_chips+="${chip_theme}"
        
        local line2="${line2_chips}"
        
        echo -e "$line1"
        echo -e "$line2"
        return
    fi

    # ... Original Logic below ...

    # Line 1: 위치 칩 + Git 칩 + 컨텍스트
    local loc_content=""
    # lsd와 static 모두 동일한 글자색 (기존 모노톤 유지)
    loc_content="${C_I_BRANCH}${ICON_BRANCH} ${C_BRANCH}${BRANCH:-branch}    "
    loc_content="${loc_content}${C_I_TREE}${ICON_TREE} ${C_TREE}${WORKTREE:-worktree}    "
    loc_content="${loc_content}${C_I_DIR}${ICON_DIR} ${C_DIR}${DIR_NAME}"

    local git_content=""
    if [[ "$IS_GIT_REPO" == "true" ]]; then
        local add mod del ahead behind
        # lsd와 static 모두 동일한 글자색
        [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}" || add="${C_DIM_STATUS}+0"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}" || mod="${C_DIM_STATUS}~0"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}" || del="${C_DIM_STATUS}-0"
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}" || ahead="${C_DIM_SYNC}↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}" || behind="${C_DIM_SYNC}↓ 0"
        git_content="${C_I_STATUS}${ICON_GIT_STATUS} ${add}  ${mod}  ${del}    ${C_I_SYNC}${ICON_SYNC} ${ahead}  ${behind}"
    else
        git_content="${C_DIM_STATUS}${ICON_GIT_STATUS} ---    ${C_DIM_SYNC}${ICON_SYNC} ---"
    fi

    # 컨텍스트 (경고 색상 유지 - lsd/rainbow 제외)
    local ctx_display
    if [[ "$ICON_MODE" == "nerd" ]]; then
        ctx_display="${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    else
        ctx_display="${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    fi

    local line1="$(make_chip "$bg_loc" "$loc_content")    $(make_chip "$bg_git" "$git_content")    ${ctx_display}"

    # Line 2: 세션 칩 + 테마
    local ses_content=""
    # lsd와 static 모두 동일한 글자색
    ses_content="${C_I_MODEL}${ICON_MODEL} ${C_MODEL}${MODEL}"

    if [[ -n "$RATE_TIME_LEFT" && -n "$RATE_RESET_TIME" && -n "$RATE_LIMIT_PCT" ]]; then
        local rate_color=$(get_rate_color)
        ses_content="${ses_content}     ${C_I_RATE}${ICON_TIME} ${C_RATE}${RATE_TIME_LEFT} · ${RATE_RESET_TIME} ${rate_color}${RATE_LIMIT_PCT}"
    fi

    ses_content="${ses_content}     ${C_I_TIME}${ICON_SESSION} ${C_TIME}${SESSION_DURATION_MIN}m"
    [[ -n "$BURN_RATE" ]] && ses_content="${ses_content}     ${C_I_BURN}${ICON_COST} ${C_BURN}${BURN_RATE}"

    local theme_display
    # lsd와 static 모두 동일한 글자색
    theme_display="${C_I_THEME}${ICON_THEME} ${C_RATE}${THEME_NAME}${RST}"

    local line2="$(make_chip "$bg_ses" "$ses_content")    ${theme_display}"

    echo -e "$line1"
    echo -e "$line2"
}
