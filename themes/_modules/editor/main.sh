#!/bin/bash
# zstheme Color Editor - 메인 루프
# tweakcc 스타일 화살표 키 기반 인터랙티브 색상 편집기

# ============================================================
# 초기화
# ============================================================

# EDITOR_DIR 결정: BASH_SOURCE가 정확하지 않을 경우 THEME_DIR 기반으로 계산
if [[ -n "${BASH_SOURCE[0]}" && -f "${BASH_SOURCE[0]}" ]]; then
    EDITOR_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
elif [[ -n "$THEME_DIR" ]]; then
    EDITOR_DIR="$THEME_DIR/_modules/editor"
else
    # zstheme에서 호출될 때 SCRIPT_DIR 사용
    EDITOR_DIR="${SCRIPT_DIR:-$(pwd)}/themes/_modules/editor"
fi

MODULES_DIR="$(dirname "$EDITOR_DIR")"
THEME_DIR="$(dirname "$MODULES_DIR")"

# 모듈 로드
source "$EDITOR_DIR/ui.sh"
source "$EDITOR_DIR/input.sh"
source "$EDITOR_DIR/save.sh"

# ============================================================
# 상태 변수
# ============================================================

# 현재 선택된 색상 인덱스
SELECTED_INDEX=0

# 색상 카테고리 (0: 전경색, 1: 배경색)
CATEGORY=0

# 전경색 목록 (이름, 변수명, 기본값)
declare -a FG_NAMES=("Branch" "Worktree" "Directory" "Model" "Status" "Sync" "Rate" "Burn" "Time" "Context")
declare -a FG_VARS=("C_BRANCH" "C_TREE" "C_DIR" "C_MODEL" "C_STATUS" "C_SYNC" "C_RATE" "C_BURN" "C_TIME" "C_CTX")
declare -a FG_DEFAULTS=(93 92 96 95 111 141 229 216 75 92)

# 배경색 목록
declare -a BG_NAMES=("BG Branch" "BG Worktree" "BG Dir" "BG Status" "BG Sync" "BG Model" "BG LOC" "BG GIT" "BG SES")
declare -a BG_VARS=("C_BG_BRANCH" "C_BG_TREE" "C_BG_DIR" "C_BG_STATUS" "C_BG_SYNC" "C_BG_MODEL" "C_BG_LOC" "C_BG_GIT" "C_BG_SES")
declare -a BG_DEFAULTS=(58 22 23 24 53 53 23 24 53)

# 현재 색상 값 (편집용)
declare -a FG_VALUES=()
declare -a BG_VALUES=()

# 변경 플래그
MODIFIED=false

# ============================================================
# 색상 값 초기화
# ============================================================

init_color_values() {
    # 기존 커스텀 색상 로드 시도
    local custom_file="$HOME/.config/zstheme/custom-color.sh"

    if [[ -f "$custom_file" ]]; then
        source "$custom_file"
        # 로드된 값 적용
        for i in "${!FG_VARS[@]}"; do
            local var="${FG_VARS[$i]}_CODE"
            FG_VALUES[$i]="${!var:-${FG_DEFAULTS[$i]}}"
        done
        for i in "${!BG_VARS[@]}"; do
            local var="${BG_VARS[$i]}_CODE"
            BG_VALUES[$i]="${!var:-${BG_DEFAULTS[$i]}}"
        done
    else
        # 기본값 사용
        FG_VALUES=("${FG_DEFAULTS[@]}")
        BG_VALUES=("${BG_DEFAULTS[@]}")
    fi
}

# ============================================================
# 메인 루프
# ============================================================

run_color_editor() {
    # 초기화
    init_color_values

    # 터미널 설정
    stty -echo 2>/dev/null || true
    tput civis 2>/dev/null || true

    # 종료 시 복구
    trap 'cleanup_editor' EXIT INT TERM

    # 메인 루프
    while true; do
        # 화면 그리기
        draw_editor_screen

        # 키 입력 대기
        local action=$(read_editor_key)

        case "$action" in
            "up")
                move_selection -1
                ;;
            "down")
                move_selection 1
                ;;
            "left")
                adjust_color -1
                ;;
            "right")
                adjust_color 1
                ;;
            "left10"|"minus")
                adjust_color -10
                ;;
            "right10"|"plus")
                adjust_color 10
                ;;
            "tab")
                toggle_category
                ;;
            "save")
                save_custom_colors
                ;;
            "reset")
                reset_colors
                ;;
            "quit")
                if [[ "$MODIFIED" == true ]]; then
                    if confirm_quit; then
                        break
                    fi
                else
                    break
                fi
                ;;
        esac
    done

    cleanup_editor
}

# ============================================================
# 선택 이동
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

    # 범위 제한
    if [[ $SELECTED_INDEX -lt 0 ]]; then
        SELECTED_INDEX=$((max_index - 1))
    elif [[ $SELECTED_INDEX -ge $max_index ]]; then
        SELECTED_INDEX=0
    fi
}

# ============================================================
# 색상 조정
# ============================================================

adjust_color() {
    local delta=$1
    local current_value
    local new_value

    if [[ $CATEGORY -eq 0 ]]; then
        current_value=${FG_VALUES[$SELECTED_INDEX]}
        new_value=$((current_value + delta))

        # 0-255 범위 제한
        [[ $new_value -lt 0 ]] && new_value=255
        [[ $new_value -gt 255 ]] && new_value=0

        FG_VALUES[$SELECTED_INDEX]=$new_value
    else
        current_value=${BG_VALUES[$SELECTED_INDEX]}
        new_value=$((current_value + delta))

        # 0-255 범위 제한
        [[ $new_value -lt 0 ]] && new_value=255
        [[ $new_value -gt 255 ]] && new_value=0

        BG_VALUES[$SELECTED_INDEX]=$new_value
    fi

    MODIFIED=true
}

# ============================================================
# 카테고리 전환
# ============================================================

toggle_category() {
    CATEGORY=$(( (CATEGORY + 1) % 2 ))
    SELECTED_INDEX=0
}

# ============================================================
# 색상 리셋
# ============================================================

reset_colors() {
    FG_VALUES=("${FG_DEFAULTS[@]}")
    BG_VALUES=("${BG_DEFAULTS[@]}")
    MODIFIED=true
}

# ============================================================
# 종료 확인
# ============================================================

confirm_quit() {
    tput cup $(($(tput lines) - 3)) 0
    echo -e "\033[1;33m  Unsaved changes! Save before quit? (y/n/c)\033[0m"

    while true; do
        read -rsn1 key
        case "$key" in
            y|Y)
                save_custom_colors
                return 0
                ;;
            n|N)
                return 0
                ;;
            c|C)
                return 1
                ;;
        esac
    done
}

# ============================================================
# 정리
# ============================================================

cleanup_editor() {
    stty echo 2>/dev/null || true
    tput cnorm 2>/dev/null || true
    tput clear 2>/dev/null || clear
}
