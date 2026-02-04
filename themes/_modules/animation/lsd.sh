#!/bin/bash
# LSD Animation Module - 글자 단위 빠른 색상 순환
# 각 문자에 다른 색상을 적용하여 그라데이션 효과 (0.1초 단위)

# ============================================================
# 레인보우 팔레트
# ============================================================

# 파스텔 레인보우 (기존 테마 톤앤무드 유지)
# 파스텔 톤 레인보우 (Logo.js 알고리즘 기반 생성됨: RGB 200 ± 55)
RAINBOW_COLORS=("200;250;158" "205;247;154" "210;244;152" "216;241;149" "221;237;147" "226;232;146" "231;228;145" "235;223;145" "239;218;145" "243;213;145" "246;207;147" "249;202;149" "251;196;151" "252;191;154" "254;185;157" "254;180;161" "254;175;165" "254;170;169" "253;166;174" "252;162;179" "250;158;184" "247;154;189" "244;152;195" "241;149;200" "237;147;206" "232;146;211" "228;145;217" "223;145;222" "218;145;227" "213;145;231" "207;147;236" "202;149;240" "196;151;243" "191;154;246" "185;157;249" "180;161;251" "175;165;253" "170;169;254" "166;174;254" "162;179;254" "158;184;254" "154;189;253" "152;195;251" "149;200;249" "147;206;247" "146;211;243" "145;217;240" "145;222;236" "145;227;232" "145;231;227" "147;236;222" "149;240;217" "151;243;212" "154;246;206" "157;249;201" "161;251;195" "165;253;190" "169;254;185" "174;254;179" "179;254;174")

# 모노 레인보우 (회색 순환)
MONO_CYCLE=(255 252 250 248 246 244 242 240 238 236)

# 시간 기반 오프셋 (0.1초 단위 - 빠른 변화)
COLOR_OFFSET=$(($(date +%s%N | cut -c1-10) % 60))

# 배경색 오프셋 (bars용 - 3가지 순환)
BG_OFFSET=$(($(date +%s%N | cut -c1-10) % 3))

# ============================================================
# 글자 단위 색상화 함수 (LSD 핵심 기능)
# ============================================================

# 문자열을 글자 단위로 색상 적용 (UTF-8/이모지 지원)
colorize_text() {
    local text="$1"
    local start_idx="${2:-0}"
    local result=""
    local i=0

    # UTF-8 문자를 하나씩 처리 (grep -o로 문자 분리)
    while IFS= read -r char; do
        local color_idx=$(( (start_idx + i + COLOR_OFFSET) % 60 ))

        if [[ "$COLOR_MODE" == "mono" ]]; then
            local mono_idx=$(( color_idx % 10 ))
            result+="\033[1;38;5;${MONO_CYCLE[$mono_idx]}m${char}"
        else
            result+="\033[1;38;2;${RAINBOW_COLORS[$color_idx]}m${char}"
        fi
        ((i++))
    done < <(echo -n "$text" | grep -oE '.' 2>/dev/null || echo -n "$text" | fold -w1)

    echo -e "${result}\033[0m"
}

# ============================================================
# 색상 순환 함수 (rainbow와 호환 - fallback용)
# ============================================================

get_animated_color() {
    local idx="$1"
    local actual_idx=$(( (idx + COLOR_OFFSET) % 60 ))

    if [[ "$COLOR_MODE" == "mono" ]]; then
        local mono_idx=$(( actual_idx % 10 ))
        echo "\033[1;38;5;${MONO_CYCLE[$mono_idx]}m"
    else
        echo "\033[1;38;2;${RAINBOW_COLORS[$actual_idx]}m"
    fi
}

# 배경색 순환 (bars 레이아웃용)
get_animated_bg() {
    local chip_idx="$1"  # 0=loc, 1=git, 2=ses
    local actual_idx=$(( (chip_idx + BG_OFFSET) % 3 ))

    # 배경색도 순환
    local bgs=("$C_BG_LOC" "$C_BG_GIT" "$C_BG_SES")
    echo "${bgs[$actual_idx]}"
}

# 배경색 순환 (badges 레이아웃용 - 개별 요소)
# 6개 배경색 순환: branch, tree, dir, status, sync, model
get_animated_badge_bg() {
    local element_idx="$1"
    local actual_idx=$(( (element_idx + BG_OFFSET) % 6 ))

    local bgs=("$C_BG_BRANCH" "$C_BG_TREE" "$C_BG_DIR" "$C_BG_STATUS" "$C_BG_SYNC" "$C_BG_MODEL")
    echo "${bgs[$actual_idx]}"
}

# 배터리 색상 순환 (card 레이아웃용)
get_animated_battery_color() {
    if [[ "$COLOR_MODE" == "mono" ]]; then
        local idx=$(( ($(date +%s%N | cut -c1-10) % 8) ))
        echo "\033[48;5;$((236 + idx))m"
    else
        local idx=$(( ($(date +%s%N | cut -c1-10) % 10) ))
        echo "\033[48;5;${RAINBOW_COLORS[$idx]}m"
    fi
}
