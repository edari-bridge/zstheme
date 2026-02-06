#!/bin/bash

# Theme contract shared by shell modules.
# Format: [mono-|custom-][animation-]{layout}[-nerd]

THEME_LAYOUTS=("1line" "2line" "card" "bars" "badges")
THEME_COLOR_PREFIXES=("" "mono-" "custom-")
THEME_ANIMATION_PUBLIC_PREFIXES=("" "rainbow-")
THEME_ANIMATION_HIDDEN_PREFIXES=("lsd-")
THEME_ICON_SUFFIXES=("" "-nerd")

all_theme_animation_prefixes() {
    printf '%s\n' "${THEME_ANIMATION_PUBLIC_PREFIXES[@]}" "${THEME_ANIMATION_HIDDEN_PREFIXES[@]}"
}

is_hidden_animation_prefix() {
    local animation_prefix="$1"
    for value in "${THEME_ANIMATION_HIDDEN_PREFIXES[@]}"; do
        [[ "$value" == "$animation_prefix" ]] && return 0
    done
    return 1
}

is_valid_theme_name() {
    local theme="$1"
    [[ "$theme" =~ ^(mono-|custom-)?(lsd-|rainbow-)?(1line|2line|card|bars|badges)(-nerd)?$ ]]
}

parse_theme_name_contract() {
    local theme_name="$1"

    COLOR_MODE="pastel"
    ANIMATION_MODE="static"
    LAYOUT_MODE="2line"
    ICON_MODE="emoji"

    if [[ "$theme_name" == custom-* ]]; then
        COLOR_MODE="custom"
        theme_name="${theme_name#custom-}"
    elif [[ "$theme_name" == mono-* ]]; then
        COLOR_MODE="mono"
        theme_name="${theme_name#mono-}"
    fi

    if [[ "$theme_name" == lsd-* ]]; then
        ANIMATION_MODE="lsd"
        theme_name="${theme_name#lsd-}"
    elif [[ "$theme_name" == rainbow-* ]]; then
        ANIMATION_MODE="rainbow"
        theme_name="${theme_name#rainbow-}"
    fi

    if [[ "$theme_name" == *-nerd ]]; then
        ICON_MODE="nerd"
        theme_name="${theme_name%-nerd}"
    fi

    case "$theme_name" in
        1-line|1line) LAYOUT_MODE="1line" ;;
        2-line|2line|"") LAYOUT_MODE="2line" ;;
        card|bars|badges) LAYOUT_MODE="$theme_name" ;;
        *) LAYOUT_MODE="2line" ;;
    esac
}
