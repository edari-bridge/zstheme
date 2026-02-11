#!/bin/bash

# Common formatting helpers shared by layout modules.

# Animation mode check (shared by all layouts)
is_animated() {
    [[ "$ANIMATION_MODE" == "lsd" || "$ANIMATION_MODE" == "rainbow" || "$ANIMATION_MODE" == "p.lsd" ]]
}

# Render text with animation or static color
# Args: $1=icon_color $2=icon $3=text $4=color_var $5=offset
render_text() {
    local icon_color="$1" icon="$2" text="$3" color_var="$4" offset="$5"
    if is_animated; then
        echo "${icon_color}${icon}${RST} $(colorize_text "$text" "$offset")"
    else
        echo "${icon_color}${icon} ${color_var}${text}${RST}"
    fi
}

format_git_status() {
    local separator="${1:- }"
    local add mod del

    if is_animated; then
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

format_git_sync() {
    local separator="${1:- }"
    local ahead behind

    if is_animated; then
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

format_context() {
    if [[ "$ICON_MODE" == "nerd" ]]; then
        echo "${C_I_CTX}${CTX_ICON}${RST} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    else
        echo "${CTX_ICON} ${C_CTX_TEXT}${CONTEXT_PCT}%${RST}"
    fi
}

# Unified animation content generator
# Args: $1=type ("text"|"chip"|"bg_chip"), $2=text, $3=offset,
#       $4=icon_color, $5=icon, $6=bg_color, $7=text_color (static only)
make_animated_content() {
    local type="$1" text="$2" offset="$3"
    local icon_color="$4" icon="$5" bg_color="$6" text_color="$7"

    if [[ "$ANIMATION_MODE" == "lsd" ]]; then
        case "$type" in
            bg_chip) make_chip "$bg_color" "$(colorize_text_dark "${icon} ${text}" "$offset")" ;;
            chip) make_chip "$bg_color" "${icon_color}${icon} $(colorize_text "$text" "$offset")" ;;
            text) echo "${icon_color}${icon}${RST} $(colorize_text "$text" "$offset")" ;;
        esac
    elif [[ "$ANIMATION_MODE" == "p.lsd" ]]; then
        case "$type" in
            bg_chip) make_chip "$bg_color" "$(colorize_text_dark "${icon} ${text}" "$offset")" ;;
            chip) make_chip "$bg_color" "$(colorize_text_dark "${icon} ${text}" "$offset")" ;;
            text) echo "${icon_color}${icon}${RST} $(colorize_text "$text" "$offset")" ;;
        esac
    elif is_animated; then
        case "$type" in
            bg_chip) make_chip "$bg_color" "${icon_color}${icon} $(colorize_text "$text" "$offset")" ;;
            chip) make_chip "$bg_color" "${icon_color}${icon} $(colorize_text "$text" "$offset")" ;;
            text) echo "${icon_color}${icon}${RST} $(colorize_text "$text" "$offset")" ;;
        esac
    else
        case "$type" in
            bg_chip|chip) make_chip "$bg_color" "${icon_color}${icon} ${text_color}${text}" ;;
            text) echo "${icon_color}${icon} ${text_color}${text}${RST}" ;;
        esac
    fi
}

# visible_width: ANSI 제거 후 가시 너비 계산
visible_width() {
    local plain
    plain=$(printf '%s' "$1" | sed $'s/\x1b\\[[0-9;]*m//g')
    printf '%s' "$plain" | wc -m | tr -d ' '
}

# align_two_lines: 두 라인의 parts를 동적 간격으로 join하여 우측 정렬
# 사용법: align_two_lines line1_arr_name line2_arr_name [min_sep]
# 결과: ALIGNED_LINE1, ALIGNED_LINE2 전역 변수에 저장
# Note: bash 3.2 호환 (nameref 미사용)
align_two_lines() {
    local _arr1_name="$1" _arr2_name="$2"
    local min_sep="${3:-2}"

    # 배열 크기 가져오기 (bash 3.2 호환)
    local l1_count l2_count
    eval "l1_count=\${#${_arr1_name}[@]}"
    eval "l2_count=\${#${_arr2_name}[@]}"

    # 각 라인의 content width 합산
    local l1_content=0 l2_content=0
    local i w elem

    i=0
    while [[ $i -lt $l1_count ]]; do
        eval "elem=\"\${${_arr1_name}[$i]}\""
        w=$(visible_width "$elem")
        l1_content=$((l1_content + w))
        i=$((i + 1))
    done

    i=0
    while [[ $i -lt $l2_count ]]; do
        eval "elem=\"\${${_arr2_name}[$i]}\""
        w=$(visible_width "$elem")
        l2_content=$((l2_content + w))
        i=$((i + 1))
    done

    # measure: content_width + (count-1) * min_sep
    local l1_sep_count=0 l2_sep_count=0
    [[ $l1_count -gt 1 ]] && l1_sep_count=$((l1_count - 1))
    [[ $l2_count -gt 1 ]] && l2_sep_count=$((l2_count - 1))
    local l1_measure=$((l1_content + l1_sep_count * min_sep))
    local l2_measure=$((l2_content + l2_sep_count * min_sep))

    local target=$l1_measure
    [[ $l2_measure -gt $target ]] && target=$l2_measure

    # join aligned helper
    _join_aligned_impl() {
        local _pname="$1" content_w="$2" count="$3"

        if [[ $count -le 1 ]]; then
            eval "printf '%s' \"\${${_pname}[0]}\""
            return
        fi

        local sep_count=$((count - 1))
        local total_sep=$((target - content_w))
        local min_total=$((sep_count * min_sep))
        [[ $total_sep -lt $min_total ]] && total_sep=$min_total

        local base_sep=$((total_sep / sep_count))
        local extra=$((total_sep % sep_count))

        local result="" j pad
        j=0
        while [[ $j -lt $count ]]; do
            eval "elem=\"\${${_pname}[$j]}\""
            if [[ $j -eq $sep_count ]]; then
                result="${result}${elem}"
            else
                pad=$base_sep
                [[ $j -lt $extra ]] && pad=$((pad + 1))
                result="${result}${elem}$(printf '%*s' "$pad" '')"
            fi
            j=$((j + 1))
        done
        printf '%s' "$result"
    }

    ALIGNED_LINE1=$(_join_aligned_impl "$_arr1_name" "$l1_content" "$l1_count")
    ALIGNED_LINE2=$(_join_aligned_impl "$_arr2_name" "$l2_content" "$l2_count")
}
