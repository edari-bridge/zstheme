#!/bin/bash
# zstheme uninstaller
# Removes symlinks and CLI

set -e

CLAUDE_DIR="$HOME/.claude"

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
# 3. Note about settings.json
# ============================================================
echo ""
echo "${YELLOW}Note:${RST} statusLine config in ~/.claude/settings.json was not removed."
echo "Remove manually if no longer needed:"
echo "  ${CYAN}\"statusLine\": { \"command\": \"~/.claude/statusline.sh\" }${RST}"

# ============================================================
# 4. Note about custom colors
# ============================================================
CUSTOM_DIR="$HOME/.config/zstheme"
if [[ -d "$CUSTOM_DIR" ]]; then
    echo ""
    echo "${YELLOW}Note:${RST} Custom color config preserved at:"
    echo "  ${CYAN}$CUSTOM_DIR${RST}"
    echo "Delete manually if no longer needed."
fi

# ============================================================
# 5. Done!
# ============================================================
echo ""
echo "${GREEN}${BOLD}Uninstallation complete!${RST}"
echo ""
echo "To fully remove zstheme, delete this directory:"
echo "  ${CYAN}rm -rf $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)${RST}"
echo ""
