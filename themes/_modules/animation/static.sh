#!/bin/bash
# Static Animation Module - 정적 색상
# 색상 순환 없이 고정된 색상 사용

# ============================================================
# 정적 색상 (순환 없음)
# ============================================================

# 색상 오프셋 (0 = 순환 없음)
COLOR_OFFSET=0

# 색상 가져오기 함수 (그대로 반환)
get_animated_color() {
    local idx="$1"
    # 정적 모드: 인덱스 그대로 사용
    if [[ "$COLOR_MODE" == "mono" ]]; then
        # 모노 팔레트
        local mono_colors=(255 252 250 248 246 244 242 240 238 236)
        echo "\033[38;5;${mono_colors[$((idx % 10))]}m"
    else
        # 기본 컬러 (위치 기반)
        case $((idx % 10)) in
            0) echo "\033[93m" ;;   # 노랑 (브랜치)
            1) echo "\033[92m" ;;   # 녹색 (워크트리)
            2) echo "\033[96m" ;;   # 시안 (디렉토리)
            3) echo "\033[38;5;153m" ;;  # 연한 파랑 (Git+)
            4) echo "\033[38;5;153m" ;;  # 연한 파랑 (Git~)
            5) echo "\033[38;5;153m" ;;  # 연한 파랑 (Git-)
            6) echo "\033[38;5;183m" ;;  # 연한 보라 (ahead)
            7) echo "\033[38;5;183m" ;;  # 연한 보라 (behind)
            8) echo "\033[95m" ;;   # 마젠타 (컨텍스트)
            9) echo "\033[95m" ;;   # 마젠타 (모델)
        esac
    fi
}

# 배경색 오프셋 (bars 레이아웃용)
BG_OFFSET=0

# 배경색 순환 함수 (정적 = 변화 없음)
get_animated_bg() {
    local chip_idx="$1"  # 0=loc, 1=git, 2=ses
    case $chip_idx in
        0) echo "$C_BG_LOC" ;;
        1) echo "$C_BG_GIT" ;;
        2) echo "$C_BG_SES" ;;
    esac
}
