#!/bin/bash
# zstheme installer
# Creates symlinks and configures Claude Code statusline

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
echo "${MAGENTA}${BOLD}  │${RST}  ${CYAN}zstheme${RST} - Installation             ${MAGENTA}${BOLD}│${RST}"
echo "${MAGENTA}${BOLD}  ╰──────────────────────────────────────╯${RST}"
echo ""

# ============================================================
# 1. Create ~/.claude directory if needed
# ============================================================
if [[ ! -d "$CLAUDE_DIR" ]]; then
    echo "${YELLOW}Creating ~/.claude directory...${RST}"
    mkdir -p "$CLAUDE_DIR"
fi

# ============================================================
# 2. Backup existing files
# ============================================================
backup_file() {
    local file="$1"
    if [[ -e "$file" && ! -L "$file" ]]; then
        local backup="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "${YELLOW}Backing up: $file -> $backup${RST}"
        mv "$file" "$backup"
    elif [[ -L "$file" ]]; then
        echo "${BLUE}Removing existing symlink: $file${RST}"
        rm "$file"
    fi
}

backup_file "$CLAUDE_DIR/statusline.sh"
backup_file "$CLAUDE_DIR/themes"

# ============================================================
# 3. Create symlinks
# ============================================================
echo "${GREEN}Creating symlinks...${RST}"

ln -s "$SCRIPT_DIR/statusline.sh" "$CLAUDE_DIR/statusline.sh"
echo "  ${CYAN}~/.claude/statusline.sh${RST} -> $SCRIPT_DIR/statusline.sh"

ln -s "$SCRIPT_DIR/themes" "$CLAUDE_DIR/themes"
echo "  ${CYAN}~/.claude/themes/${RST} -> $SCRIPT_DIR/themes/"

# ============================================================
# 4. Configure settings.json
# ============================================================
SETTINGS_FILE="$CLAUDE_DIR/settings.json"

configure_settings() {
    if [[ -f "$SETTINGS_FILE" ]]; then
        # Check if statusLine is already configured
        if grep -q '"statusLine"' "$SETTINGS_FILE" 2>/dev/null; then
            echo "${BLUE}settings.json already has statusLine configured${RST}"
        else
            echo "${YELLOW}Adding statusLine to settings.json...${RST}"
            # Use jq if available, otherwise warn
            if command -v jq &>/dev/null; then
                local tmp=$(mktemp)
                jq '. + {"statusLine": {"command": "~/.claude/statusline.sh"}}' "$SETTINGS_FILE" > "$tmp"
                mv "$tmp" "$SETTINGS_FILE"
                echo "${GREEN}Updated settings.json${RST}"
            else
                echo "${YELLOW}Please add manually to $SETTINGS_FILE:${RST}"
                echo '  "statusLine": { "command": "~/.claude/statusline.sh" }'
            fi
        fi
    else
        echo "${GREEN}Creating settings.json...${RST}"
        cat > "$SETTINGS_FILE" << 'EOF'
{
  "statusLine": {
    "command": "~/.claude/statusline.sh"
  }
}
EOF
    fi
}

configure_settings

# ============================================================
# 5. Add zstheme to PATH
# ============================================================
echo ""
echo "${BOLD}Installing zstheme CLI...${RST}"

# Make executable
chmod +x "$SCRIPT_DIR/zstheme"

# Check common bin directories
LOCAL_BIN="$HOME/.local/bin"
if [[ -d "$LOCAL_BIN" ]]; then
    ln -sf "$SCRIPT_DIR/zstheme" "$LOCAL_BIN/zstheme"
    echo "  ${GREEN}Installed to $LOCAL_BIN/zstheme${RST}"
elif [[ -d "/usr/local/bin" && -w "/usr/local/bin" ]]; then
    ln -sf "$SCRIPT_DIR/zstheme" "/usr/local/bin/zstheme"
    echo "  ${GREEN}Installed to /usr/local/bin/zstheme${RST}"
else
    mkdir -p "$LOCAL_BIN"
    ln -sf "$SCRIPT_DIR/zstheme" "$LOCAL_BIN/zstheme"
    echo "  ${GREEN}Installed to $LOCAL_BIN/zstheme${RST}"
    echo ""
    echo "${YELLOW}Add to your PATH (add to ~/.zshrc or ~/.bashrc):${RST}"
    echo "  ${CYAN}export PATH=\"\$HOME/.local/bin:\$PATH\"${RST}"
fi

# ============================================================
# 6. Done!
# ============================================================
echo ""
echo "${GREEN}${BOLD}Installation complete!${RST}"
echo ""
echo "${BOLD}Next steps:${RST}"
echo ""
echo "  1. Set your preferred theme:"
echo "     ${CYAN}zstheme${RST}  # Interactive selector"
echo ""
echo "  2. Add to your shell config (~/.zshrc or ~/.bashrc):"
echo "     ${CYAN}export CLAUDE_THEME=\"default\"${RST}"
echo ""
echo "  3. Restart Claude Code to see the statusline"
echo ""
echo "${BOLD}Available themes:${RST}"
for theme in $(ls -1 "$SCRIPT_DIR/themes" | sort); do
    echo "  - $theme"
done
echo ""
