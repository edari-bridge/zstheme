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
CONFIG_DIR="$HOME/.config/zstheme"
BACKUP_FILE="$CONFIG_DIR/original-statusline.json"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
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
CYAN=$'\033[36m'
MAGENTA=$'\033[35m'

echo ""
echo "${MAGENTA}${BOLD}  ╭──────────────────────────────────────╮${RST}"
echo "${MAGENTA}${BOLD}  │${RST}  ${CYAN}zstheme${RST} - Uninstallation           ${MAGENTA}${BOLD}│${RST}"
echo "${MAGENTA}${BOLD}  ╰──────────────────────────────────────╯${RST}"
echo ""

# ============================================================
# 1. Restore settings.json (must run before removing install dir)
# ============================================================
echo "${BOLD}Restoring settings.json...${RST}"
if [[ -f "$INSTALL_DIR/bin/restore-settings.js" ]]; then
    result=$(node "$INSTALL_DIR/bin/restore-settings.js" "$SETTINGS_FILE" "$BACKUP_FILE" 2>&1)
    exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        while IFS= read -r line; do
            case "$line" in
                RESTORED)    echo "  ${GREEN}Restored original statusLine from backup${RST}" ;;
                REMOVED)     echo "  ${GREEN}Removed zstheme statusLine${RST}" ;;
                NO_SETTINGS) echo "  ${BLUE}No settings.json found, skipping${RST}" ;;
                NO_BACKUP)   echo "  ${BLUE}No backup found, skipping${RST}" ;;
            esac
        done <<< "$result"
    else
        echo "  ${YELLOW}Could not restore automatically${RST}"
        echo "  ${YELLOW}Please remove the statusLine entry from $SETTINGS_FILE manually${RST}"
    fi
else
    echo "  ${YELLOW}restore-settings.js not found, skipping${RST}"
    echo "  ${YELLOW}Please remove the statusLine entry from $SETTINGS_FILE manually${RST}"
fi

# ============================================================
# 2. Remove symlinks from ~/.claude
# ============================================================
echo ""
echo "${BOLD}Removing symlinks...${RST}"

remove_symlink() {
    local file="$1"
    if [[ -L "$file" ]]; then
        rm "$file"
        echo "  ${GREEN}Removed: $file${RST}"
    elif [[ -e "$file" ]]; then
        echo "  ${YELLOW}Skipped (not a symlink): $file${RST}"
    fi
}

remove_symlink "$CLAUDE_DIR/statusline.sh"
remove_symlink "$CLAUDE_DIR/themes"

# ============================================================
# 3. Remove CLI from PATH
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
# 4. Uninstall ccusage (optional)
# ============================================================
if command -v ccusage &>/dev/null; then
    echo ""
    read -rp "Uninstall ccusage as well? (y/N) " answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
        npm uninstall -g ccusage 2>/dev/null
        echo "  ${GREEN}ccusage uninstalled${RST}"
    else
        echo "  ${BLUE}Keeping ccusage${RST}"
    fi
fi

# ============================================================
# 5. Purge or preserve
# ============================================================
if [[ "$PURGE" == true ]]; then
    echo ""
    echo "${BOLD}Purging all zstheme data...${RST}"

    if [[ -d "$CONFIG_DIR" ]]; then
        rm -rf "$CONFIG_DIR"
        echo "  ${GREEN}Removed: $CONFIG_DIR${RST}"
    fi

    THEME_CONFIG="$CLAUDE_DIR/theme-config.sh"
    if [[ -f "$THEME_CONFIG" ]]; then
        rm "$THEME_CONFIG"
        echo "  ${GREEN}Removed: theme-config.sh${RST}"
    fi

    if [[ -d "$INSTALL_DIR" ]]; then
        rm -rf "$INSTALL_DIR"
        echo "  ${GREEN}Removed: $INSTALL_DIR${RST}"
    fi
else
    echo ""
    echo "${YELLOW}Preserved:${RST}"
    [[ -d "$CONFIG_DIR" ]] && echo "  - Config: ${CYAN}$CONFIG_DIR${RST}"
    [[ -d "$INSTALL_DIR" ]] && echo "  - Installation: ${CYAN}$INSTALL_DIR${RST}"
    echo ""
    echo "To remove everything: ${CYAN}~/.zstheme/uninstall.sh --purge${RST}"
fi

# ============================================================
# Done
# ============================================================
echo ""
echo "${GREEN}${BOLD}Uninstall complete!${RST}"
echo "${YELLOW}Restart your terminal for changes to take effect.${RST}"
echo ""
