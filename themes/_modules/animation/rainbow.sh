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
# Use Perl for cross-platform sub-second precision (macOS date doesn't support %N)
get_timestamp_decis() {
    if command -v perl >/dev/null 2>&1; then
        perl -MTime::HiRes -e 'printf "%.0f\n", Time::HiRes::time()*10'
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Fallback for macOS if Perl missing (unlikely): standard date (seconds only)
        # Multiply by 10 to match scale
        echo $(($(date +%s) * 10))
    else
        # Linux fallback
        date +%s%1N
    fi
}
TIMESTAMP=$(get_timestamp_decis)

if [[ "$ANIMATION_MODE" == "lsd" ]]; then
    # LSD: Hyper Fast & Random (Chaotic)
    # Multiplier 41 (Prime) causes coloring to jump wildly across the spectrum
    COLOR_OFFSET=$(( TIMESTAMP * 41 % 60 ))
    BG_OFFSET=$(( TIMESTAMP * 37 % 60 ))
else
    # Rainbow/Others: Smooth Wave (Time-based)
    # 0.1s resolution (10Hz) for smooth animation
    COLOR_OFFSET=$(( TIMESTAMP % 60 ))
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

    # UTF-8 문자를 하나씩 처리 (grep -o로 문자 분리)
    while IFS= read -r char; do
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
        ((i++))
    done < <(echo -n "$text" | grep -oE '.' 2>/dev/null || echo -n "$text" | fold -w1)

    echo -e "${result}\033[0m"
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

# 배터리 색상 순환 (card 레이아웃용)
get_animated_battery_color() {
    if [[ "$COLOR_MODE" == "mono" ]]; then
        local idx=$(( ($(date +%s%N | cut -c1-10) % 8) ))
        echo "\033[48;5;$((236 + idx))m"
    elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
        local idx=$(( ($(date +%s%N | cut -c1-10) % 60) ))
        echo "\033[48;2;${LSD_COLORS[$idx]}m"
    else
        local idx=$(( ($(date +%s%N | cut -c1-10) % 60) ))
        echo "\033[48;2;${RAINBOW_COLORS[$idx]}m"
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

    while IFS= read -r char; do
        # Stride 7 for detail
        local color_idx=$(( (start_idx + (i * 7) + COLOR_OFFSET) % 60 ))
        
        # Always use Full Vivid Rainbow/LSD palette for LSD mode
        local bg_code="\033[48;2;${RAINBOW_COLORS[$color_idx]}m"
        
        result+="${bg_code}${fg_color}${char}"
        ((i++))
    done < <(echo -n "$text" | grep -oE '.' 2>/dev/null || echo -n "$text" | fold -w1)

    echo -e "${result}\033[0m"
}

# ============================================================
# Rainbow Effect: Shimmering (기존 색상 유지 + 명도 물결)
# ============================================================
# Usage: colorize_bg_rainbow "text" "base_bg_color_code" offset
# base_bg_code example: "\033[48;2;0;0;255m" or "\033[44m"
# NOTE: For simplicity in shell, we might just overlay a white/black wave
# or use a pre-defined lighter variant if possible.
#
# BUT, since we have RGB values for badges in variables like C_BG_DIR,
# extracting RGB dynamically in bash is hard.
#
# ALTERNATIVE: Use the same Rainbow Palette but strictly limited to a range?
# NO, user said "Keep original badge color".
#
# To achieve "Shimmer" on *any* base color in pure Bash without complex parsing:
# We can't easily modify the brightness of an arbitrary ANSI escape code.
#
# COMPROMISE Plan:
# Rainbow mode in Bars/Badges will NOT use the random rainbow palette.
# It will use the *Specific* badge color (e.g. Blue for Dir) but we need it to shimmer.
# distinct colors are defined in `themes/_modules/colors/*.sh`.
#
# Since I cannot parse arbitrary RGB codes easily here to lighten them,
# I will implement a "Pulse" effect using the standard 60-step rainbow BUT
# tailored to specific hues? No that's too complex.
#
# Let's try "White/Black Overlay" using opacity? No transparency in terminal.
#
# NEW APPROACH for Rainbow Shimmer:
# Use the *LSD Gradient* logic but with a "Monochrome" or "Single Hue" palette
# generated on the fly?
#
# Actually, the user wants "Previous Badge Colors" (e.g. Blue for Dir).
# I will define `SHIMMER_BLUE`, `SHIMMER_GREEN` arrays? Too many.
#
# Let's look at `colorize_bg_rainbow` again.
# If I can't easily shimmer the *configured* color, I will stick to the user's "Rainbow" request roughly:
# "LSD Logic (Gradient) but on specific colors".
#
# Let's define a "Shimmer Map" for the standard badge types:
# Branch (Purple), Tree (Green), Dir (Blue), etc.
# And create small gradient arrays for them.
#
# FOR NOW: I will implement `colorize_bg_rainbow` to use a "Pastel White/Grey" shimmer
# or simply map the known badge types to specific hue ranges of the rainbow.
#
# Let's use a "Soft Rainbow" (Pastel) for the Rainbow Mode as recently implemented,
# BUT apply it *gently*?
#
# User said: "Rainbow: Shimmer / LSD: Full Spectrum".
# "Rainbow Background: Keep original badge color, but shimmer (Lightness change)".
#
# IMPLEMENTATION:
# I will accept a `hue_hint` argument (e.g., 'blue', 'green').
# And generate a shimmer based on that.
# Since we don't have dynamic generation, I'll rely on `colorize_bg_lsd` for LSD
# and for Rainbow, I will temporarily use a "Pulse" logic that toggles between
# the Base Color and a Lighter version based on offset.
#
# To do this efficiently, I'll assume the inputs are pre-defined RGB codes.
# I'll just alternate between the provided BG code and a "Highlight" code.
#
colorize_bg_rainbow() {
    local text="$1"
    local base_bg="$2"      # The standard background color code
    local highlight_bg="$3" # A lighter version of the background
    local start_idx="${4:-0}"
    local fg_color="${5:-\033[30m}"
    
    local result=""
    local i=0

    while IFS= read -r char; do
        # Slower, smoother wave for shimmer
        local wave=$(( (start_idx + i + (COLOR_OFFSET / 2)) % 20 ))
        
        local bg_code="$base_bg"
        # Simple shimmer band (width 5)
        if [[ $wave -lt 5 ]]; then
            bg_code="$highlight_bg"
        fi
        
        result+="${bg_code}${fg_color}${char}"
        ((i++))
    done < <(echo -n "$text" | grep -oE '.' 2>/dev/null || echo -n "$text" | fold -w1)

    echo -e "${result}\033[0m"
}

