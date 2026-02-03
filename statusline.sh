#!/bin/bash
# Claude Code Statusline Engine
# 데이터 수집 후 테마에 전달하여 렌더링

set -o pipefail

# ============================================================
# 1. JSON 입력 읽기
# ============================================================
INPUT=$(cat)
echo "$INPUT" > /tmp/claude_status_debug.json  # DEBUG

# ============================================================
# 2. Claude Code JSON 파싱
# ============================================================
MODEL=$(echo "$INPUT" | jq -r ".model.display_name // \"Unknown\"")
DIR=$(echo "$INPUT" | jq -r ".workspace.current_dir // \"\"")
DIR_NAME="${DIR##*/}"
CONTEXT_PCT=$(echo "$INPUT" | jq -r ".context_window.used_percentage // 0" | xargs printf "%.0f")

# 세션 정보 (cost 객체에서)
SESSION_DURATION_MS=$(echo "$INPUT" | jq -r ".cost.total_duration_ms // 0")
SESSION_DURATION_MIN=$((SESSION_DURATION_MS / 60000))
LINES_ADDED=$(echo "$INPUT" | jq -r ".cost.total_lines_added // 0")
LINES_REMOVED=$(echo "$INPUT" | jq -r ".cost.total_lines_removed // 0")

# ============================================================
# 3. Git 정보 수집
# ============================================================
BRANCH=""
WORKTREE=""
GIT_ADDED=0
GIT_MODIFIED=0
GIT_DELETED=0
GIT_AHEAD=0
GIT_BEHIND=0
IS_GIT_REPO=false

if git rev-parse --git-dir > /dev/null 2>&1; then
    IS_GIT_REPO=true

    # 브랜치
    BRANCH=$(git branch --show-current 2>/dev/null || echo "")

    # 워크트리
    WT_PATH=$(git rev-parse --show-toplevel 2>/dev/null)
    WORKTREE="${WT_PATH##*/}"

    # Git 상태 (숫자만 추출, 빈 값은 0으로)
    GIT_ADDED=$(git status --porcelain 2>/dev/null | grep -c "^??\|^A" | tr -d '[:space:]')
    GIT_ADDED=${GIT_ADDED:-0}
    GIT_MODIFIED=$(git status --porcelain 2>/dev/null | grep -c "^ M\|^M" | tr -d '[:space:]')
    GIT_MODIFIED=${GIT_MODIFIED:-0}
    GIT_DELETED=$(git status --porcelain 2>/dev/null | grep -c "^ D\|^D" | tr -d '[:space:]')
    GIT_DELETED=${GIT_DELETED:-0}

    # Push/Pull 상태 (숫자만 추출, 빈 값은 0으로)
    GIT_AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null | tr -d '[:space:]')
    GIT_AHEAD=${GIT_AHEAD:-0}
    GIT_BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null | tr -d '[:space:]')
    GIT_BEHIND=${GIT_BEHIND:-0}
fi

# ============================================================
# 4. ccusage Rate Limit 정보 수집
# ============================================================
RATE_LIMIT_PCT=""
RATE_RESET_TIME=""
RATE_TIME_LEFT=""
BURN_RATE=""

# ccusage 캐시 파일 (5분 TTL)
CACHE_FILE="/tmp/ccusage_cache.json"
CACHE_TTL=300  # 5분

get_ccusage_data() {
    local now=$(date +%s)
    local cache_valid=false

    # 캐시 확인
    if [[ -f "$CACHE_FILE" ]]; then
        local cache_time=$(stat -f %m "$CACHE_FILE" 2>/dev/null || echo "0")
        local age=$((now - cache_time))
        if [[ $age -lt $CACHE_TTL ]]; then
            cache_valid=true
        fi
    fi

    if [[ "$cache_valid" == "true" ]]; then
        cat "$CACHE_FILE"
    else
        # 새로 가져오기
        if command -v npx >/dev/null 2>&1; then
            # macOS 호환: timeout 대신 백그라운드 + 직접 실행
            local data=$(npx ccusage@latest blocks --json 2>/dev/null || echo "{}")
            echo "$data" > "$CACHE_FILE"
            echo "$data"
        else
            echo "{}"
        fi
    fi
}

CCUSAGE_DATA=$(get_ccusage_data)

if [[ -n "$CCUSAGE_DATA" && "$CCUSAGE_DATA" != "{}" ]]; then
    # 활성 블록 가져오기
    ACTIVE_BLOCK=$(echo "$CCUSAGE_DATA" | jq -r '.blocks[] | select(.isActive == true)' 2>/dev/null)

    if [[ -n "$ACTIVE_BLOCK" ]]; then
        # reset 시간 (HH:MM 형식, UTC → 로컬 변환)
        RESET_ISO=$(echo "$ACTIVE_BLOCK" | jq -r '.endTime // empty' 2>/dev/null)
        if [[ -n "$RESET_ISO" ]]; then
            # UTC ISO → Unix timestamp → 로컬 시간
            RESET_TS=$(TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%S" "${RESET_ISO%.*}" "+%s" 2>/dev/null)
            RATE_RESET_TIME=$(date -j -r "$RESET_TS" "+%H:%M" 2>/dev/null || echo "")
        fi

        # 남은 시간 (projection에서 직접 가져오기)
        REMAINING_MINS=$(echo "$ACTIVE_BLOCK" | jq -r '.projection.remainingMinutes // empty' 2>/dev/null)
        if [[ -n "$REMAINING_MINS" && "$REMAINING_MINS" != "null" ]]; then
            REMAINING_MINS=${REMAINING_MINS%.*}  # 소수점 제거
            if [[ $REMAINING_MINS -ge 60 ]]; then
                HOURS=$((REMAINING_MINS / 60))
                MINS=$((REMAINING_MINS % 60))
                RATE_TIME_LEFT="${HOURS}h ${MINS}m"
            else
                RATE_TIME_LEFT="${REMAINING_MINS}m"
            fi
        fi

        # 현재 비용 / 예상 총 비용으로 퍼센트 계산
        COST_USD=$(echo "$ACTIVE_BLOCK" | jq -r '.costUSD // empty' 2>/dev/null)
        PROJECTED_COST=$(echo "$ACTIVE_BLOCK" | jq -r '.projection.totalCost // empty' 2>/dev/null)
        if [[ -n "$COST_USD" && -n "$PROJECTED_COST" && "$PROJECTED_COST" != "null" ]]; then
            RATE_LIMIT_PCT=$(echo "scale=0; $COST_USD * 100 / $PROJECTED_COST" | bc 2>/dev/null || echo "")
        fi

        # 번레이트 (burnRate에서 직접 가져오기)
        BURN_RATE_RAW=$(echo "$ACTIVE_BLOCK" | jq -r '.burnRate.costPerHour // empty' 2>/dev/null)
        if [[ -n "$BURN_RATE_RAW" && "$BURN_RATE_RAW" != "null" ]]; then
            BURN_RATE=$(printf "\$%.2f/h" "$BURN_RATE_RAW")
        fi
    fi
fi

# ============================================================
# 5. 테마 로드 및 렌더링
# ============================================================
THEME_DIR="$HOME/.claude/themes"
THEME_CONFIG="$HOME/.claude/theme-config.sh"
[[ -f "$THEME_CONFIG" ]] && source "$THEME_CONFIG"
THEME_NAME="${CLAUDE_THEME:-badges}"
THEME_FILE="$THEME_DIR/$THEME_NAME"

# 데이터를 export하여 테마에서 사용 가능하게
export MODEL DIR DIR_NAME CONTEXT_PCT
export SESSION_DURATION_MS SESSION_DURATION_MIN LINES_ADDED LINES_REMOVED
export IS_GIT_REPO BRANCH WORKTREE
export GIT_ADDED GIT_MODIFIED GIT_DELETED GIT_AHEAD GIT_BEHIND
export RATE_LIMIT_PCT RATE_RESET_TIME RATE_TIME_LEFT BURN_RATE
export THEME_NAME

# 모듈식 테마 지원: 테마명에 따라 로더 사용
is_modular_theme() {
    local theme="$1"
    # 모듈식 테마 패턴: [mono-][lsd-|rainbow-]{layout}[-nerd]
    # 레이아웃: 1-line, 2-line, card, bars, badges
    [[ "$theme" =~ ^(mono-)?(lsd-|rainbow-)?(1-line|2-line|card|bars|badges)(-nerd)?$ ]]
}

# 테마 로드 결정
if [[ -f "$THEME_FILE" ]]; then
    # 기존 테마 파일이 있으면 사용
    source "$THEME_FILE"
    render
elif is_modular_theme "$THEME_NAME"; then
    # 모듈식 테마 패턴이면 동적 로드
    source "$THEME_DIR/_modular"
    render
elif [[ -f "$THEME_DIR/default" ]]; then
    # 기본 테마로 폴백
    source "$THEME_DIR/default"
    render
else
    # 최후 수단: 간단한 출력
    echo "🧠 $MODEL  🔋 ${CONTEXT_PCT}%"
fi
