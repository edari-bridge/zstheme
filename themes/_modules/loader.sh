#!/bin/bash
# Dynamic Theme Loader - 테마명 파싱 및 모듈 조합
# 테마명 규칙: [mono-|custom-][lsd-|rainbow-]{layout}[-nerd]

# ============================================================
# 모듈 디렉토리 위치
# ============================================================

# 이 파일의 실제 위치 찾기
_LOADER_SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$_LOADER_SOURCE" ]]; do
    _LOADER_DIR="$(cd -P "$(dirname "$_LOADER_SOURCE")" && pwd)"
    _LOADER_SOURCE="$(readlink "$_LOADER_SOURCE")"
    [[ "$_LOADER_SOURCE" != /* ]] && _LOADER_SOURCE="$_LOADER_DIR/$_LOADER_SOURCE"
done
MODULES_DIR="$(cd -P "$(dirname "$_LOADER_SOURCE")" && pwd)"

# ============================================================
# 테마명 파싱
# ============================================================

parse_theme_name() {
    local theme_name="$1"

    # 기본값
    COLOR_MODE="pastel"
    ANIMATION_MODE="static"
    LAYOUT_MODE="2line"
    ICON_MODE="emoji"

    # 1. 색상 모드 확인 (pastel/mono/custom 중 택일)
    if [[ "$theme_name" == custom-* ]]; then
        COLOR_MODE="custom"
        theme_name="${theme_name#custom-}"
    elif [[ "$theme_name" == mono-* ]]; then
        COLOR_MODE="mono"
        theme_name="${theme_name#mono-}"
    fi

    # 3. lsd- 또는 rainbow- 접두사 확인
    if [[ "$theme_name" == lsd-* ]]; then
        ANIMATION_MODE="lsd"
        theme_name="${theme_name#lsd-}"
    elif [[ "$theme_name" == rainbow-* ]]; then
        ANIMATION_MODE="rainbow"
        theme_name="${theme_name#rainbow-}"
    fi

    # 4. -nerd 접미사 확인
    if [[ "$theme_name" == *-nerd ]]; then
        ICON_MODE="nerd"
        theme_name="${theme_name%-nerd}"
    fi

    # 5. 레이아웃 결정
    case "$theme_name" in
        1-line|1line)
            LAYOUT_MODE="1line"
            ;;
        2-line|2line|"")
            LAYOUT_MODE="2line"
            ;;
        card)
            LAYOUT_MODE="card"
            ;;
        bars)
            LAYOUT_MODE="bars"
            ;;
        badges)
            LAYOUT_MODE="badges"
            ;;
        *)
            # 알 수 없는 레이아웃 → 2line 기본
            LAYOUT_MODE="2line"
            ;;
    esac
}

# ============================================================
# 모듈 로드
# ============================================================

load_modules() {
    # 1. 아이콘 로드 (먼저, 다른 모듈에서 사용)
    source "$MODULES_DIR/icons/${ICON_MODE}.sh"

    # 2. 색상 모듈 로드
    if [[ "$COLOR_MODE" == "custom" ]]; then
        # 커스텀 색상: 사용자 설정 파일 또는 기본 pastel.sh
        local custom_file="$HOME/.config/zstheme/custom-color.sh"
        if [[ -f "$custom_file" ]]; then
            source "$custom_file"
        else
            # 커스텀 파일 없으면 기본 색상 사용
            source "$MODULES_DIR/colors/pastel.sh"
        fi
    else
        source "$MODULES_DIR/colors/${COLOR_MODE}.sh"
    fi

    # 3. 애니메이션 모듈 로드
    source "$MODULES_DIR/animation/${ANIMATION_MODE}.sh"

    # 4. 레이아웃 모듈 로드 (render 함수 포함)
    source "$MODULES_DIR/layouts/${LAYOUT_MODE}.sh"
}

# ============================================================
# 메인 로드 함수
# ============================================================

load_theme() {
    local theme_name="${1:-2-line}"

    # 테마명 파싱
    parse_theme_name "$theme_name"

    # 모듈 로드
    load_modules

    # 디버그 정보 (필요시)
    # echo "DEBUG: color=$COLOR_MODE anim=$ANIMATION_MODE layout=$LAYOUT_MODE icon=$ICON_MODE" >&2
}

# ============================================================
# 유효한 테마 목록 생성
# ============================================================

list_all_themes() {
    local layouts=("1line" "2line" "card" "bars" "badges")
    local colors=("" "mono-")
    local anims=("" "lsd-" "rainbow-")
    local icons=("" "-nerd")

    for color in "${colors[@]}"; do
        for anim in "${anims[@]}"; do
            for layout in "${layouts[@]}"; do
                for icon in "${icons[@]}"; do
                    echo "${color}${anim}${layout}${icon}"
                done
            done
        done
    done
}

# 테마 유효성 검사
is_valid_theme() {
    local theme="$1"
    local all_themes=$(list_all_themes)

    for t in $all_themes; do
        [[ "$t" == "$theme" ]] && return 0
    done
    return 1
}
