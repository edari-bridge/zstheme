#!/bin/bash
# zstheme Color Editor - UI 렌더링

# ============================================================
# 색상 정의
# ============================================================

_RST=$'\033[0m'
_BOLD=$'\033[1m'
_DIM=$'\033[2m'
_GREEN=$'\033[32m'
_YELLOW=$'\033[33m'
_CYAN=$'\033[36m'
_MAGENTA=$'\033[35m'
_WHITE=$'\033[37m'

# ============================================================
# 화면 그리기
# ============================================================

draw_editor_screen() {
    # ANSI escape로 화면 클리어 및 커서 홈
    printf '\033[2J\033[H'

    local term_width=$(tput cols 2>/dev/null || echo 80)
    local term_height=$(tput lines 2>/dev/null || echo 24)

    # 헤더
    draw_header

    # 색상 목록 (왼쪽)
    draw_color_list

    # 미리보기 (오른쪽)
    draw_preview

    # 현재 색상 정보
    draw_current_color_info

    # 도움말 (하단)
    draw_help_bar
}

# ============================================================
# 헤더
# ============================================================

draw_header() {
    local title="zstheme Color Editor"
    local version="v2.0"

    echo ""
    echo -e "  ${_MAGENTA}${_BOLD}╭──────────────────────────────────────────────────────────╮${_RST}"
    echo -e "  ${_MAGENTA}${_BOLD}│${_RST}  ${_CYAN}${title}${_RST}                                  ${version} ${_MAGENTA}${_BOLD}│${_RST}"
    echo -e "  ${_MAGENTA}${_BOLD}╰──────────────────────────────────────────────────────────╯${_RST}"
    echo ""
}

# ============================================================
# 색상 목록
# ============================================================

draw_color_list() {
    local y=6

    # 전경색 섹션
    tput cup $y 2
    if [[ $CATEGORY -eq 0 ]]; then
        echo -e "${_BOLD}${_CYAN}▼ Foreground Colors${_RST}"
    else
        echo -e "${_DIM}► Foreground Colors${_RST}"
    fi
    ((y++))

    tput cup $y 2
    echo -e "${_DIM}────────────────────${_RST}"
    ((y++))

    for i in "${!FG_NAMES[@]}"; do
        tput cup $y 2
        draw_color_item "$i" "${FG_NAMES[$i]}" "${FG_VALUES[$i]}" 0
        ((y++))
    done

    ((y++))

    # 배경색 섹션
    tput cup $y 2
    if [[ $CATEGORY -eq 1 ]]; then
        echo -e "${_BOLD}${_CYAN}▼ Background Colors${_RST}"
    else
        echo -e "${_DIM}► Background Colors${_RST}"
    fi
    ((y++))

    tput cup $y 2
    echo -e "${_DIM}────────────────────${_RST}"
    ((y++))

    for i in "${!BG_NAMES[@]}"; do
        tput cup $y 2
        draw_color_item "$i" "${BG_NAMES[$i]}" "${BG_VALUES[$i]}" 1
        ((y++))
    done
}

# ============================================================
# 색상 항목 그리기
# ============================================================

draw_color_item() {
    local idx=$1
    local name=$2
    local value=$3
    local cat=$4  # 0=FG, 1=BG

    # 선택 표시
    local marker="  "
    local style="${_RST}"

    if [[ $cat -eq $CATEGORY && $idx -eq $SELECTED_INDEX ]]; then
        marker="${_GREEN}▸ ${_RST}"
        style="${_BOLD}"
    fi

    # 색상 미리보기 블록
    local color_block=""
    if [[ $cat -eq 0 ]]; then
        color_block="\033[38;5;${value}m███${_RST}"
    else
        color_block="\033[48;5;${value}m   ${_RST}"
    fi

    # 출력
    printf "%s${style}%-12s${_RST} [${color_block}] %03d" "$marker" "$name" "$value"
}

# ============================================================
# 미리보기
# ============================================================

draw_preview() {
    local x=40
    local y=6

    tput cup $y $x
    echo -e "${_BOLD}Preview${_RST}"
    ((y++))

    tput cup $y $x
    echo -e "${_DIM}────────────────────────${_RST}"
    ((y++))

    # 현재 편집 중인 색상으로 예제 프롬프트 표시
    tput cup $y $x
    echo -e "${_DIM}┌─ 2line Preview ──────────┐${_RST}"
    ((y++))

    # Line 1: Git info
    tput cup $y $x
    local branch_fg="\033[38;5;${FG_VALUES[0]}m"
    local tree_fg="\033[38;5;${FG_VALUES[1]}m"
    local dir_fg="\033[38;5;${FG_VALUES[2]}m"
    echo -e "${_DIM}│${_RST} ${branch_fg}🌿 main${_RST}  ${tree_fg}main${_RST}  ${dir_fg}project${_RST}   ${_DIM}│${_RST}"
    ((y++))

    # Line 2: Model info
    tput cup $y $x
    local model_fg="\033[38;5;${FG_VALUES[3]}m"
    local ctx_fg="\033[38;5;${FG_VALUES[9]}m"
    echo -e "${_DIM}│${_RST} ${model_fg}🤖 Claude Opus 4.5${_RST} ${ctx_fg}35%${_RST}  ${_DIM}│${_RST}"
    ((y++))

    tput cup $y $x
    echo -e "${_DIM}└───────────────────────────┘${_RST}"
    ((y += 2))

    # Badges 예제
    tput cup $y $x
    echo -e "${_DIM}┌─ badges Preview ─────────┐${_RST}"
    ((y++))

    tput cup $y $x
    local bg_branch="\033[48;5;${BG_VALUES[0]}m"
    local bg_status="\033[48;5;${BG_VALUES[3]}m"
    local bg_model="\033[48;5;${BG_VALUES[5]}m"
    echo -e "${_DIM}│${_RST} ${bg_branch}${branch_fg} main ${_RST} ${bg_status}\033[38;5;${FG_VALUES[4]}m +3 ~2 ${_RST} ${_DIM}│${_RST}"
    ((y++))

    tput cup $y $x
    echo -e "${_DIM}│${_RST} ${bg_model}${model_fg} Opus ${_RST} ${ctx_fg}🔋 35%${_RST}      ${_DIM}│${_RST}"
    ((y++))

    tput cup $y $x
    echo -e "${_DIM}└───────────────────────────┘${_RST}"
}

# ============================================================
# 현재 색상 정보
# ============================================================

draw_current_color_info() {
    local x=40
    local y=22

    tput cup $y $x
    echo -e "${_DIM}────────────────────────${_RST}"
    ((y++))

    local current_name current_value
    if [[ $CATEGORY -eq 0 ]]; then
        current_name="${FG_NAMES[$SELECTED_INDEX]}"
        current_value="${FG_VALUES[$SELECTED_INDEX]}"
    else
        current_name="${BG_NAMES[$SELECTED_INDEX]}"
        current_value="${BG_VALUES[$SELECTED_INDEX]}"
    fi

    tput cup $y $x
    echo -e "Current: ${_BOLD}${current_name}${_RST} = ${_CYAN}${current_value}${_RST}"
    ((y++))

    # 256 색상 팔레트 미리보기 (현재 값 주변)
    tput cup $y $x
    echo -n "Nearby: "
    for offset in -5 -4 -3 -2 -1 0 1 2 3 4 5; do
        local c=$(( (current_value + offset + 256) % 256 ))
        if [[ $offset -eq 0 ]]; then
            echo -ne "\033[1;7;38;5;${c}m▓▓${_RST}"
        else
            echo -ne "\033[38;5;${c}m▓▓${_RST}"
        fi
    done
    echo ""
}

# ============================================================
# 도움말 바
# ============================================================

draw_help_bar() {
    local y=$(($(tput lines) - 2))

    tput cup $y 0
    echo -e "${_DIM}─────────────────────────────────────────────────────────────────────${_RST}"

    tput cup $((y + 1)) 2
    echo -e "${_CYAN}↑↓${_RST}:Select  ${_CYAN}←→${_RST}:±1  ${_CYAN}+/-${_RST}:±10  ${_CYAN}Tab${_RST}:Category  ${_CYAN}s${_RST}:Save  ${_CYAN}r${_RST}:Reset  ${_CYAN}q${_RST}:Quit"

    # 변경 표시
    if [[ "$MODIFIED" == true ]]; then
        tput cup $((y + 1)) 65
        echo -e "${_YELLOW}[Modified]${_RST}"
    fi
}
