#!/bin/bash
# zstheme Color Editor - UI 렌더링 (버퍼링 방식)

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
_CLR=$'\033[K'  # 줄 끝까지 클리어

# ============================================================
# 화면 그리기 (버퍼링)
# ============================================================

draw_editor_screen() {
    local buf=""
    local term_width=$(tput cols 2>/dev/null || echo 80)
    local term_height=$(tput lines 2>/dev/null || echo 40)

    # 커서 홈으로 (클리어 없이)
    buf+='\033[H'

    # 헤더 (줄 1-5)
    buf+="\n${_CLR}"
    buf+="  ${_MAGENTA}${_BOLD}╭──────────────────────────────────────────────────────────╮${_RST}${_CLR}\n"
    buf+="  ${_MAGENTA}${_BOLD}│${_RST}  ${_CYAN}zstheme Color Editor${_RST}                                  v2.0 ${_MAGENTA}${_BOLD}│${_RST}${_CLR}\n"
    buf+="  ${_MAGENTA}${_BOLD}╰──────────────────────────────────────────────────────────╯${_RST}${_CLR}\n"
    buf+="\n${_CLR}"

    # 왼쪽 패널: 색상 목록 (줄 6-30)
    # 오른쪽 패널: 미리보기 (같은 줄에 커서 이동)

    local y=6

    # Foreground Colors 헤더
    buf+="\033[${y};2H"
    if [[ $CATEGORY -eq 0 ]]; then
        buf+="${_BOLD}${_CYAN}▼ Foreground Colors${_RST}${_CLR}"
    else
        buf+="${_DIM}► Foreground Colors${_RST}${_CLR}"
    fi
    # 오른쪽에 Preview 헤더
    buf+="\033[${y};40H${_BOLD}Preview${_RST}${_CLR}"
    ((y++))

    # 구분선
    buf+="\033[${y};2H${_DIM}────────────────────${_RST}${_CLR}"
    buf+="\033[${y};40H${_DIM}────────────────────────${_RST}${_CLR}"
    ((y++))

    # 전경색 목록
    for i in "${!FG_NAMES[@]}"; do
        buf+="\033[${y};2H"
        buf+=$(format_color_item "$i" "${FG_NAMES[$i]}" "${FG_VALUES[$i]}" 0)
        buf+="${_CLR}"
        ((y++))
    done

    # 2line Preview (줄 8-11)
    local preview_y=8
    buf+="\033[${preview_y};40H${_DIM}┌─ 2line Preview ──────────┐${_RST}${_CLR}"
    ((preview_y++))

    local branch_fg="\033[38;5;${FG_VALUES[0]}m"
    local tree_fg="\033[38;5;${FG_VALUES[1]}m"
    local dir_fg="\033[38;5;${FG_VALUES[2]}m"
    buf+="\033[${preview_y};40H${_DIM}│${_RST} ${branch_fg}🌿 main${_RST}  ${tree_fg}main${_RST}  ${dir_fg}project${_RST}   ${_DIM}│${_RST}${_CLR}"
    ((preview_y++))

    local model_fg="\033[38;5;${FG_VALUES[3]}m"
    local ctx_fg="\033[38;5;${FG_VALUES[9]}m"
    buf+="\033[${preview_y};40H${_DIM}│${_RST} ${model_fg}🤖 Claude Opus 4.5${_RST} ${ctx_fg}35%${_RST}  ${_DIM}│${_RST}${_CLR}"
    ((preview_y++))

    buf+="\033[${preview_y};40H${_DIM}└───────────────────────────┘${_RST}${_CLR}"
    ((preview_y += 2))

    # badges Preview (줄 14-18)
    buf+="\033[${preview_y};40H${_DIM}┌─ badges Preview ─────────┐${_RST}${_CLR}"
    ((preview_y++))

    local bg_branch="\033[48;5;${BG_VALUES[0]}m"
    local bg_status="\033[48;5;${BG_VALUES[3]}m"
    local bg_model="\033[48;5;${BG_VALUES[5]}m"
    local status_fg="\033[38;5;${FG_VALUES[4]}m"
    buf+="\033[${preview_y};40H${_DIM}│${_RST} ${bg_branch}${branch_fg} main ${_RST} ${bg_status}${status_fg} +3 ~2 ${_RST} ${_DIM}│${_RST}${_CLR}"
    ((preview_y++))

    buf+="\033[${preview_y};40H${_DIM}│${_RST} ${bg_model}${model_fg} Opus ${_RST} ${ctx_fg}🔋 35%${_RST}      ${_DIM}│${_RST}${_CLR}"
    ((preview_y++))

    buf+="\033[${preview_y};40H${_DIM}└───────────────────────────┘${_RST}${_CLR}"

    # 빈 줄
    ((y++))

    # Background Colors 헤더
    buf+="\033[${y};2H"
    if [[ $CATEGORY -eq 1 ]]; then
        buf+="${_BOLD}${_CYAN}▼ Background Colors${_RST}${_CLR}"
    else
        buf+="${_DIM}► Background Colors${_RST}${_CLR}"
    fi
    ((y++))

    # 구분선
    buf+="\033[${y};2H${_DIM}────────────────────${_RST}${_CLR}"
    ((y++))

    # 배경색 목록
    for i in "${!BG_NAMES[@]}"; do
        buf+="\033[${y};2H"
        buf+=$(format_color_item "$i" "${BG_NAMES[$i]}" "${BG_VALUES[$i]}" 1)
        buf+="${_CLR}"
        ((y++))
    done

    # 현재 색상 정보 (오른쪽 하단)
    local info_y=22
    buf+="\033[${info_y};40H${_DIM}────────────────────────${_RST}${_CLR}"
    ((info_y++))

    local current_name current_value
    if [[ $CATEGORY -eq 0 ]]; then
        current_name="${FG_NAMES[$SELECTED_INDEX]}"
        current_value="${FG_VALUES[$SELECTED_INDEX]}"
    else
        current_name="${BG_NAMES[$SELECTED_INDEX]}"
        current_value="${BG_VALUES[$SELECTED_INDEX]}"
    fi

    buf+="\033[${info_y};40HCurrent: ${_BOLD}${current_name}${_RST} = ${_CYAN}${current_value}${_RST}${_CLR}"
    ((info_y++))

    # Nearby 팔레트
    buf+="\033[${info_y};40HNearby: "
    for offset in -5 -4 -3 -2 -1 0 1 2 3 4 5; do
        local c=$(( (current_value + offset + 256) % 256 ))
        if [[ $offset -eq 0 ]]; then
            buf+="\033[1;7;38;5;${c}m▓▓${_RST}"
        else
            buf+="\033[38;5;${c}m▓▓${_RST}"
        fi
    done
    buf+="${_CLR}"

    # 도움말 바 (하단 고정)
    local help_y=$((term_height - 2))
    buf+="\033[${help_y};0H${_DIM}─────────────────────────────────────────────────────────────────────${_RST}${_CLR}"
    ((help_y++))

    buf+="\033[${help_y};2H${_CYAN}↑↓${_RST}:Select  ${_CYAN}←→${_RST}:±1  ${_CYAN}+/-${_RST}:±10  ${_CYAN}Tab${_RST}:Category  ${_CYAN}s${_RST}:Save  ${_CYAN}r${_RST}:Reset  ${_CYAN}q${_RST}:Quit"

    # 변경 표시
    if [[ "$MODIFIED" == true ]]; then
        buf+="\033[${help_y};65H${_YELLOW}[Modified]${_RST}"
    fi
    buf+="${_CLR}"

    # 한 번에 출력
    printf '%b' "$buf"
}

# ============================================================
# 색상 항목 포맷팅
# ============================================================

format_color_item() {
    local idx=$1
    local name=$2
    local value=$3
    local cat=$4  # 0=FG, 1=BG

    local result=""

    # 선택 표시
    if [[ $cat -eq $CATEGORY && $idx -eq $SELECTED_INDEX ]]; then
        result+="${_GREEN}▸ ${_BOLD}"
    else
        result+="  "
    fi

    # 이름 (12자 고정폭)
    result+=$(printf "%-12s" "$name")
    result+="${_RST}"

    # 색상 미리보기 블록
    result+=" ["
    if [[ $cat -eq 0 ]]; then
        result+="\033[38;5;${value}m███${_RST}"
    else
        result+="\033[48;5;${value}m   ${_RST}"
    fi
    result+="] "

    # 값 (3자리)
    result+=$(printf "%03d" "$value")

    echo -n "$result"
}
