#!/bin/bash

# Common formatting helpers shared by layout modules.

format_git_status_common() {
    local separator="${1:- }"
    local add mod del

    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        local add_text mod_text del_text
        [[ "$GIT_ADDED" -gt 0 ]] && add_text="+${GIT_ADDED}" || add_text="+0"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod_text="~${GIT_MODIFIED}" || mod_text="~0"
        [[ "$GIT_DELETED" -gt 0 ]] && del_text="-${GIT_DELETED}" || del_text="-0"
        add="$(colorize_text "$add_text" 3)"
        mod="$(colorize_text "$mod_text" 5)"
        del="$(colorize_text "$del_text" 7)"
    else
        [[ "$GIT_ADDED" -gt 0 ]] && add="${C_BRIGHT_STATUS}+${GIT_ADDED}${RST}" || add="${C_DIM_STATUS}+0${RST}"
        [[ "$GIT_MODIFIED" -gt 0 ]] && mod="${C_BRIGHT_STATUS}~${GIT_MODIFIED}${RST}" || mod="${C_DIM_STATUS}~0${RST}"
        [[ "$GIT_DELETED" -gt 0 ]] && del="${C_BRIGHT_STATUS}-${GIT_DELETED}${RST}" || del="${C_DIM_STATUS}-0${RST}"
    fi

    echo "${C_I_STATUS}${ICON_GIT_STATUS}${RST} ${add}${separator}${mod}${separator}${del}"
}

format_git_sync_common() {
    local separator="${1:- }"
    local ahead behind

    if [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" ]]; then
        local ahead_text behind_text
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead_text="↑ ${GIT_AHEAD}" || ahead_text="↑ 0"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind_text="↓ ${GIT_BEHIND}" || behind_text="↓ 0"
        ahead="$(colorize_text "$ahead_text" 0)"
        behind="$(colorize_text "$behind_text" 4)"
    else
        [[ "$GIT_AHEAD" -gt 0 ]] && ahead="${C_BRIGHT_SYNC}↑ ${GIT_AHEAD}${RST}" || ahead="${C_DIM_SYNC}↑ 0${RST}"
        [[ "$GIT_BEHIND" -gt 0 ]] && behind="${C_BRIGHT_SYNC}↓ ${GIT_BEHIND}${RST}" || behind="${C_DIM_SYNC}↓ 0${RST}"
    fi

    echo "${C_I_SYNC}${ICON_SYNC}${RST} ${ahead}${separator}${behind}"
}

format_context_common() {
    if [[ "$ICON_MODE" == "nerd" ]]; then
        echo "${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    else
        echo "${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    fi
}
