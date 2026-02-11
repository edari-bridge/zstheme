# zstheme installer for Windows (PowerShell)
# Usage: irm https://raw.githubusercontent.com/edari-bridge/zstheme/main/install.ps1 | iex
#   or:  git clone ... && cd zstheme && .\install.ps1

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/edari-bridge/zstheme.git"
$InstallDir = "$env:USERPROFILE\.zstheme"
$ClaudeDir = "$env:USERPROFILE\.claude"

Write-Host ""
Write-Host "  ╭──────────────────────────────────────╮" -ForegroundColor Magenta
Write-Host "  │  zstheme - Windows Installation      │" -ForegroundColor Magenta
Write-Host "  ╰──────────────────────────────────────╯" -ForegroundColor Magenta
Write-Host ""

# ============================================================
# 0. Determine install location
# ============================================================
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path 2>$null
if ($ScriptDir -and (Test-Path "$ScriptDir\statusline.sh") -and (Test-Path "$ScriptDir\package.json")) {
    $InstallDir = $ScriptDir
    Write-Host "Installing from local directory: $InstallDir" -ForegroundColor Blue
    $RemoteInstall = $false
} else {
    $RemoteInstall = $true
}

if ($RemoteInstall) {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Write-Host "Error: git is required but not installed." -ForegroundColor Red
        Write-Host "Please install git: https://git-scm.com"
        exit 1
    }

    Write-Host "Installing to: $InstallDir" -ForegroundColor Blue
    if (Test-Path $InstallDir) {
        Write-Host "Updating existing installation..." -ForegroundColor Yellow
        Push-Location $InstallDir
        try {
            git pull --ff-only 2>$null
        } catch {
            Write-Host "Git pull failed, re-cloning..." -ForegroundColor Yellow
            Pop-Location
            Remove-Item -Recurse -Force $InstallDir
            git clone $RepoUrl $InstallDir
        }
        Pop-Location
    } else {
        Write-Host "Cloning zstheme..." -ForegroundColor Green
        git clone $RepoUrl $InstallDir
    }
}

# ============================================================
# 1. Check Node.js
# ============================================================
try {
    $NodeVersion = (node -v) -replace 'v','' -split '\.' | Select-Object -First 1
    if ([int]$NodeVersion -lt 18) {
        Write-Host "Warning: Node.js 18+ recommended. Current: $(node -v)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error: Node.js is required but not installed." -ForegroundColor Red
    Write-Host "Please install Node.js 18 or later: https://nodejs.org"
    exit 1
}

# ============================================================
# 2. Install npm dependencies
# ============================================================
Write-Host "Installing npm dependencies..." -ForegroundColor Green
Push-Location $InstallDir
npm install --omit=dev 2>$null
if ($LASTEXITCODE -ne 0) { npm install }
Pop-Location

# ============================================================
# 3. Create ~/.claude directory if needed
# ============================================================
if (-not (Test-Path $ClaudeDir)) {
    Write-Host "Creating ~/.claude directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $ClaudeDir -Force | Out-Null
}

# ============================================================
# 4. Backup original statusline & Configure settings.json
# ============================================================
$SettingsFile = "$ClaudeDir\settings.json"
$StatuslineCmd = "node `"$InstallDir\bin\statusline-node.js`""
$ConfigDir = "$env:USERPROFILE\.config\zstheme"
$BackupFile = "$ConfigDir\original-statusline.json"

# Backup existing statusLine before overwriting
if (-not (Test-Path $BackupFile)) {
    if (-not (Test-Path $ConfigDir)) {
        New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
    }
    if (Test-Path $SettingsFile) {
        try {
            $ExistingSettings = Get-Content $SettingsFile -Raw | ConvertFrom-Json
            if ($ExistingSettings.statusLine) {
                $ExistingSettings.statusLine | ConvertTo-Json -Depth 10 | Set-Content $BackupFile -Encoding UTF8
                Write-Host "Backed up original statusline config" -ForegroundColor Green
            } else {
                "null" | Set-Content $BackupFile -Encoding UTF8
                Write-Host "No previous statusline (saved to backup)" -ForegroundColor Blue
            }
        } catch {
            "null" | Set-Content $BackupFile -Encoding UTF8
        }
    } else {
        "null" | Set-Content $BackupFile -Encoding UTF8
        Write-Host "No previous statusline (saved to backup)" -ForegroundColor Blue
    }
} else {
    Write-Host "Statusline backup already exists, skipping" -ForegroundColor Blue
}

if (Test-Path $SettingsFile) {
    $Settings = Get-Content $SettingsFile -Raw | ConvertFrom-Json
    if (-not $Settings.statusLine) {
        $Settings | Add-Member -NotePropertyName "statusLine" -NotePropertyValue @{ command = $StatuslineCmd }
        $Settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile -Encoding UTF8
        Write-Host "Updated settings.json with statusLine" -ForegroundColor Green
    } else {
        Write-Host "settings.json already has statusLine configured" -ForegroundColor Blue
        Write-Host "  Current: $($Settings.statusLine.command)" -ForegroundColor Cyan
        Write-Host "  To use Node.js renderer, set to: $StatuslineCmd" -ForegroundColor Cyan
    }
} else {
    @{
        statusLine = @{
            command = $StatuslineCmd
        }
    } | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile -Encoding UTF8
    Write-Host "Created settings.json" -ForegroundColor Green
}

# ============================================================
# 5. Create themes symlink/junction
# ============================================================
$ThemesLink = "$ClaudeDir\themes"
if (Test-Path $ThemesLink) {
    Remove-Item $ThemesLink -Force -Recurse
}
New-Item -ItemType Junction -Path $ThemesLink -Target "$InstallDir\themes" | Out-Null
Write-Host "  ~/.claude/themes -> $InstallDir\themes" -ForegroundColor Cyan

# ============================================================
# 6. Add zstheme to PATH
# ============================================================
Write-Host ""
Write-Host "Installing zstheme CLI..." -ForegroundColor White

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$BinDir = "$InstallDir\bin"

if ($UserPath -notlike "*$BinDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$UserPath;$BinDir", "User")
    Write-Host "  Added $BinDir to user PATH" -ForegroundColor Green
    Write-Host "  Restart your terminal for PATH changes to take effect" -ForegroundColor Yellow
} else {
    Write-Host "  $BinDir already in PATH" -ForegroundColor Blue
}

# ============================================================
# 7. Done!
# ============================================================
Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Set your preferred theme:"
Write-Host "     zstheme          # Interactive selector" -ForegroundColor Cyan
Write-Host "     zstheme --list   # List all themes" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Restart Claude Code to see the statusline"
Write-Host ""
Write-Host "Theme Format: [mono-|custom-][rainbow-]{layout}[-nerd]"
Write-Host "  Layouts: 1line, 2line, card, bars, badges"
Write-Host "  Examples: rainbow-bars, mono-card-nerd, custom-2line"
Write-Host ""
