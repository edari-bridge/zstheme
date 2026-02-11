#!/bin/bash
# zstheme installer
# Creates symlinks, installs dependencies, and configures Claude Code statusline
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/install.sh | bash
#   or
#   git clone ... && cd zstheme && ./install.sh

set -e

REPO_URL="https://github.com/edari-bridge/zstheme.git"
INSTALL_DIR="$HOME/.zstheme"
CLAUDE_DIR="$HOME/.claude"

# Detect platform: Windows (Git Bash/MSYS/Cygwin) vs Unix
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

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
# 0. Determine install location (remote or local)
# ============================================================

# Check if running via curl | bash (BASH_SOURCE is empty)
if [[ -z "${BASH_SOURCE[0]}" ]]; then
    # Running via curl | bash - always clone
    REMOTE_INSTALL=true
else
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"

    # Check if running from a valid zstheme directory
    if [[ -f "$SCRIPT_DIR/statusline.sh" && -d "$SCRIPT_DIR/themes" && -f "$SCRIPT_DIR/package.json" ]]; then
        # Running from cloned repo
        INSTALL_DIR="$SCRIPT_DIR"
        echo "${BLUE}Installing from local directory: $INSTALL_DIR${RST}"
        REMOTE_INSTALL=false
    else
        REMOTE_INSTALL=true
    fi
fi

if [[ "$REMOTE_INSTALL" == true ]]; then
    if ! command -v git &>/dev/null; then
        echo "${RED}Error: git is required but not installed.${RST}"
        echo "Please install git: https://git-scm.com"
        exit 1
    fi

    echo "${BLUE}Installing to: $INSTALL_DIR${RST}"
    if [[ -d "$INSTALL_DIR" ]]; then
        echo "${YELLOW}Updating existing installation...${RST}"
        cd "$INSTALL_DIR"
        git pull --ff-only 2>/dev/null || {
            echo "${YELLOW}Git pull failed, removing and re-cloning...${RST}"
            echo "${RED}Warning: Removing existing installation at $INSTALL_DIR${RST}" >&2
            rm -rf "$INSTALL_DIR"
            git clone "$REPO_URL" "$INSTALL_DIR"
        }
    else
        echo "${GREEN}Cloning zstheme...${RST}"
        git clone "$REPO_URL" "$INSTALL_DIR"
    fi
fi

# ============================================================
# 1. Check Node.js
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
# 2. Install npm dependencies
# ============================================================
echo "${GREEN}Installing npm dependencies...${RST}"
cd "$INSTALL_DIR"
npm install --omit=dev 2>/dev/null || npm install

# ============================================================
# 3. Create ~/.claude directory if needed
# ============================================================
if [[ ! -d "$CLAUDE_DIR" ]]; then
    echo "${YELLOW}Creating ~/.claude directory...${RST}"
    mkdir -p "$CLAUDE_DIR"
fi

# ============================================================
# 4. Backup existing files
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
# 5. Create symlinks
# ============================================================
echo "${GREEN}Creating symlinks...${RST}"

ln -s "$INSTALL_DIR/statusline.sh" "$CLAUDE_DIR/statusline.sh"
echo "  ${CYAN}~/.claude/statusline.sh${RST} -> $INSTALL_DIR/statusline.sh"

ln -s "$INSTALL_DIR/themes" "$CLAUDE_DIR/themes"
echo "  ${CYAN}~/.claude/themes/${RST} -> $INSTALL_DIR/themes/"

# ============================================================
# 6. Backup original statusline & Configure settings.json
# ============================================================
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
CONFIG_DIR="$HOME/.config/zstheme"
BACKUP_FILE="$CONFIG_DIR/original-statusline.json"
PARTIAL_BACKUP_SENTINEL='{"__zstheme_partial_backup__":true}'

backup_original_statusline() {
    # Skip if backup already exists (first install only)
    if [[ -f "$BACKUP_FILE" ]]; then
        echo "${BLUE}Statusline backup already exists, skipping${RST}"
        return
    fi

    mkdir -p "$CONFIG_DIR"

    if [[ ! -f "$SETTINGS_FILE" ]]; then
        # No settings.json = no previous statusline
        echo "null" > "$BACKUP_FILE"
        echo "${BLUE}No previous statusline (saved to backup)${RST}"
        return
    fi

    if command -v jq &>/dev/null; then
        # Extract statusLine with jq
        local sl
        sl=$(jq '.statusLine // null' "$SETTINGS_FILE" 2>/dev/null)
        echo "$sl" > "$BACKUP_FILE"
        if [[ "$sl" == "null" ]]; then
            echo "${BLUE}No previous statusline (saved to backup)${RST}"
        else
            echo "${GREEN}Backed up original statusline config${RST}"
        fi
    else
        # No jq: check if statusLine key exists
        if grep -q '"statusLine"' "$SETTINGS_FILE" 2>/dev/null; then
            echo "$PARTIAL_BACKUP_SENTINEL" > "$BACKUP_FILE"
            echo "${YELLOW}Detected existing statusLine but jq is missing.${RST}"
            echo "${YELLOW}Saved partial-backup marker (original statusLine left untouched).${RST}"
        else
            echo "null" > "$BACKUP_FILE"
            echo "${BLUE}No previous statusline (saved to backup)${RST}"
        fi
    fi
}

backup_original_statusline

configure_settings() {
    # Select statusline command based on platform
    local STATUSLINE_CMD
    if [[ "$IS_WINDOWS" == true ]]; then
        STATUSLINE_CMD="node \"$INSTALL_DIR/bin/statusline-node.js\""
        echo "${BLUE}Windows detected: using Node.js statusline renderer${RST}"
    else
        STATUSLINE_CMD="~/.claude/statusline.sh"
    fi

    if [[ -f "$SETTINGS_FILE" ]]; then
        # Check if statusLine is already configured
        if grep -q '"statusLine"' "$SETTINGS_FILE" 2>/dev/null; then
            echo "${BLUE}settings.json already has statusLine configured${RST}"
        else
            echo "${YELLOW}Adding statusLine to settings.json...${RST}"
            # Use jq if available, otherwise warn
            if command -v jq &>/dev/null; then
                local tmp=$(mktemp)
                jq --arg cmd "$STATUSLINE_CMD" '. + {"statusLine": {"command": $cmd}}' "$SETTINGS_FILE" > "$tmp"
                mv "$tmp" "$SETTINGS_FILE"
                echo "${GREEN}Updated settings.json${RST}"
            else
                echo "${YELLOW}Please add manually to $SETTINGS_FILE:${RST}"
                echo "  \"statusLine\": { \"command\": \"$STATUSLINE_CMD\" }"
            fi
        fi
    else
        echo "${GREEN}Creating settings.json...${RST}"
        cat > "$SETTINGS_FILE" << EOF
{
  "statusLine": {
    "command": "$STATUSLINE_CMD"
  }
}
EOF
    fi
}

configure_settings

# ============================================================
# 7. Install zstheme CLI
# ============================================================
echo ""
echo "${BOLD}Installing zstheme CLI...${RST}"

# Make executable
chmod +x "$INSTALL_DIR/bin/zstheme.js"

# Check common bin directories
LOCAL_BIN="$HOME/.local/bin"
if [[ -d "$LOCAL_BIN" ]]; then
    ln -sf "$INSTALL_DIR/bin/zstheme.js" "$LOCAL_BIN/zstheme"
    echo "  ${GREEN}Installed to $LOCAL_BIN/zstheme${RST}"
elif [[ -d "/usr/local/bin" && -w "/usr/local/bin" ]]; then
    ln -sf "$INSTALL_DIR/bin/zstheme.js" "/usr/local/bin/zstheme"
    echo "  ${GREEN}Installed to /usr/local/bin/zstheme${RST}"
else
    mkdir -p "$LOCAL_BIN"
    ln -sf "$INSTALL_DIR/bin/zstheme.js" "$LOCAL_BIN/zstheme"
    echo "  ${GREEN}Installed to $LOCAL_BIN/zstheme${RST}"
    echo ""
    echo "${YELLOW}Add to your PATH (add to ~/.zshrc or ~/.bashrc):${RST}"
    echo "  ${CYAN}export PATH=\"\$HOME/.local/bin:\$PATH\"${RST}"
fi

# ============================================================
# 8. Done!
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
echo "${BOLD}Theme Format:${RST} [mono-|custom-][rainbow-]{layout}[-nerd]"
echo "  Layouts: 1line, 2line, card, bars, badges"
echo "  Examples: rainbow-bars, mono-card-nerd, custom-2line"
echo ""
