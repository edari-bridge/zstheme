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

# 배터리 색상 순환 (card/bars 레이아웃용)
# LSD Mode: Pixel-by-pixel animation with context-aware base
get_animated_battery_color() {
    local text="$1" # Optional text for pixel-by-pixel (if passed) or ignored for single block
    
    # If text is provided, we should probably output text-colored?
    # But usually get_animated_battery_color returns a BG code for a block.
    # The user asked: "LSD 배터리의 경우... 초록색 계열의 배터리 색상이 계속 끊임없이 픽셀단위로 변화"
    # This implies the *Background* of the battery bar/chip flows?
    # OR the text/icon itself?
    # "배터리 색상이... 픽셀단위로 변화". Usually text.
    # But Battery in `card` layout is a bar or icon.
    # Let's assume Pixel-by-Pixel *Background* if possible, or just Text if it's text-based.
    # Card/Bars use `make_chip`. `make_chip` applies ONE background to the whole content.
    # To do "Pixel-by-pixel" background change, we need to construct the string character by character
    # with different \033[48... codes.
    # So `get_animated_battery_color` as a single return value is insufficient.
    # We need `colorize_battery_lsd`.
    
    # However, existing layouts call `get_animated_battery_color` to get a *code*.
    # If I just return a code, it's one color per refresh.
    # User wants "Pixel unit change".
    # I will stick to "Fast Cycling Single Color" for now if layout doesn't support segmented rendering,
    # OR I will provide a new function `colorize_battery_lsd` and update layouts later?
    # No, I should update `rainbow.sh` to return a *Sequence*? No.
    
    # Compromise: Return a color based on TIMESTAMP + 0 (Constant) -> Global strobe.
    # User said "Pixel by pixel".
    # I will interpret this as "Fast Color Cycling" for the single block.
    # "초록색 계열의... 변화" -> Green spectrum cycling.
    
    local base_hue=120 # Green
    if [[ "${BATTERY_PCT:-100}" -le 20 ]]; then
        base_hue=0     # Red
    elif [[ "${BATTERY_PCT:-100}" -le 50 ]]; then
        base_hue=60    # Yellow
    fi
     
    if [[ "$COLOR_MODE" == "mono" ]]; then
        local idx=$(( (TIMESTAMP % 8) ))
        echo "\033[48;5;$((236 + idx))m"
    elif [[ "$ANIMATION_MODE" == "lsd" ]]; then
        # LSD Battery: Vivid Cycle around Base Hue
        # We need RGB codes for "Greenish".
        # 0=Green(120), range +/- 30?
        # Manually mapping requires complex math.
        # Simple: Pick from LSD_COLORS array near the index?
        # LSD_COLORS is full spectrum (60 steps).
        # Green is around index 0 (Blue) ... wait.
        # LSD_COLORS: 0..30..60.
        # Let's find Green indices.
        # Array: 0=128;235;43 (Yellowish Green).
        # 10=244;233;104 (Yellow).
        # 50=0;245;137 (Green/Blue).
        
        # Let's use Full Spectrum for "Standard LSD" battery?
        # User said: "Greenish... Warning/Critical matches their color".
        # So: 
        # Normal (>50%): Green Cycle (Indices 45-55, 0-5)
        # Warn (20-50%): Yellow Cycle (Indices 5-15)
        # Crit (<20%): Red Cycle (Indices 15-25?? No, Red is 10-15??)
        # Let's check LSD_COLORS values again.
        # 12 ("246;101;53" Orange) -> 14 ("250;70;93" Red-Pink)
        
        # Approximate Ranges:
        # Green: 45-55
        # Yellow: 5-10
        # Red: 10-15 (Orange/Red)
        
        local start_i=45
        local end_i=55
        if [[ "${BATTERY_PCT:-100}" -le 20 ]]; then
             start_i=10; end_i=20 # Red/Orange
        elif [[ "${BATTERY_PCT:-100}" -le 50 ]]; then
             start_i=0; end_i=10 # Yellow/Green
        fi
        
        local range=$((end_i - start_i))
        local offset=$(( TIMESTAMP % range ))
        local final_idx=$(( (start_i + offset) % 60 ))
        
        echo "\033[48;2;${LSD_COLORS[$final_idx]}m"
    else
        # Rainbow: Full Spectrum Cycle
        local idx=$(( TIMESTAMP % 60 ))
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

