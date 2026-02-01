#!/bin/bash
# zstheme uninstaller
# Removes symlinks and optionally restores backups

set -e

CLAUDE_DIR="$HOME/.claude"
LOCAL_BIN="$HOME/.local/bin"

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
# 1. Remove symlinks
# ============================================================
echo "${BOLD}Removing symlinks...${RST}"

remove_symlink() {
    local file="$1"
    if [[ -L "$file" ]]; then
        echo "  ${YELLOW}Removing: $file${RST}"
        rm "$file"
    elif [[ -e "$file" ]]; then
        echo "  ${BLUE}Skipping (not a symlink): $file${RST}"
    fi
}

remove_symlink "$CLAUDE_DIR/statusline.sh"
remove_symlink "$CLAUDE_DIR/themes"

# ============================================================
# 2. Remove CLI from PATH
# ============================================================
echo ""
echo "${BOLD}Removing CLI...${RST}"

if [[ -L "$LOCAL_BIN/zstheme" ]]; then
    rm "$LOCAL_BIN/zstheme"
    echo "  ${YELLOW}Removed: $LOCAL_BIN/zstheme${RST}"
fi

if [[ -L "/usr/local/bin/zstheme" ]]; then
    rm "/usr/local/bin/zstheme" 2>/dev/null || echo "  ${BLUE}Cannot remove /usr/local/bin/zstheme (permission denied)${RST}"
fi

# ============================================================
# 3. Check for backups
# ============================================================
echo ""
echo "${BOLD}Checking for backups...${RST}"

backups=$(ls -1 "$CLAUDE_DIR"/*.backup.* 2>/dev/null || true)
if [[ -n "$backups" ]]; then
    echo "${YELLOW}Found backup files:${RST}"
    echo "$backups" | while read -r backup; do
        echo "  - $backup"
    done
    echo ""
    echo "${BLUE}You can restore these manually if needed.${RST}"
else
    echo "  ${GREEN}No backups found.${RST}"
fi

# ============================================================
# 4. Note about settings.json
# ============================================================
echo ""
echo "${BOLD}Note:${RST}"
echo "  settings.json was not modified. To remove statusLine config:"
echo "  ${CYAN}Edit ~/.claude/settings.json${RST} and remove the \"statusLine\" section."

# ============================================================
# 5. Environment variable
# ============================================================
echo ""
echo "${BOLD}Cleanup:${RST}"
echo "  Remove from your shell config (~/.zshrc or ~/.bashrc):"
echo "  ${CYAN}export CLAUDE_THEME=\"...\"${RST}"

# ============================================================
# Done
# ============================================================
echo ""
echo "${GREEN}${BOLD}Uninstallation complete!${RST}"
echo ""
