#!/bin/bash
# Rainbow Animation Module - 요소 단위 빠른 색상 순환
# 시간 기반 색상 오프셋으로 사이키델릭 효과 (0.1초 단위)

# ============================================================
# 레인보우 팔레트
# ============================================================

# 컬러 레인보우
RAINBOW_COLORS=(196 208 226 46 51 21 93 201 199 213)

# 모노 레인보우 (회색 순환)
MONO_CYCLE=(255 252 250 248 246 244 242 240 238 236)

# 시간 기반 오프셋 (0.1초 단위 - 빠른 변화)
COLOR_OFFSET=$(($(date +%s%N | cut -c1-10) % 10))

# 배경색 오프셋 (chips용 - 3가지 순환)
BG_OFFSET=$(($(date +%s%N | cut -c1-10) % 3))

# ============================================================
# 색상 순환 함수
# ============================================================

get_animated_color() {
    local idx="$1"
    local actual_idx=$(( (idx + COLOR_OFFSET) % 10 ))

    if [[ "$COLOR_MODE" == "mono" ]]; then
        echo "\033[1;38;5;${MONO_CYCLE[$actual_idx]}m"
    else
        echo "\033[1;38;5;${RAINBOW_COLORS[$actual_idx]}m"
    fi
}

# 배경색 순환 (chips 레이아웃용)
get_animated_bg() {
    local chip_idx="$1"  # 0=loc, 1=git, 2=ses
    local actual_idx=$(( (chip_idx + BG_OFFSET) % 3 ))

    # 배경색도 순환
    local bgs=("$C_BG_LOC" "$C_BG_GIT" "$C_BG_SES")
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
