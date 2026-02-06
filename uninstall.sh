#!/bin/bash
# zstheme uninstaller
# Removes symlinks, CLI, and optionally all files
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/uninstall.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/uninstall.sh | bash -s -- --purge
#   or
#   ~/.zstheme/uninstall.sh [--purge]

set -e

INSTALL_DIR="$HOME/.zstheme"
CLAUDE_DIR="$HOME/.claude"
PURGE=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --purge) PURGE=true ;;
    esac
done

# Colors
RST=$'\033[0m'
BOLD=$'\033[1m'
GREEN=$'\033[32m'
YELLOW=$'\033[33m'
BLUE=$'\033[34m'
RED=$'\033[31m'
CYAN=$'\033[36m'
MAGENTA=$'\033[35m'

echo ""
echo "${MAGENTA}${BOLD}  ╭──────────────────────────────────────╮${RST}"
echo "${MAGENTA}${BOLD}  │${RST}  ${CYAN}zstheme${RST} - Uninstallation           ${MAGENTA}${BOLD}│${RST}"
echo "${MAGENTA}${BOLD}  ╰──────────────────────────────────────╯${RST}"
echo ""

# ============================================================
# 1. Remove symlinks from ~/.claude
# ============================================================
remove_symlink() {
    local file="$1"
    if [[ -L "$file" ]]; then
        rm "$file"
        echo "  ${GREEN}Removed: $file${RST}"
    elif [[ -e "$file" ]]; then
        echo "  ${YELLOW}Skipped (not a symlink): $file${RST}"
    fi
}

echo "${BOLD}Removing symlinks...${RST}"
remove_symlink "$CLAUDE_DIR/statusline.sh"
remove_symlink "$CLAUDE_DIR/themes"

# ============================================================
# 2. Remove CLI from PATH
# ============================================================
echo ""
echo "${BOLD}Removing CLI...${RST}"

LOCAL_BIN="$HOME/.local/bin/zstheme"
GLOBAL_BIN="/usr/local/bin/zstheme"

for bin_path in "$LOCAL_BIN" "$GLOBAL_BIN"; do
    if [[ -L "$bin_path" ]]; then
        rm "$bin_path"
        echo "  ${GREEN}Removed: $bin_path${RST}"
    fi
done

# ============================================================
# 3. Restore original statusline
# ============================================================
BACKUP_FILE="$HOME/.config/zstheme/original-statusline.json"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
PARTIAL_BACKUP_MARKER="__zstheme_partial_backup__"

restore_statusline() {
    if [[ ! -f "$BACKUP_FILE" ]]; then
        echo ""
        echo "${YELLOW}Note:${RST} statusLine config in ~/.claude/settings.json was not removed."
        echo "Remove manually if no longer needed:"
        echo "  ${CYAN}\"statusLine\": { \"command\": \"~/.claude/statusline.sh\" }${RST}"
        return
    fi

    if [[ ! -f "$SETTINGS_FILE" ]]; then
        echo ""
        echo "${BLUE}No settings.json found, nothing to restore${RST}"
        return
    fi

    local backup_content
    backup_content=$(cat "$BACKUP_FILE")

    if echo "$backup_content" | grep -q "\"$PARTIAL_BACKUP_MARKER\"[[:space:]]*:[[:space:]]*true"; then
        echo ""
        echo "${YELLOW}Note:${RST} original statusLine was not fully backed up (install was run without jq)."
        echo "Leaving current settings.json statusLine unchanged to avoid restoring invalid data."
        return
    fi

    if ! command -v jq &>/dev/null; then
        echo ""
        echo "${YELLOW}Note:${RST} jq not found. Please restore statusLine manually in settings.json."
        echo "Original backup saved at: ${CYAN}$BACKUP_FILE${RST}"
        return
    fi

    if [[ "$backup_content" == "null" ]]; then
        # No previous statusline — remove the key
        echo ""
        echo "${GREEN}Removing zstheme statusLine from settings.json (no previous config)...${RST}"
        local tmp
        tmp=$(mktemp)
        jq 'del(.statusLine)' "$SETTINGS_FILE" > "$tmp"
        mv "$tmp" "$SETTINGS_FILE"
        echo "  ${GREEN}statusLine config removed${RST}"
    else
        # Restore original statusline
        echo ""
        echo "${GREEN}Restoring original statusLine config...${RST}"
        local tmp
        tmp=$(mktemp)
        jq --argjson sl "$backup_content" '.statusLine = $sl' "$SETTINGS_FILE" > "$tmp"
        mv "$tmp" "$SETTINGS_FILE"
        echo "  ${GREEN}Original statusLine restored${RST}"
    fi
}

restore_statusline

# ============================================================
# 4. Handle --purge (complete removal)
# ============================================================
CUSTOM_DIR="$HOME/.config/zstheme"

if [[ "$PURGE" == true ]]; then
    echo ""
    echo "${BOLD}Purging all zstheme files...${RST}"

    # Remove custom colors and statusline backup
    if [[ -d "$CUSTOM_DIR" ]]; then
        rm -rf "$CUSTOM_DIR"
        echo "  ${GREEN}Removed: $CUSTOM_DIR (includes statusline backup)${RST}"
    fi

    # Remove installation directory
    if [[ -d "$INSTALL_DIR" ]]; then
        rm -rf "$INSTALL_DIR"
        echo "  ${GREEN}Removed: $INSTALL_DIR${RST}"
    fi

    echo ""
    echo "${GREEN}${BOLD}Complete removal finished!${RST}"
else
    # ============================================================
    # 5. Notes (without --purge)
    # ============================================================
    echo ""
    echo "${YELLOW}Preserved:${RST}"

    if [[ -d "$CUSTOM_DIR" ]]; then
        echo "  - Custom colors: ${CYAN}$CUSTOM_DIR${RST}"
    fi

    if [[ -d "$INSTALL_DIR" ]]; then
        echo "  - Installation: ${CYAN}$INSTALL_DIR${RST}"
    fi

    echo ""
    echo "${GREEN}${BOLD}Uninstallation complete!${RST}"
    echo ""
    echo "To fully remove everything:"
    echo "  ${CYAN}curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/uninstall.sh | bash -s -- --purge${RST}"
fi
echo ""
