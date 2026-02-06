#!/bin/bash
# Shared Helper Functions for all layouts

# ============================================================
# Animation mode check
# ============================================================

is_animated() {
    [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]
}

# ============================================================
# Git status formatting
# Args: $1 = separator between add/mod/del (default: "  ")
# ============================================================

format_git_status() {
    local sep="${1:-  }"
    local add mod del

    if is_animated; then
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

    echo "${C_I_STATUS}${ICON_GIT_STATUS}${RST} ${add}${sep}${mod}${sep}${del}"
}

# ============================================================
# Git sync formatting
# Args: $1 = separator between ahead/behind (default: "  ")
# ============================================================

format_git_sync() {
    local sep="${1:-  }"
    local ahead behind

    if is_animated; then
        local ahead_text behind_text
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead_text="↑ ${GIT_AHEAD}" || ahead_text="↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind_text="↓ ${GIT_BEHIND}" || behind_text="↓ 0"
        ahead=$(colorize_text "$ahead_text" 0)
        behind=$(colorize_text "$behind_text" 4)
    else
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}${RST}" || ahead="${C_DIM_SYNC}↑ 0${RST}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}${RST}" || behind="${C_DIM_SYNC}↓ 0${RST}"
    fi

    echo "${C_I_SYNC}${ICON_SYNC}${RST} ${ahead}${sep}${behind}"
}

# ============================================================
# Animated text render helper
# Args: $1=icon_color_var $2=icon_var $3=text $4=color_var $5=offset
# ============================================================

render_text() {
    local icon_color="$1" icon="$2" text="$3" color_var="$4" offset="$5"
    if is_animated; then
        echo "${icon_color}${icon}${RST} $(colorize_text "$text" "$offset")"
    else
        echo "${icon_color}${icon} ${color_var}${text}${RST}"
    fi
}
