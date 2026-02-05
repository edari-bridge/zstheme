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
    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        # Define base colors for Rainbow Shimmer here (Hardcoded for now as vars are in C_BG_*)
        # We need to pass the ANSI codes.
        
        # Raw content strings
        local raw_loc=" ${ICON_BRANCH} ${BRANCH:-branch}    ${ICON_TREE} ${WORKTREE:-worktree}    ${ICON_DIR} ${DIR_NAME} "
        
        local chip_loc
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            chip_loc=$(colorize_bg_lsd "$raw_loc" 0 "\033[30m")
        else
            # Rainbow Shimmer: Use specific base colors for the entire bar?
            # User wants: "Original badge color... shimmer".
            # But here 'raw_loc' combines 3 distinct semantic parts (Branch, Tree, Dir).
            # In 'Bars' layout, they are often unified or separate chips?
            # In the original static logic, line 1 is ONE chip for "Loc + Git + Ctx"?
            # Wait, original static uses `make_chip "$bg_loc" "$loc_content"` where `loc_content` has text colors.
            # And `bg_loc` is ONE color.
            # So the whole "Location" block has ONE background color.
            # Therefore, for Rainbow Mode, I should use *that* background color + Shimmer.
            
            # Static bg_loc comes from `get_animated_bg 0`.
            # If Rainbow, `get_animated_bg` returned a gradient color before.
            # Now for Rainbow Shimmer, we revert to "Original Color".
            # Original Colors are: C_BG_LOC, C_BG_GIT, C_BG_SES.
            
            # Applying Shimmer to C_BG_LOC (e.g. Blue). 
            # I need a Highlight version. Let's pick a brighter Cyan or White.
            # C_BG_LOC is usually Blue. Highlight: Cyan (\033[46m) or Bright Blue (\033[104m).
            # I will use Bright Standard Colors as highlights for simplicity.
            
            # LOC (Blue-ish) -> Highlight Cyan
            # Usage: colorize_bg_rainbow "text" "base_bg" "highlight_bg" "offset" "fg_color"
            
            # Since raw_loc has multiple parts (Branch, Tree, Dir), treating them as one block with one color policy is hard if we want adaptive text.
            # IN BARS LAYOUT: line 1 is usually unified or closely packed.
            # But here we are constructing `chip_loc` from `raw_loc` which contains Branch/Tree/Dir.
            # `bg_loc` in static mode is ONE color (usually Blue/Purple).
            # So `colorize_bg_rainbow` applies ONE base/highlight style.
            
            # If `raw_loc` spans Branch(Purple) + Tree(Green) + Dir(Blue) visually in *Badges* layout, they are distinct.
            # But in *Bars* layout, strictly speaking, `bg_loc` is the *Group* background.
            # `bars.sh` defines `C_BG_LOC`. Let's check `colors.sh` (implied).
            # Usually `C_BG_LOC` is a single color (e.g. Blue).
            # So text should be White on Blue.
            
            # We will switch text to White (\033[97m) for Loc.
            chip_loc=$(colorize_bg_rainbow "$raw_loc" "$C_BG_LOC" "\033[46m" 0 "\033[97m")
        fi
        
        local line1_chips="${chip_loc}    "
        
        # Git Chip
        if [[ "$IS_GIT_REPO" == "true" ]]; then
             local add mod del ahead behind
             [[ "$GIT_ADDED" -gt 0 ]] && add="+${GIT_ADDED}" || add="+0"
             [[ "$GIT_MODIFIED" -gt 0 ]] && mod="~${GIT_MODIFIED}" || mod="~0"
             [[ "$GIT_DELETED" -gt 0 ]] && del="-${GIT_DELETED}" || del="-0"
             [[ "$GIT_AHEAD" -gt 0 ]] && ahead="↑ ${GIT_AHEAD}" || ahead="↑ 0"
             [[ "$GIT_BEHIND" -gt 0 ]] && behind="↓ ${GIT_BEHIND}" || behind="↓ 0"
             
             local raw_git=" ${ICON_GIT_STATUS} ${add}  ${mod}  ${del}    ${ICON_SYNC} ${ahead}  ${behind} "
             
             local chip_git
             if [[ "$ANIMATION_MODE" == "lsd" ]]; then
                 chip_git=$(colorize_bg_lsd "$raw_git" 20 "\033[30m")
             else
                 # GIT (Green/Yellow-ish) -> Highlight Bright Green. Text Black.
                 chip_git=$(colorize_bg_rainbow "$raw_git" "$C_BG_GIT" "\033[102m" 20 "\033[30m")
             fi
             line1_chips+="${chip_git}    "
        else
             local raw_git=" ${ICON_GIT_STATUS} ---    ${ICON_SYNC} --- "
             local chip_git
             if [[ "$ANIMATION_MODE" == "lsd" ]]; then
                chip_git=$(colorize_bg_lsd "$raw_git" 20 "\033[30;2m")
             else
                chip_git=$(colorize_bg_rainbow "$raw_git" "$C_BG_GIT" "\033[102m" 20 "\033[30;2m")
             fi
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
        
        local chip_ses
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
            chip_ses=$(colorize_bg_lsd "$ses_raw" 40 "\033[30m")
        else
            # SESSION (Purple/Pink-ish) -> Highlight Magenta. Text White for contrast.
            chip_ses=$(colorize_bg_rainbow "$ses_raw" "$C_BG_SES" "\033[105m" 40 "\033[97m")
        fi
        
        line2_chips+="${chip_ses}    "
        
        # Theme
        # For Theme, we used colorize_text for gradient.
        # LSD: Text Gradient
        # Rainbow: Shimmer Text? Or Text Gradient?
        # User said "Rainbow: Shimmer / LSD: Full Spectrum".
        # Let's keep Text Gradient (colorize_text) for LSD.
        # For Rainbow, let's just use standard text color or Color Gradient?
        # "Rainbow Background... But Theme has no background".
        # Let's keep `colorize_text` for both to be safe, or just LSD.
        # Existing code already uses colorize_text.
        # I'll use colorize_text for both for now, assuming colorize_text follows the color palette (which is Pastel for Rainbow, Vivid for LSD).
        # Wait, colorize_text uses `RAINBOW_COLORS` or `LSD_COLORS`?
        # `lsd.sh` defines `LSD_COLORS`. `rainbow.sh` defines `RAINBOW_COLORS`.
        # I need to ensure `colorize_text` picks the right one.
        # Currently `rainbow.sh` uses `RAINBOW_COLORS`.
        # I should update `colorize_text` to support switching or use separate functions?
        # Actually, `rainbow.sh` is now the single source of truth for "Rainbow" mode animation.
        # `lsd.sh` is separate? No, `rainbow.sh` handles both.
        # I need to check `colorize_text` in `rainbow.sh`.
        
        local theme_raw="${ICON_THEME} ${THEME_NAME}"
        local chip_theme
        if [[ "$ANIMATION_MODE" == "lsd" ]]; then
             # Use LSD colors via a text function?
             # I need to make sure colorize_text uses vivid colors for LSD.
             # Currently `rainbow.sh` uses `RAINBOW_COLORS` (Pastel).
             # I'll update `rainbow.sh` to select palette based on mode in `colorize_text` later.
             # Assuming `colorize_text` works:
             chip_theme=$(colorize_text "$theme_raw")
        else
             # Rainbow: Pastel text gradient
             chip_theme=$(colorize_text "$theme_raw")
        fi
        
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
