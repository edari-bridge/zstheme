# zstheme uninstaller for Windows (PowerShell)
# Usage: .\uninstall.ps1          # Remove symlinks and statusline (keeps config)
#        .\uninstall.ps1 --purge  # Complete removal

$ErrorActionPreference = "Continue"

$Purge = $args -contains "--purge"
$InstallDir = "$env:USERPROFILE\.zstheme"
$ClaudeDir = "$env:USERPROFILE\.claude"
$ConfigDir = "$env:USERPROFILE\.config\zstheme"
$BackupFile = "$ConfigDir\original-statusline.json"
$SettingsFile = "$ClaudeDir\settings.json"

Write-Host ""
Write-Host "  +--------------------------------------+" -ForegroundColor Magenta
Write-Host "  |  zstheme - Uninstall                 |" -ForegroundColor Magenta
Write-Host "  +--------------------------------------+" -ForegroundColor Magenta
Write-Host ""

# Detect install directory (might be running from local clone)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path 2>$null
if ($ScriptDir -and (Test-Path "$ScriptDir\bin\restore-settings.js")) {
    $InstallDir = $ScriptDir
}

# ============================================================
# 1. Restore settings.json (must run before removing install dir)
# ============================================================
Write-Host "Restoring settings.json..." -ForegroundColor White
if (Test-Path "$InstallDir\bin\restore-settings.js") {
    $result = node "$InstallDir\bin\restore-settings.js" "$SettingsFile" "$BackupFile" 2>&1
    if ($LASTEXITCODE -eq 0) {
        foreach ($line in $result -split "`n") {
            switch ($line.Trim()) {
                "RESTORED"    { Write-Host "  Restored original statusLine from backup" -ForegroundColor Green }
                "REMOVED"     { Write-Host "  Removed zstheme statusLine" -ForegroundColor Green }
                "NO_SETTINGS" { Write-Host "  No settings.json found, skipping" -ForegroundColor Blue }
                "NO_BACKUP"   { Write-Host "  No backup found, skipping" -ForegroundColor Blue }
            }
        }
    } else {
        Write-Host "  Could not restore automatically" -ForegroundColor Yellow
        Write-Host "  Please remove the statusLine entry from $SettingsFile manually" -ForegroundColor Yellow
    }
} else {
    Write-Host "  restore-settings.js not found, skipping" -ForegroundColor Yellow
    Write-Host "  Please remove the statusLine entry from $SettingsFile manually" -ForegroundColor Yellow
}

# ============================================================
# 2. Remove themes junction
# ============================================================
$ThemesLink = "$ClaudeDir\themes"
if (Test-Path $ThemesLink) {
    Remove-Item $ThemesLink -Force -Recurse
    Write-Host "  Removed ~/.claude/themes junction" -ForegroundColor Green
} else {
    Write-Host "  No themes junction found" -ForegroundColor Blue
}

# ============================================================
# 3. Remove from PATH
# ============================================================
Write-Host "Cleaning PATH..." -ForegroundColor White
$BinDir = "$InstallDir\bin"
try {
    $UserPath = [Environment]::GetEnvironmentVariable("Path", [System.EnvironmentVariableTarget]::User)
    if ($UserPath -like "*$BinDir*") {
        $NewPath = ($UserPath -split ";" | Where-Object { $_ -ne $BinDir }) -join ";"
        [Environment]::SetEnvironmentVariable("Path", $NewPath, [System.EnvironmentVariableTarget]::User)
        Write-Host "  Removed $BinDir from PATH" -ForegroundColor Green
    } else {
        Write-Host "  zstheme not found in PATH" -ForegroundColor Blue
    }
} catch {
    Write-Host "  Could not modify PATH automatically" -ForegroundColor Yellow
    Write-Host "  Please remove $BinDir from your PATH manually" -ForegroundColor Yellow
}

# ============================================================
# 4. Uninstall ccusage (optional)
# ============================================================
if (Get-Command ccusage -ErrorAction SilentlyContinue) {
    Write-Host ""
    $answer = Read-Host "Uninstall ccusage as well? (y/N)"
    if ($answer -eq "y" -or $answer -eq "Y") {
        npm uninstall -g ccusage 2>$null
        Write-Host "  ccusage uninstalled" -ForegroundColor Green
    } else {
        Write-Host "  Keeping ccusage" -ForegroundColor Blue
    }
}

# ============================================================
# 5. Purge or preserve
# ============================================================
if ($Purge) {
    Write-Host ""
    Write-Host "Purging all zstheme data..." -ForegroundColor Yellow

    if (Test-Path $ConfigDir) {
        Remove-Item $ConfigDir -Recurse -Force
        Write-Host "  Removed $ConfigDir" -ForegroundColor Green
    }

    $ThemeConfig = "$ClaudeDir\theme-config.sh"
    if (Test-Path $ThemeConfig) {
        Remove-Item $ThemeConfig -Force
        Write-Host "  Removed theme-config.sh" -ForegroundColor Green
    }

    if (Test-Path $InstallDir) {
        Remove-Item $InstallDir -Recurse -Force
        Write-Host "  Removed $InstallDir" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "Config preserved at: $ConfigDir" -ForegroundColor Blue
    Write-Host "To remove everything: .\uninstall.ps1 --purge" -ForegroundColor Cyan
}

# ============================================================
# Done
# ============================================================
Write-Host ""
Write-Host "Uninstall complete!" -ForegroundColor Green
Write-Host "Restart your terminal for changes to take effect." -ForegroundColor Yellow
Write-Host ""
