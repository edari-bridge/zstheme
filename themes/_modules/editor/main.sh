#!/bin/bash
# zstheme Color Editor - 메인 루프
# tweakcc 스타일 화살표 키 기반 인터랙티브 색상 편집기

# ============================================================
# 초기화
# ============================================================

# EDITOR_DIR 결정
if [[ -n "${BASH_SOURCE[0]}" && -f "${BASH_SOURCE[0]}" ]]; then
    EDITOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
elif [[ -n "$THEME_DIR" ]]; then
    EDITOR_DIR="$THEME_DIR/_modules/editor"
else
    EDITOR_DIR="${SCRIPT_DIR:-$(pwd)}/themes/_modules/editor"
fi

MODULES_DIR="$(dirname "$EDITOR_DIR")"

# save.sh 로드
source "$EDITOR_DIR/save.sh"

# ============================================================
# 색상 정의
# ============================================================

RST=$'\033[0m'
BOLD=$'\033[1m'
DIM=$'\033[2m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
CYAN=$'\033[36m'
MAGENTA=$'\033[35m'

# ============================================================
# 상태 변수
# ============================================================

SELECTED_INDEX=0
CATEGORY=0  # 0: 전경색, 1: 배경색

# 전경색 목록
declare -a FG_NAMES=("Branch" "Worktree" "Directory" "Model" "Status" "Sync" "Rate" "Burn" "Time" "Context")
declare -a FG_VARS=("C_BRANCH" "C_TREE" "C_DIR" "C_MODEL" "C_STATUS" "C_SYNC" "C_RATE" "C_BURN" "C_TIME" "C_CTX")
declare -a FG_DEFAULTS=(93 92 96 95 111 141 229 216 75 92)

# 배경색 목록
declare -a BG_NAMES=("BG Branch" "BG Worktree" "BG Dir" "BG Status" "BG Sync" "BG Model" "BG LOC" "BG GIT" "BG SES")
declare -a BG_VARS=("C_BG_BRANCH" "C_BG_TREE" "C_BG_DIR" "C_BG_STATUS" "C_BG_SYNC" "C_BG_MODEL" "C_BG_LOC" "C_BG_GIT" "C_BG_SES")
declare -a BG_DEFAULTS=(58 22 23 24 53 53 23 24 53)

# 현재 색상 값
declare -a FG_VALUES=()
declare -a BG_VALUES=()

MODIFIED=false

# ============================================================
# 색상 값 초기화
# ============================================================

init_color_values() {
    local custom_file="$HOME/.config/zstheme/custom-color.sh"

    if [[ -f "$custom_file" ]]; then
        source "$custom_file"
        for i in "${!FG_VARS[@]}"; do
            local var="${FG_VARS[$i]}_CODE"
            FG_VALUES[$i]="${!var:-${FG_DEFAULTS[$i]}}"
        done
        for i in "${!BG_VARS[@]}"; do
            local var="${BG_VARS[$i]}_CODE"
            BG_VALUES[$i]="${!var:-${BG_DEFAULTS[$i]}}"
        done
    else
        FG_VALUES=("${FG_DEFAULTS[@]}")
        BG_VALUES=("${BG_DEFAULTS[@]}")
    fi
}

# ============================================================
# 화면 그리기
# ============================================================

draw_screen() {
    tput clear 2>/dev/null || clear

    # 헤더
    echo ""
    echo "  ${MAGENTA}${BOLD}╭──────────────────────────────────────────────────────────╮${RST}"
    echo "  ${MAGENTA}${BOLD}│${RST}  ${CYAN}zstheme Color Editor${RST}                                  v2.0 ${MAGENTA}${BOLD}│${RST}"
    echo "  ${MAGENTA}${BOLD}╰──────────────────────────────────────────────────────────╯${RST}"
    echo ""

    # 두 컬럼 레이아웃을 위한 배열
    local -a left_lines=()
    local -a right_lines=()

    # === 왼쪽: 색상 목록 ===
    if [[ $CATEGORY -eq 0 ]]; then
        left_lines+=("${BOLD}${CYAN}▼ Foreground Colors${RST}")
    else
        left_lines+=("${DIM}► Foreground Colors${RST}")
    fi
    left_lines+=("${DIM}────────────────────────${RST}")

    for i in "${!FG_NAMES[@]}"; do
        local marker="  "
        local style=""
        if [[ $CATEGORY -eq 0 && $i -eq $SELECTED_INDEX ]]; then
            marker="${GREEN}▸ "
            style="${BOLD}"
        fi
        local color_block=$'\033[38;5;'"${FG_VALUES[$i]}"'m███'"${RST}"
        left_lines+=("${marker}${style}$(printf '%-12s' "${FG_NAMES[$i]}")${RST} [${color_block}] $(printf '%03d' "${FG_VALUES[$i]}")")
    done

    left_lines+=("")
    if [[ $CATEGORY -eq 1 ]]; then
        left_lines+=("${BOLD}${CYAN}▼ Background Colors${RST}")
    else
        left_lines+=("${DIM}► Background Colors${RST}")
    fi
    left_lines+=("${DIM}────────────────────────${RST}")

    for i in "${!BG_NAMES[@]}"; do
        local marker="  "
        local style=""
        if [[ $CATEGORY -eq 1 && $i -eq $SELECTED_INDEX ]]; then
            marker="${GREEN}▸ "
            style="${BOLD}"
        fi
        local color_block=$'\033[48;5;'"${BG_VALUES[$i]}"'m   '"${RST}"
        left_lines+=("${marker}${style}$(printf '%-12s' "${BG_NAMES[$i]}")${RST} [${color_block}] $(printf '%03d' "${BG_VALUES[$i]}")")
    done

    # === 오른쪽: 미리보기 ===
    right_lines+=("${BOLD}Preview${RST}")
    right_lines+=("${DIM}────────────────────────${RST}")
    right_lines+=("")

    # 2line Preview
    local branch_c=$'\033[38;5;'"${FG_VALUES[0]}"'m'
    local tree_c=$'\033[38;5;'"${FG_VALUES[1]}"'m'
    local dir_c=$'\033[38;5;'"${FG_VALUES[2]}"'m'
    local model_c=$'\033[38;5;'"${FG_VALUES[3]}"'m'
    local ctx_c=$'\033[38;5;'"${FG_VALUES[9]}"'m'

    right_lines+=("${DIM}┌─ 2line ──────────────────┐${RST}")
    right_lines+=("${DIM}│${RST} ${branch_c}🌿 main${RST}  ${tree_c}main${RST}  ${dir_c}project${RST}    ${DIM}│${RST}")
    right_lines+=("${DIM}│${RST} ${model_c}🤖 Claude Opus 4.5${RST} ${ctx_c}35%${RST}   ${DIM}│${RST}")
    right_lines+=("${DIM}└───────────────────────────┘${RST}")
    right_lines+=("")

    # badges Preview
    local bg_branch=$'\033[48;5;'"${BG_VALUES[0]}"'m'
    local bg_status=$'\033[48;5;'"${BG_VALUES[3]}"'m'
    local bg_model=$'\033[48;5;'"${BG_VALUES[5]}"'m'
    local status_c=$'\033[38;5;'"${FG_VALUES[4]}"'m'

    right_lines+=("${DIM}┌─ badges ─────────────────┐${RST}")
    right_lines+=("${DIM}│${RST} ${bg_branch}${branch_c} main ${RST} ${bg_status}${status_c} +3 ~2 ${RST}      ${DIM}│${RST}")
    right_lines+=("${DIM}│${RST} ${bg_model}${model_c} Opus ${RST} ${ctx_c}🔋 35%${RST}       ${DIM}│${RST}")
    right_lines+=("${DIM}└───────────────────────────┘${RST}")
    right_lines+=("")
    right_lines+=("${DIM}────────────────────────${RST}")

    # 현재 값 정보
    local current_name current_value
    if [[ $CATEGORY -eq 0 ]]; then
        current_name="${FG_NAMES[$SELECTED_INDEX]}"
        current_value="${FG_VALUES[$SELECTED_INDEX]}"
    else
        current_name="${BG_NAMES[$SELECTED_INDEX]}"
        current_value="${BG_VALUES[$SELECTED_INDEX]}"
    fi
    right_lines+=("Current: ${BOLD}${current_name}${RST} = ${CYAN}${current_value}${RST}")

    # Nearby 팔레트
    local nearby="Nearby: "
    for offset in -5 -4 -3 -2 -1 0 1 2 3 4 5; do
        local c=$(( (current_value + offset + 256) % 256 ))
        if [[ $offset -eq 0 ]]; then
            nearby+=$'\033[1;7;38;5;'"${c}"'m▓▓'"${RST}"
        else
            nearby+=$'\033[38;5;'"${c}"'m▓▓'"${RST}"
        fi
    done
    right_lines+=("$nearby")

    # 두 컬럼 출력
    local max_lines=${#left_lines[@]}
    [[ ${#right_lines[@]} -gt $max_lines ]] && max_lines=${#right_lines[@]}

    for ((i=0; i<max_lines; i++)); do
        local left="${left_lines[$i]:-}"
        local right="${right_lines[$i]:-}"
        # 왼쪽 35칸, 오른쪽
        printf "  %-38b    %b\n" "$left" "$right"
    done

    echo ""

    # 도움말 바
    echo "${DIM}─────────────────────────────────────────────────────────────────────${RST}"
    local help_line="${CYAN}↑↓${RST}:Select  ${CYAN}←→${RST}:±1  ${CYAN}+/-${RST}:±10  ${CYAN}Tab${RST}:Category  ${CYAN}s${RST}:Save  ${CYAN}r${RST}:Reset  ${CYAN}q${RST}:Quit"
    if [[ "$MODIFIED" == true ]]; then
        echo -e "  ${help_line}  ${YELLOW}[Modified]${RST}"
    else
        echo -e "  ${help_line}"
    fi
}

# ============================================================
# 메인 루프
# ============================================================

run_color_editor() {
    init_color_values

    # 커서 숨기기
    tput civis 2>/dev/null || true
    trap 'tput cnorm 2>/dev/null || true; tput clear 2>/dev/null; exit' INT TERM EXIT

    while true; do
        draw_screen

        # 키 입력
        read -rsn1 key

        case "$key" in
            q|Q)
                if [[ "$MODIFIED" == true ]]; then
                    echo ""
                    echo -e "  ${YELLOW}Unsaved changes! Save before quit? (y/n/c)${RST}"
                    read -rsn1 confirm
                    case "$confirm" in
                        y|Y) save_custom_colors ;;
                        c|C) continue ;;
                    esac
                fi
                break
                ;;
            s|S)
                save_custom_colors
                ;;
            r|R)
                FG_VALUES=("${FG_DEFAULTS[@]}")
                BG_VALUES=("${BG_DEFAULTS[@]}")
                MODIFIED=true
                ;;
            $'\t')  # Tab
                CATEGORY=$(( (CATEGORY + 1) % 2 ))
                SELECTED_INDEX=0
                ;;
            '+'|'=')
                adjust_color 10
                ;;
            '-'|'_')
                adjust_color -10
                ;;
            $'\x1b')  # Escape sequence
                read -rsn2 -t 0.1 seq
                case "$seq" in
                    '[A')  # Up
                        move_selection -1
                        ;;
                    '[B')  # Down
                        move_selection 1
                        ;;
                    '[C')  # Right
                        adjust_color 1
                        ;;
                    '[D')  # Left
                        adjust_color -1
                        ;;
                esac
                ;;
            k|K) move_selection -1 ;;
            j|J) move_selection 1 ;;
            h|H) adjust_color -1 ;;
            l|L) adjust_color 1 ;;
            '[') adjust_color -10 ;;
            ']') adjust_color 10 ;;
        esac
    done

    tput cnorm 2>/dev/null || true
    tput clear 2>/dev/null || clear
}

# ============================================================
# 헬퍼 함수
# ============================================================

move_selection() {
    local delta=$1
    local max_index

    if [[ $CATEGORY -eq 0 ]]; then
        max_index=${#FG_NAMES[@]}
    else
        max_index=${#BG_NAMES[@]}
    fi

    SELECTED_INDEX=$((SELECTED_INDEX + delta))

    if [[ $SELECTED_INDEX -lt 0 ]]; then
        SELECTED_INDEX=$((max_index - 1))
    elif [[ $SELECTED_INDEX -ge $max_index ]]; then
        SELECTED_INDEX=0
    fi
}

adjust_color() {
    local delta=$1
    local current_value new_value

    if [[ $CATEGORY -eq 0 ]]; then
        current_value=${FG_VALUES[$SELECTED_INDEX]}
        new_value=$((current_value + delta))
        [[ $new_value -lt 0 ]] && new_value=255
        [[ $new_value -gt 255 ]] && new_value=0
        FG_VALUES[$SELECTED_INDEX]=$new_value
    else
        current_value=${BG_VALUES[$SELECTED_INDEX]}
        new_value=$((current_value + delta))
        [[ $new_value -lt 0 ]] && new_value=255
        [[ $new_value -gt 255 ]] && new_value=0
        BG_VALUES[$SELECTED_INDEX]=$new_value
    fi

    MODIFIED=true
}
