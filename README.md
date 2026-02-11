# zstheme

Beautiful statusline themes for [Claude Code](https://claude.ai/claude-code).

![Preview](screen/default-1.png)

## Features

- **50 Theme Combinations** - Mix layouts, colors, animations, and icons
- **Interactive Selector** - Preview themes in real-time with arrow keys
- **Color Editor** - Customize colors with tweakcc-style interface
- **Git Integration** - Branch, worktree, file changes, push/pull status
- **Rate Limit Display** - Track API usage with [ccusage](https://github.com/ryoppippi/ccusage)
- **Context Awareness** - Colors change based on context window usage

## Quick Start

```bash
# One-line install (requires Node.js 18+)
curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/install.sh | bash

# Select a theme interactively
zstheme
```

## Theme System

### Theme Format

```
[mono-|custom-][rainbow-]{layout}[-nerd]
```

| Component | Options | Description |
|-----------|---------|-------------|
| **Layout** | `1line`, `2line`, `card`, `bars`, `badges` | Required - Visual layout |
| **Color** | (none)=pastel, `mono-`, `custom-` | Color palette (pick one) |
| **Animation** | (none)=static, `rainbow-` | Animation effect |
| **Icons** | (none), `-nerd` | Icon set (requires Nerd Font) |

### Examples

```bash
zstheme 2line              # Classic 2-line layout
zstheme bars-nerd          # Grouped bars with Nerd Font
zstheme mono-card          # Monochrome card style
zstheme rainbow-badges-nerd # Rainbow animation with Nerd Font
zstheme custom-2line       # Your custom colors + 2-line layout
```

### Layout Previews

**2line** - Classic two-line layout
```
🔱 main    🌿 project    📂 src    💾 +2  ~1  -0    🔮 ↑1  ↓0    🔋 35%
🧠 Claude Opus 4.5     ⏳ 2h 30m · 04:00 (42%)     💰 $4.76/h     💬 42m
```

**1line** - Compact single line
```
🔱 main    🌿 project    📂 src    💾 +2 ~1 -0    🧠 Opus 4.5    🔋 35%    ⏳ 2h (42%)
```

**card** - Boxed layout with columns
```
╭──────────────────────────╮  ╭──────────────────────────╮  ╭─────╮
│ 🔱 main                  │  │ 🧠 Claude Opus 4.5       │  │     │
│ 🌿 project               │  │ ⏳ 2h 30m · 04:00        │  │ 35% │
│ 📂 src                   │  │ 💬 42m                   │  │     │
│ 💾 +2  ~1  -0            │  │ 💰 $4.76/h               │  │     │
╰──────────────────────────╯  ╰──────────────────────────╯  ╰─────╯
```

**bars** - Grouped elements with background bars
```
 🔱 main    🌿 project    📂 src     💾 +2  ~1  -0    🔮 ↑1  ↓0     🔋 35%
 🧠 Claude Opus 4.5     ⏳ 2h 30m · 04:00 42%     💰 $4.76/h     🎨 bars
```

**badges** - Individual badges for each element
```
 🔱 main   🌿 project   📂 src    💾 +2 ~1 -0   🔮 ↑1 ↓0    🔋 35%
 🧠 Opus 4.5   ⏳ 2h·04:00 42%   💬 42m   💰 $4.76/h    🎨 badges
```

## CLI Commands

```bash
zstheme              # Interactive theme selector
zstheme <theme>      # Show how to apply a theme
zstheme --list       # List all public theme combinations
zstheme --preview    # Preview sample themes
zstheme --preview-all # Preview all themes
zstheme --edit       # Launch color editor
zstheme --status      # Show full usage statistics
zstheme --dashboard   # Show compact usage dashboard
zstheme --help       # Show help
zstheme --version    # Show version
```

### Filter Options

| Option | Description |
|--------|-------------|
| `--1line` | Show only 1line layout themes |
| `--2line` | Show only 2line layout themes |
| `--card` | Show only card layout themes |
| `--bars` | Show only bars layout themes |
| `--badges` | Show only badges layout themes |
| `--mono` | Show only monochrome themes |
| `--custom` | Show only custom color themes |
| `--rainbow` | Show only rainbow animation themes |
| `--nerd` | Show only Nerd Font themes |

### Statusline Toggle

```bash
zstheme --disable    # Disable zstheme (restore original statusline)
zstheme --enable     # Enable zstheme statusline
```

### Claude Code Skills

Use skills directly in Claude Code:

```bash
# In Claude Code, type:
/dashboard       # Compact dashboard (zstheme --dashboard)
/dashboard-full  # Full status view (zstheme --status)
```

To install the skills:
```bash
mkdir -p ~/.claude/commands
curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/skills/dashboard.md -o ~/.claude/commands/dashboard.md
curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/skills/dashboard-full.md -o ~/.claude/commands/dashboard-full.md
```

## Color Editor

Customize your own color scheme with the interactive editor:

```bash
zstheme --edit
```

- Navigate with `↑↓` or `j/k`
- Adjust colors with `←→` (±1) or `+/-` (±10)
- Switch between foreground/background with `Tab`
- Save with `s`, reset with `r`, quit with `q`

Colors are saved to `~/.config/zstheme/custom-color.sh`.
Use with any layout: `export CLAUDE_THEME="custom-2line"`

## Installation

### Requirements

- **Node.js 18+** - Required for the CLI
- **Claude Code** - The CLI this themes
- **jq** (optional) - For automatic settings.json update
- **ccusage** (optional) - For rate limit display
- **ripgrep** (optional) - Faster file search in development scripts

### Install Steps (macOS / Linux)

```bash
# Option 1: One-line install (recommended)
curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/install.sh | bash

# Option 2: Clone and install
git clone https://github.com/edari-bridge/zstheme.git ~/.zstheme
~/.zstheme/install.sh
```

The installer will:
1. Install npm dependencies
2. Create symlinks in `~/.claude/`
3. Back up your original statusline config
4. Configure `settings.json` with the Node.js renderer
5. Add `zstheme` to your PATH

### Install Steps (Windows)

```powershell
# Option 1: One-line install (PowerShell)
irm https://raw.githubusercontent.com/edari-bridge/zstheme/main/install.ps1 | iex

# Option 2: Clone and install
git clone https://github.com/edari-bridge/zstheme.git $env:USERPROFILE\.zstheme
& "$env:USERPROFILE\.zstheme\install.ps1"
```

The Windows installer uses the **Node.js renderer** (`statusline-node.js`) which works natively on Windows without requiring bash or WSL.

### Manual Setup (macOS / Linux)

If you prefer manual installation:

1. Clone and install dependencies:
   ```bash
   git clone https://github.com/edari-bridge/zstheme.git
   cd zstheme
   npm install
   ```

2. Create symlinks:
   ```bash
   ln -s $(pwd)/statusline.sh ~/.claude/statusline.sh
   ln -s $(pwd)/themes ~/.claude/themes
   ```

3. Configure Claude Code (`~/.claude/settings.json`):
   ```json
   {
     "statusLine": {
       "command": "~/.claude/statusline.sh"
     }
   }
   ```

4. Set your theme in `~/.zshrc` or `~/.bashrc`:
   ```bash
   export CLAUDE_THEME="2line"
   ```

### Manual Setup (Windows)

1. Clone and install dependencies:
   ```powershell
   git clone https://github.com/edari-bridge/zstheme.git
   cd zstheme
   npm install
   ```

2. Create a junction for themes:
   ```powershell
   New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\themes" -Target "$(Get-Location)\themes"
   ```

3. Configure Claude Code (`~/.claude/settings.json`):
   ```json
   {
     "statusLine": {
       "command": "node \"C:\\Users\\YOU\\.zstheme\\bin\\statusline-node.js\""
     }
   }
   ```

4. Set your theme (PowerShell profile or environment variable):
   ```powershell
   $env:CLAUDE_THEME = "2line"
   ```

## Rate Limit Integration

zstheme integrates with [ccusage](https://github.com/ryoppippi/ccusage) for rate limit display:

```bash
npm install -g ccusage
```

Rate limit info is cached for 5 minutes to avoid slowdowns.

## Available Variables in Themes

Themes have access to these environment variables:

| Variable | Description |
|----------|-------------|
| `$MODEL` | Current Claude model |
| `$CONTEXT_PCT` | Context window usage (0-100) |
| `$BRANCH` | Git branch name |
| `$WORKTREE` | Git worktree name |
| `$DIR_NAME` | Current directory name |
| `$GIT_ADDED`, `$GIT_MODIFIED`, `$GIT_DELETED` | File change counts |
| `$GIT_AHEAD`, `$GIT_BEHIND` | Commit difference with remote |
| `$RATE_LIMIT_PCT`, `$RATE_TIME_LEFT` | Rate limit info |
| `$BURN_RATE`, `$RATE_RESET_TIME` | Cost & reset time |
| `$SESSION_DURATION_MIN` | Session duration in minutes |

## Uninstall

### macOS / Linux

```bash
# Remove symlinks and CLI (keeps config)
curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/uninstall.sh | bash

# Complete removal (removes everything)
curl -fsSL https://raw.githubusercontent.com/edari-bridge/zstheme/main/uninstall.sh | bash -s -- --purge
```

### Windows

```powershell
# Remove junction, restore statusline, clean PATH (keeps config)
& "$env:USERPROFILE\.zstheme\uninstall.ps1"

# Complete removal (removes everything)
& "$env:USERPROFILE\.zstheme\uninstall.ps1" --purge
```

## License

MIT

---

Made with 🎨 for the Claude Code community
