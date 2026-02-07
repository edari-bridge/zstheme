#!/bin/bash

set -o pipefail

debug_log_input() {
    if [[ "${ZSTHEME_DEBUG:-0}" == "1" ]]; then
        local debug_file="${ZSTHEME_DEBUG_FILE:-/tmp/claude_status_debug.json}"
        echo "$1" > "$debug_file"
    fi
}

_to_int() {
    local value="$1"
    local fallback="${2:-0}"

    if [[ "$value" =~ ^-?[0-9]+$ ]]; then
        echo "$value"
        return
    fi

    if [[ "$value" =~ ^-?[0-9]+\.[0-9]+$ ]]; then
        printf "%.0f" "$value" 2>/dev/null || echo "$fallback"
        return
    fi

    echo "$fallback"
}

init_runtime_defaults() {
    MODEL="Unknown"
    DIR=""
    DIR_NAME=""
    CONTEXT_PCT=0

    SESSION_DURATION_MS=0
    SESSION_DURATION_MIN=0
    LINES_ADDED=0
    LINES_REMOVED=0

    BRANCH=""
    WORKTREE=""
    GIT_ADDED=0
    GIT_MODIFIED=0
    GIT_DELETED=0
    GIT_AHEAD=0
    GIT_BEHIND=0
    IS_GIT_REPO=false

    RATE_LIMIT_PCT=""
    RATE_RESET_TIME=""
    RATE_TIME_LEFT=""
    BURN_RATE=""
}

parse_statusline_input() {
    local input="$1"

    if ! command -v jq >/dev/null 2>&1; then
        DIR_NAME="${PWD##*/}"
        return
    fi

    MODEL=$(echo "$input" | jq -r '.model.display_name // "Unknown"' 2>/dev/null || echo "Unknown")
    DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""' 2>/dev/null || echo "")
    DIR_NAME="${DIR##*/}"
    if [[ -z "$DIR_NAME" || "$DIR_NAME" == "$DIR" ]]; then
        DIR_NAME="${PWD##*/}"
    fi

    local context_raw
    context_raw=$(echo "$input" | jq -r '.context_window.used_percentage // 0' 2>/dev/null || echo "0")
    CONTEXT_PCT=$(_to_int "$context_raw" 0)

    SESSION_DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0' 2>/dev/null || echo "0")
    SESSION_DURATION_MS=$(_to_int "$SESSION_DURATION_MS" 0)
    SESSION_DURATION_MIN=$((SESSION_DURATION_MS / 60000))

    LINES_ADDED=$(echo "$input" | jq -r '.cost.total_lines_added // 0' 2>/dev/null || echo "0")
    LINES_ADDED=$(_to_int "$LINES_ADDED" 0)
    LINES_REMOVED=$(echo "$input" | jq -r '.cost.total_lines_removed // 0' 2>/dev/null || echo "0")
    LINES_REMOVED=$(_to_int "$LINES_REMOVED" 0)
}

collect_git_info() {
    local git_cmd=(git)
    if [[ -n "$DIR" && -d "$DIR" ]]; then
        git_cmd=(git -C "$DIR")
    fi

    if ! "${git_cmd[@]}" rev-parse --git-dir >/dev/null 2>&1; then
        return
    fi

    IS_GIT_REPO=true
    BRANCH=$("${git_cmd[@]}" branch --show-current 2>/dev/null || echo "")

    local wt_path
    wt_path=$("${git_cmd[@]}" rev-parse --show-toplevel 2>/dev/null || echo "")
    WORKTREE="${wt_path##*/}"

    local status_output
    status_output=$("${git_cmd[@]}" status --porcelain 2>/dev/null || true)
    while IFS= read -r line; do
        [[ -z "$line" ]] && continue
        local xy="${line:0:2}"
        if [[ "$xy" == "??" || "$xy" == *A* ]]; then
            GIT_ADDED=$((GIT_ADDED + 1))
        fi
        if [[ "$xy" == *M* ]]; then
            GIT_MODIFIED=$((GIT_MODIFIED + 1))
        fi
        if [[ "$xy" == *D* ]]; then
            GIT_DELETED=$((GIT_DELETED + 1))
        fi
    done <<< "$status_output"

    local upstream
    upstream=$("${git_cmd[@]}" rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "")
    if [[ -n "$upstream" ]]; then
        GIT_AHEAD=$("${git_cmd[@]}" rev-list --count '@{u}..HEAD' 2>/dev/null || echo "0")
        GIT_AHEAD=$(_to_int "$GIT_AHEAD" 0)
        GIT_BEHIND=$("${git_cmd[@]}" rev-list --count 'HEAD..@{u}' 2>/dev/null || echo "0")
        GIT_BEHIND=$(_to_int "$GIT_BEHIND" 0)
    fi
}

run_with_timeout() {
    local timeout_sec="$1"
    shift

    local tmp_out tmp_err
    tmp_out="$(mktemp /tmp/zstheme-timeout.out.XXXXXX)"
    tmp_err="$(mktemp /tmp/zstheme-timeout.err.XXXXXX)"

    "$@" >"$tmp_out" 2>"$tmp_err" &
    local pid="$!"
    local start_ts
    start_ts="$(date +%s)"

    while kill -0 "$pid" 2>/dev/null; do
        local now_ts
        now_ts="$(date +%s)"
        if (( now_ts - start_ts >= timeout_sec )); then
            kill -TERM "$pid" 2>/dev/null || true
            sleep 0.2
            kill -KILL "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
            rm -f "$tmp_out" "$tmp_err"
            return 124
        fi
        sleep 0.2
    done

    wait "$pid"
    local rc=$?
    cat "$tmp_out"
    rm -f "$tmp_out" "$tmp_err"
    return "$rc"
}

format_reset_time() {
    local reset_iso="$1"
    local reset_base="${reset_iso%.*}"
    reset_base="${reset_base%Z}"

    if date -j -f "%Y-%m-%dT%H:%M:%S" "$reset_base" "+%H:%M" >/dev/null 2>&1; then
        date -j -f "%Y-%m-%dT%H:%M:%S" "$reset_base" "+%H:%M" 2>/dev/null || echo ""
        return
    fi

    if date -d "$reset_iso" "+%H:%M" >/dev/null 2>&1; then
        date -d "$reset_iso" "+%H:%M" 2>/dev/null || echo ""
        return
    fi

    echo ""
}

get_ccusage_data() {
    local cache_file="${ZSTHEME_CCUSAGE_CACHE_FILE:-/tmp/ccusage_cache.json}"
    local cache_ttl="${ZSTHEME_CCUSAGE_CACHE_TTL_SEC:-300}"
    local timeout_sec="${ZSTHEME_CCUSAGE_TIMEOUT_SEC:-4}"
    local now_ts cache_ts age

    now_ts="$(date +%s)"

    if [[ -f "$cache_file" ]]; then
        cache_ts=$(stat -f %m "$cache_file" 2>/dev/null || stat -c %Y "$cache_file" 2>/dev/null || echo "0")
        cache_ts=$(_to_int "$cache_ts" 0)
        age=$((now_ts - cache_ts))
        if (( age < cache_ttl )); then
            cat "$cache_file"
            return 0
        fi
    fi

    if ! command -v npx >/dev/null 2>&1; then
        echo "{}"
        return 0
    fi

    local data
    if data="$(run_with_timeout "$timeout_sec" npx ccusage@latest blocks --json)"; then
        echo "$data" > "$cache_file"
        echo "$data"
        return 0
    fi

    if [[ -f "$cache_file" ]]; then
        cat "$cache_file"
    else
        echo "{}"
    fi
}

collect_rate_info() {
    if [[ "${ZSTHEME_DISABLE_CCUSAGE:-0}" == "1" ]]; then
        return
    fi

    if ! command -v jq >/dev/null 2>&1; then
        return
    fi

    local ccusage_data
    ccusage_data="$(get_ccusage_data)"
    [[ -z "$ccusage_data" || "$ccusage_data" == "{}" ]] && return

    local active_block
    active_block=$(echo "$ccusage_data" | jq -c '.blocks[]? | select(.isActive == true)' 2>/dev/null | head -n 1)
    if [[ -z "$active_block" ]]; then
        active_block=$(echo "$ccusage_data" | jq -c '.blocks[]? | select(.projection != null)' 2>/dev/null | head -n 1)
    fi
    [[ -z "$active_block" ]] && return

    local reset_iso remaining_mins cost_usd projected_cost burn_rate_raw

    reset_iso=$(echo "$active_block" | jq -r '.endTime // .resetAt // empty' 2>/dev/null)
    if [[ -n "$reset_iso" ]]; then
        RATE_RESET_TIME="$(format_reset_time "$reset_iso")"
    fi

    remaining_mins=$(echo "$active_block" | jq -r '.projection.remainingMinutes // empty' 2>/dev/null)
    if [[ -n "$remaining_mins" && "$remaining_mins" != "null" ]]; then
        remaining_mins=$(_to_int "$remaining_mins" 0)
        if (( remaining_mins >= 60 )); then
            RATE_TIME_LEFT="$((remaining_mins / 60))h $((remaining_mins % 60))m"
        else
            RATE_TIME_LEFT="${remaining_mins}m"
        fi
    fi

    cost_usd=$(echo "$active_block" | jq -r '.costUSD // empty' 2>/dev/null)
    projected_cost=$(echo "$active_block" | jq -r '.projection.totalCost // empty' 2>/dev/null)
    if [[ -n "$cost_usd" && -n "$projected_cost" && "$projected_cost" != "null" ]]; then
        RATE_LIMIT_PCT=$(awk -v cost="$cost_usd" -v proj="$projected_cost" 'BEGIN { if (proj > 0) printf "%.0f", (cost * 100 / proj); }')
    fi

    burn_rate_raw=$(echo "$active_block" | jq -r '.burnRate.costPerHour // empty' 2>/dev/null)
    if [[ -n "$burn_rate_raw" && "$burn_rate_raw" != "null" ]]; then
        BURN_RATE=$(printf "\$%.2f/h" "$burn_rate_raw")
    fi
}

export_statusline_variables() {
    export MODEL DIR DIR_NAME CONTEXT_PCT
    export SESSION_DURATION_MS SESSION_DURATION_MIN LINES_ADDED LINES_REMOVED
    export IS_GIT_REPO BRANCH WORKTREE
    export GIT_ADDED GIT_MODIFIED GIT_DELETED GIT_AHEAD GIT_BEHIND
    export RATE_LIMIT_PCT RATE_RESET_TIME RATE_TIME_LEFT BURN_RATE
    export THEME_NAME
}

render_theme_output() {
    local theme_dir="${THEME_DIR:-$HOME/.claude/themes}"
    local theme_config="${THEME_CONFIG:-$HOME/.claude/theme-config.sh}"

    [[ -f "$theme_config" ]] && source "$theme_config"
    THEME_NAME="${CLAUDE_THEME:-2line}"

    export_statusline_variables

    local theme_file="$theme_dir/$THEME_NAME"
    if [[ -f "$theme_file" ]]; then
        source "$theme_file"
        if declare -F render >/dev/null 2>&1; then
            render
            return 0
        fi
    fi

    local contract_file="$theme_dir/_modules/theme_contract.sh"
    if [[ -f "$contract_file" ]]; then
        source "$contract_file"
    fi

    if [[ -f "$theme_dir/_modular" ]] && declare -F is_valid_theme_name >/dev/null 2>&1 && is_valid_theme_name "$THEME_NAME"; then
        source "$theme_dir/_modular"
        if declare -F render >/dev/null 2>&1; then
            render
            return 0
        fi
    fi

    if [[ -f "$theme_dir/default" ]]; then
        source "$theme_dir/default"
        if declare -F render >/dev/null 2>&1; then
            render
            return 0
        fi
    fi

    echo "🧠 $MODEL  🔋 ${CONTEXT_PCT}%"
}
