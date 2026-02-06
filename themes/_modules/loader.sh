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
source "$MODULES_DIR/theme_contract.sh"

# ============================================================
# 테마명 파싱
# ============================================================

parse_theme_name() {
    parse_theme_name_contract "$1"
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
    case "$ANIMATION_MODE" in
        lsd|rainbow)
            source "$MODULES_DIR/animation/rainbow.sh"
            ;;
        *)
            if [[ -f "$MODULES_DIR/animation/${ANIMATION_MODE}.sh" ]]; then
                source "$MODULES_DIR/animation/${ANIMATION_MODE}.sh"
            fi
            ;;
    esac

    # 4. 공통 헬퍼 로드 (레이아웃에서 사용)
    source "$MODULES_DIR/helpers.sh"

    # 5. 레이아웃 모듈 로드 (render 함수 포함)
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
    local animations=("${THEME_ANIMATION_PUBLIC_PREFIXES[@]}" "${THEME_ANIMATION_HIDDEN_PREFIXES[@]}")

    for color in "${THEME_COLOR_PREFIXES[@]}"; do
        for anim in "${animations[@]}"; do
            # custom 색상은 static 조합만 허용
            if [[ "$color" == "custom-" && -n "$anim" ]]; then
                continue
            fi

            for layout in "${THEME_LAYOUTS[@]}"; do
                for icon in "${THEME_ICON_SUFFIXES[@]}"; do
                    echo "${color}${anim}${layout}${icon}"
                done
            done
        done
    done
}

# 테마 유효성 검사
is_valid_theme() {
    is_valid_theme_name "$1"
}
