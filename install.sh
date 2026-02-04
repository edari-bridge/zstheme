#!/bin/bash
# zstheme installer
# Creates symlinks, installs dependencies, and configures Claude Code statusline

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
# 0. Check Node.js
# ============================================================
if ! command -v node &>/dev/null; then
    echo "${RED}Error: Node.js is required but not installed.${RST}"
    echo "Please install Node.js 18 or later: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [[ $NODE_VERSION -lt 18 ]]; then
    echo "${YELLOW}Warning: Node.js 18+ recommended. Current: $(node -v)${RST}"
fi

# ============================================================
# 1. Install npm dependencies
# ============================================================
echo "${GREEN}Installing npm dependencies...${RST}"
cd "$SCRIPT_DIR"
npm install --omit=dev 2>/dev/null || npm install

# ============================================================
# 2. Create ~/.claude directory if needed
# ============================================================
if [[ ! -d "$CLAUDE_DIR" ]]; then
    echo "${YELLOW}Creating ~/.claude directory...${RST}"
    mkdir -p "$CLAUDE_DIR"
fi

# ============================================================
# 3. Backup existing files
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
# 4. Create symlinks
# ============================================================
echo "${GREEN}Creating symlinks...${RST}"

ln -s "$SCRIPT_DIR/statusline.sh" "$CLAUDE_DIR/statusline.sh"
echo "  ${CYAN}~/.claude/statusline.sh${RST} -> $SCRIPT_DIR/statusline.sh"

ln -s "$SCRIPT_DIR/themes" "$CLAUDE_DIR/themes"
echo "  ${CYAN}~/.claude/themes/${RST} -> $SCRIPT_DIR/themes/"

# ============================================================
# 5. Configure settings.json
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
# 6. Install zstheme CLI
# ============================================================
echo ""
echo "${BOLD}Installing zstheme CLI...${RST}"

# Make executable
chmod +x "$SCRIPT_DIR/bin/zstheme.js"

# Check common bin directories
LOCAL_BIN="$HOME/.local/bin"
if [[ -d "$LOCAL_BIN" ]]; then
    ln -sf "$SCRIPT_DIR/bin/zstheme.js" "$LOCAL_BIN/zstheme"
    echo "  ${GREEN}Installed to $LOCAL_BIN/zstheme${RST}"
elif [[ -d "/usr/local/bin" && -w "/usr/local/bin" ]]; then
    ln -sf "$SCRIPT_DIR/bin/zstheme.js" "/usr/local/bin/zstheme"
    echo "  ${GREEN}Installed to /usr/local/bin/zstheme${RST}"
else
    mkdir -p "$LOCAL_BIN"
    ln -sf "$SCRIPT_DIR/bin/zstheme.js" "$LOCAL_BIN/zstheme"
    echo "  ${GREEN}Installed to $LOCAL_BIN/zstheme${RST}"
    echo ""
    echo "${YELLOW}Add to your PATH (add to ~/.zshrc or ~/.bashrc):${RST}"
    echo "  ${CYAN}export PATH=\"\$HOME/.local/bin:\$PATH\"${RST}"
fi

# ============================================================
# 7. Done!
# ============================================================
echo ""
echo "${GREEN}${BOLD}Installation complete!${RST}"
echo ""
echo "${BOLD}Next steps:${RST}"
echo ""
echo "  1. Set your preferred theme:"
echo "     ${CYAN}zstheme${RST}       # Interactive selector"
echo "     ${CYAN}zstheme --list${RST} # List all themes"
echo "     ${CYAN}zstheme --edit${RST} # Color editor"
echo ""
echo "  2. Add to your shell config (~/.zshrc or ~/.bashrc):"
echo "     ${CYAN}export CLAUDE_THEME=\"2line\"${RST}"
echo ""
echo "  3. Restart Claude Code to see the statusline"
echo ""
echo "${BOLD}Theme Format:${RST} [mono-|custom-][lsd-|rainbow-]{layout}[-nerd]"
echo "  Layouts: 1line, 2line, card, bars, badges"
echo "  Examples: lsd-bars, mono-card-nerd, custom-2line"
echo ""
