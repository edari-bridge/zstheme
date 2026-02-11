#!/bin/bash
# Rainbow Animation Module - 요소 단위 빠른 색상 순환
# 시간 기반 색상 오프셋으로 사이키델릭 효과 (0.1초 단위)

# ============================================================
# 레인보우 팔레트
# ============================================================

# 컬러 레인보우
# 컬러 레인보우 (Pastel Sine Wave: Base 200, Amplitude 55 - Matches zstheme Logo)
RAINBOW_COLORS=("200;250;158" "205;253;150" "210;254;142" "216;254;135" "221;253;128" "226;251;122" "231;248;116" "236;244;111" "240;239;107" "244;233;104" "248;226;101" "250;219;100" "253;211;100" "254;203;100" "254;194;102" "255;185;105" "254;177;109" "253;168;113" "251;159;119" "248;152;125" "245;144;133" "241;137;141" "237;131;149" "232;126;158" "227;122;167" "221;119;177" "215;117;187" "209;116;196" "203;116;205" "196;118;214" "189;121;222" "183;125;229" "176;130;236" "170;136;242" "164;143;247" "159;151;251" "154;159;253" "150;168;254" "147;177;254" "145;187;252" "145;196;250" "145;206;246" "147;215;241" "150;223;235" "155;231;228" "160;239;220" "167;245;211" "174;250;202" "182;253;193" "190;255;184" "199;255;176" "208;254;168" "217;252;161" "225;249;155" "233;244;150" "240;239;147" "246;233;145" "251;225;144" "254;217;145" "255;209;148")

# LSD 팔레트 (Vivid Neon: High Saturation, High Contrast)
LSD_COLORS=("128;235;43" "140;229;30" "153;221;19" "165;213;10" "177;203;4" "189;192;1" "199;181;1" "209;168;3" "219;155;8" "227;142;15" "235;128;25" "241;115;37" "246;101;53" "249;86;72" "250;70;93" "249;54;115" "245;38;137" "239;21;158" "231;4;178" "221;0;196" "209;0;213" "195;0;227" "180;0;239" "163;0;248" "145;0;254" "126;0;255" "107;0;255" "87;0;255" "66;0;255" "45;0;255" "23;0;255" "0;0;255" "0;23;255" "0;45;255" "0;66;255" "0;87;255" "0;107;255" "0;126;255" "0;145;254" "0;163;248" "0;180;239" "0;195;227" "0;209;213" "0;221;196" "0;231;178" "0;239;158" "0;245;137" "0;249;115" "0;250;93" "0;249;72" "0;246;53" "0;241;37" "0;235;25" "0;227;15" "0;219;8" "0;209;3" "5;199;1" "23;189;1" "48;177;4" "72;165;10")

# 모노 레인보우 (회색 순환)
# 모노 레인보우 (Smooth Grayscale: Base 192, Amplitude 63)
MONO_CYCLE=("192;192;192" "198;198;198" "204;204;204" "210;210;210" "216;216;216" "222;222;222" "227;227;227" "232;232;232" "237;237;237" "241;241;241" "245;245;245" "248;248;248" "250;250;250" "252;252;252" "254;254;254" "254;254;254" "254;254;254" "254;254;254" "253;253;253" "251;251;251" "249;249;249" "246;246;246" "242;242;242" "238;238;238" "234;234;234" "229;229;229" "224;224;224" "218;218;218" "213;213;213" "207;207;207" "200;200;200" "194;194;194" "188;188;188" "182;182;182" "175;175;175" "169;169;169" "164;164;164" "158;158;158" "153;153;153" "148;148;148" "144;144;144" "140;140;140" "137;137;137" "134;134;134" "132;132;132" "130;130;130" "129;129;129" "129;129;129" "129;129;129" "130;130;130" "131;131;131" "133;133;133" "136;136;136" "139;139;139" "143;143;143" "147;147;147" "152;152;152" "157;157;157" "162;162;162" "168;168;168")

# Chaotic Offset (Visual Speed & Pattern)
# Use Perl/Python/Date safely.
get_timestamp_decis() {
    # Bash 5+ EPOCHREALTIME (no fork needed)
    if [[ -n "${EPOCHREALTIME+x}" ]]; then
        local rt="${EPOCHREALTIME}"
        # EPOCHREALTIME is like "1234567890.123456" - multiply by 10 for deciseconds
        local secs="${rt%%.*}"
        local frac="${rt#*.}"
        echo "${secs}${frac:0:1}"
        return
    fi

    # Try Perl (High Precision, Standard on macOS/Linux)
    if command -v perl >/dev/null 2>&1; then
        perl -MTime::HiRes -e 'printf "%.0f\n", Time::HiRes::time()*10' 2>/dev/null && return
    fi

    # Try Python3
    if command -v python3 >/dev/null 2>&1; then
        python3 -c 'import time; print(int(time.time()*10))' 2>/dev/null && return
    fi

    # Fallback to date
    # Check if date supports %N (GNU date)
    if [[ "$(date +%N 2>/dev/null)" =~ ^[0-9]+$ ]]; then
         date +%s%1N
    else
         # BSD date (macOS) - Seconds only * 10
         echo $(($(date +%s) * 10))
    fi
}
# Ensure valid integer return or default to 0 to prevent crash
TIMESTAMP=$(get_timestamp_decis)
[[ -z "$TIMESTAMP" ]] && TIMESTAMP=0

if [[ "$ANIMATION_MODE" == "lsd" ]]; then
    # LSD: Hyper Fast & Random (Chaotic)
    # Multiplier 41 (Prime) causes coloring to jump wildly across the spectrum
    COLOR_OFFSET=$(( TIMESTAMP * 41 % 60 ))
    BG_OFFSET=$(( TIMESTAMP * 37 % 60 ))
else
    # Rainbow: Fast Wave (Time-based)
    # Multiplier 5 for faster color cycling
    COLOR_OFFSET=$(( (TIMESTAMP * 5) % 60 ))
    # Background offset slightly shifted
    BG_OFFSET=$(( (COLOR_OFFSET + 30) % 60 ))
fi

# ============================================================
# 색상 순환 함수
# ============================================================

# 문자열을 글자 단위로 색상 적용 (UTF-8/이모지 지원)
colorize_text() {
    local text="$1"
    local start_idx="${2:-0}"
    local result=""
    local i=0

    # UTF-8 문자를 하나씩 처리 (bash 내장 인덱싱)
    local len=${#text}
    for ((i=0; i<len; i++)); do
        local char="${text:$i:1}"
        # Stride 7 for higher spatial frequency (more color changes per char)
        local color_idx=$(( (start_idx + (i * 7) + COLOR_OFFSET) % 60 ))

        if [[ "$COLOR_MODE" == "mono" ]]; then
            result+="\033[1;38;2;${MONO_CYCLE[$color_idx]}m${char}"
        elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
             # LSD Mode: Vivid Neon Palette
             result+="\033[1;38;2;${LSD_COLORS[$color_idx]}m${char}"
        else
             # Rainbow Mode: Pastel Palette
             result+="\033[1;38;2;${RAINBOW_COLORS[$color_idx]}m${char}"
        fi
    done

    echo -e "${result}\033[22;39m"
}

# Dark Rainbow: 어두운 톤 빠른 글자 색상 순환 (p.lsd/lsd 공용)
# 단색 배경 위에서 사용 (bg는 호출 측에서 설정)
colorize_text_dark() {
    local text="$1"
    local start_idx="${2:-0}"
    local result=""
    local len=${#text}

    for ((i=0; i<len; i++)); do
        local char="${text:$i:1}"

        # Stride 11 (빠른 순환)
        local color_idx=$(( (start_idx + (i * 11) + COLOR_OFFSET) % 60 ))

        local rgb
        if [[ "$COLOR_MODE" == "mono" ]]; then
            rgb="${MONO_CYCLE[$color_idx]}"
        elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
            rgb="${LSD_COLORS[$color_idx]}"
        else
            rgb="${RAINBOW_COLORS[$color_idx]}"
        fi
        IFS=';' read -r r g b <<< "$rgb"
        r=$(( r * 2 / 5 )); g=$(( g * 2 / 5 )); b=$(( b * 2 / 5 ))
        result+="\033[38;2;${r};${g};${b}m${char}"
    done

    echo -e "${result}\033[22;39m"
}

get_animated_color() {
    local idx="$1"
    local actual_idx=$(( (idx + COLOR_OFFSET) % 60 ))

    if [[ "$COLOR_MODE" == "mono" ]]; then
        echo "\033[1;38;2;${MONO_CYCLE[$actual_idx]}m"
    elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
        echo "\033[1;38;2;${LSD_COLORS[$actual_idx]}m"
    else
        echo "\033[1;38;2;${RAINBOW_COLORS[$actual_idx]}m"
    fi
}

# 배경색 순환 (bars 레이아웃용 - Full Spectrum Flash)
get_animated_bg() {
    local chip_idx="$1"
    # Stride of 10 to make chips distinct
    local actual_idx=$(( (chip_idx * 10 + BG_OFFSET) % 60 ))

    if [[ "$COLOR_MODE" == "mono" ]]; then
        echo "\033[48;2;${MONO_CYCLE[$actual_idx]}m"
    elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
         echo "\033[48;2;${LSD_COLORS[$actual_idx]}m"
    else
         echo "\033[48;2;${RAINBOW_COLORS[$actual_idx]}m"
    fi
}

# 배터리 색상 순환 (card/bars 레이아웃용)
# Flash 효과 (2% 확률 white flicker) + LSD 고대비 빠른 사이클
get_animated_battery_color() {
    # Flash: 2% 확률 white (Logo.js 패턴)
    if (( RANDOM % 50 < 1 )); then
        echo "\033[48;2;255;255;255m"
        return
    fi

    if [[ "$COLOR_MODE" == "mono" ]]; then
        local idx=$(( (TIMESTAMP % 8) ))
        echo "\033[48;5;$((236 + idx))m"
    elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
        # LSD Battery: 빠른 사이클(3x) + RANDOM 섭동
        # Thresholds match static mode (CONTEXT_PCT: >=70 red, >=50 yellow, else green)
        # Normal(<50%): Green  indices 40-59 (range 20)
        # Warn(50-70%): Yellow indices 0-15  (range 16)
        # Crit(>=70%):  Red    indices 5-25  (range 21)
        local start_i=40
        local range=20
        if [[ "${CONTEXT_PCT:-0}" -ge 70 ]]; then
             start_i=5; range=21
        elif [[ "${CONTEXT_PCT:-0}" -ge 50 ]]; then
             start_i=0; range=16
        fi

        local offset=$(( (TIMESTAMP * 3 + RANDOM % 10) % range ))
        local final_idx=$(( (start_i + offset) % 60 ))

        echo "\033[48;2;${LSD_COLORS[$final_idx]}m"
    else
        # Rainbow: Context-Aware Pastel Cycle
        # Thresholds match static mode (CONTEXT_PCT: >=70 red, >=50 yellow, else green)
        # Normal(<50%): Green/Cyan    indices 44-56 (range 13)
        # Warn(50-70%): Yellow/Orange indices 7-16  (range 10)
        # Crit(>=70%):  Salmon/Rose   indices 18-27 (range 10)
        local start_i=44
        local range=13
        if [[ "${CONTEXT_PCT:-0}" -ge 70 ]]; then
             start_i=18; range=10
        elif [[ "${CONTEXT_PCT:-0}" -ge 50 ]]; then
             start_i=7; range=10
        fi

        local offset=$(( TIMESTAMP % range ))
        local final_idx=$(( (start_i + offset) % 60 ))

        echo "\033[48;2;${RAINBOW_COLORS[$final_idx]}m"
    fi
}

# 배경색 순환 (badges 레이아웃용 - Full Spectrum Flash)
get_animated_badge_bg() {
    local element_idx="$1"
    # Stride of 5
    local actual_idx=$(( (element_idx * 5 + BG_OFFSET) % 60 ))

    if [[ "$COLOR_MODE" == "mono" ]]; then
        echo "\033[48;2;${MONO_CYCLE[$actual_idx]}m"
    elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
        echo "\033[48;2;${LSD_COLORS[$actual_idx]}m"
    else
        echo "\033[48;2;${RAINBOW_COLORS[$actual_idx]}m"
    fi
}

# ============================================================
# LSD Effect: Full Spectrum Spatial Gradient (무지개 배경 흐름)
# ============================================================
colorize_bg_lsd() {
    local text="$1"
    local start_idx="${2:-0}"
    local fg_color="${3:-\033[30m}"
    local result=""
    local i=0

    # 각 요소마다 다른 stride로 패턴 차별화 (5-11 사이 변동)
    local stride=$(( 5 + (start_idx % 7) ))
    # 방향도 다르게 (홀수 start_idx는 역방향)
    local direction=1
    [[ $((start_idx % 20)) -ge 10 ]] && direction=-1

    local len=${#text}
    for ((i=0; i<len; i++)); do
        local char="${text:$i:1}"
        local color_idx=$(( (start_idx + (i * stride * direction) + COLOR_OFFSET) % 60 ))
        # 음수 보정
        [[ $color_idx -lt 0 ]] && color_idx=$((60 + color_idx))

        # mono 모드면 회색톤, 아니면 파스텔톤
        local bg_code
        if [[ "$COLOR_MODE" == "mono" ]]; then
            bg_code="\033[48;2;${MONO_CYCLE[$color_idx]}m"
        else
            bg_code="\033[48;2;${RAINBOW_COLORS[$color_idx]}m"
        fi

        result+="${bg_code}${fg_color}${char}"
    done

    echo -e "${result}\033[0m"
}

# ============================================================
# Rainbow Effect: Shimmering (기존 색상 유지 + 명도 물결)
# ============================================================
colorize_bg_rainbow() {
    local text="$1"
    local base_bg="$2"      # The standard background color code
    local highlight_bg="$3" # A lighter version of the background
    local start_idx="${4:-0}"
    local fg_color="${5:-\033[30m}"
    
    local result=""
    local i=0

    local len=${#text}
    for ((i=0; i<len; i++)); do
        local char="${text:$i:1}"
        # Slower, smoother wave for shimmer
        local wave=$(( (start_idx + i + (COLOR_OFFSET / 2)) % 20 ))

        local bg_code="$base_bg"
        # Simple shimmer band (width 5)
        if [[ $wave -lt 5 ]]; then
            bg_code="$highlight_bg"
        fi

        result+="${bg_code}${fg_color}${char}"
    done

    echo -e "${result}\033[0m"
}
