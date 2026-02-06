# zstheme uninstaller for Windows (PowerShell)
# Usage: .\uninstall.ps1          # Remove symlinks and statusline (keeps config)
#        .\uninstall.ps1 --purge  # Complete removal

$ErrorActionPreference = "Stop"

$Purge = $args -contains "--purge"
$InstallDir = "$env:USERPROFILE\.zstheme"
$ClaudeDir = "$env:USERPROFILE\.claude"
$ConfigDir = "$env:USERPROFILE\.config\zstheme"
$BackupFile = "$ConfigDir\original-statusline.json"
$SettingsFile = "$ClaudeDir\settings.json"

Write-Host ""
Write-Host "  zstheme - Windows Uninstall" -ForegroundColor Magenta
Write-Host ""

# ============================================================
# 1. Remove themes junction
# ============================================================
$ThemesLink = "$ClaudeDir\themes"
if (Test-Path $ThemesLink) {
    Remove-Item $ThemesLink -Force -Recurse
    Write-Host "Removed ~/.claude/themes junction" -ForegroundColor Green
} else {
    Write-Host "No themes junction found" -ForegroundColor Blue
}

# ============================================================
# 2. Restore original statusline
# ============================================================
if (Test-Path $SettingsFile) {
    try {
        $Settings = Get-Content $SettingsFile -Raw | ConvertFrom-Json
        if ($Settings.statusLine) {
            if (Test-Path $BackupFile) {
                $BackupContent = Get-Content $BackupFile -Raw
                if ($BackupContent.Trim() -eq "null") {
                    # No original statusline - remove the key
                    $Settings.PSObject.Properties.Remove("statusLine")
                    Write-Host "Removed zstheme statusLine (no original to restore)" -ForegroundColor Green
                } else {
                    # Restore original statusline
                    $Original = $BackupContent | ConvertFrom-Json
                    $Settings.statusLine = $Original
                    Write-Host "Restored original statusLine config" -ForegroundColor Green
                }
                $Settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsFile -Encoding UTF8
            } else {
                Write-Host "No backup found - statusLine left unchanged" -ForegroundColor Yellow
                Write-Host "  You may want to manually edit: $SettingsFile" -ForegroundColor Cyan
            }
        } else {
            Write-Host "No statusLine in settings.json" -ForegroundColor Blue
        }
    } catch {
        Write-Host "Warning: Could not parse settings.json" -ForegroundColor Yellow
    }
}

# ============================================================
# 3. Remove from PATH
# ============================================================
$BinDir = "$InstallDir\bin"
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($UserPath -like "*$BinDir*") {
    $NewPath = ($UserPath -split ';' | Where-Object { $_ -ne $BinDir }) -join ';'
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
    Write-Host "Removed $BinDir from user PATH" -ForegroundColor Green
} else {
    Write-Host "zstheme not found in PATH" -ForegroundColor Blue
}

# ============================================================
# 4. Purge (optional)
# ============================================================
if ($Purge) {
    Write-Host ""
    Write-Host "Purging all zstheme data..." -ForegroundColor Yellow

    # Remove installation directory
    if (Test-Path $InstallDir) {
        Remove-Item -Recurse -Force $InstallDir
        Write-Host "Removed $InstallDir" -ForegroundColor Green
    }

    # Remove config directory
    if (Test-Path $ConfigDir) {
        Remove-Item -Recurse -Force $ConfigDir
        Write-Host "Removed $ConfigDir" -ForegroundColor Green
    }

    # Remove theme-config.sh
    $ThemeConfig = "$ClaudeDir\theme-config.sh"
    if (Test-Path $ThemeConfig) {
        Remove-Item $ThemeConfig -Force
        Write-Host "Removed theme-config.sh" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "Config preserved at: $ConfigDir" -ForegroundColor Blue
    Write-Host "To remove everything: .\uninstall.ps1 --purge" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Uninstall complete!" -ForegroundColor Green
Write-Host "Restart your terminal for changes to take effect." -ForegroundColor Yellow
Write-Host ""
