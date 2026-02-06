import fs from 'fs';
import os from 'os';
import path from 'path';
import { PATHS } from './config.js';

export function getShellConfigPath() {
  const shell = process.env.SHELL || '/bin/zsh';
  const home = os.homedir();

  if (shell.includes('zsh')) {
    return path.join(home, '.zshrc');
  } else if (shell.includes('bash')) {
    // macOS uses .bash_profile, Linux uses .bashrc
    const bashProfile = path.join(home, '.bash_profile');
    if (fs.existsSync(bashProfile)) {
      return bashProfile;
    }
    return path.join(home, '.bashrc');
  }
  return path.join(home, '.zshrc'); // default
}

export function getThemeConfigPath() {
  return path.join(os.homedir(), '.claude', 'theme-config.sh');
}

export function saveThemeToShellConfig(theme) {
  const configPath = getShellConfigPath();
  const exportLine = `export CLAUDE_THEME="${theme}"`;

  let content = '';
  if (fs.existsSync(configPath)) {
    content = fs.readFileSync(configPath, 'utf8');
  }

  // Check if CLAUDE_THEME already exists
  const regex = /^export CLAUDE_THEME=.*$/m;

  if (regex.test(content)) {
    // Update existing
    content = content.replace(regex, exportLine);
  } else {
    // Add new (with newline if file doesn't end with one)
    if (content && !content.endsWith('\n')) {
      content += '\n';
    }
    content += `\n# zstheme - Claude Code statusline theme\n${exportLine}\n`;
  }

  fs.writeFileSync(configPath, content);

  // Also update theme-config.sh for immediate effect
  const themeConfigPath = getThemeConfigPath();
  const themeConfigDir = path.dirname(themeConfigPath);
  if (!fs.existsSync(themeConfigDir)) {
    fs.mkdirSync(themeConfigDir, { recursive: true });
  }
  fs.writeFileSync(themeConfigPath, `CLAUDE_THEME="${theme}"\n`);

  return configPath;
}

export function resetTheme() {
  const configPath = getShellConfigPath();

  if (!fs.existsSync(configPath)) {
    return { success: true };
  }

  let content = fs.readFileSync(configPath, 'utf8');

  // Remove CLAUDE_THEME line and comment
  content = content.replace(/\n?# zstheme - Claude Code statusline theme\nexport CLAUDE_THEME=.*\n?/g, '\n');
  content = content.replace(/^export CLAUDE_THEME=.*\n?/m, '');

  fs.writeFileSync(configPath, content);

  // Also remove theme-config.sh
  const themeConfigPath = getThemeConfigPath();
  if (fs.existsSync(themeConfigPath)) {
    fs.unlinkSync(themeConfigPath);
  }

  return { success: true };
}

export function isZsthemeActive() {
  try {
    if (!fs.existsSync(PATHS.claudeSettings)) return false;
    const settings = JSON.parse(fs.readFileSync(PATHS.claudeSettings, 'utf8'));
    const cmd = settings?.statusLine?.command || '';
    return cmd.includes('statusline.sh');
  } catch {
    return false;
  }
}

export function getOriginalStatusline() {
  try {
    if (!fs.existsSync(PATHS.originalStatusline)) return undefined;
    const raw = fs.readFileSync(PATHS.originalStatusline, 'utf8').trim();
    const parsed = JSON.parse(raw);
    return parsed; // null (no previous) or object like {"command":"..."}
  } catch {
    return undefined;
  }
}

export function toggleStatusline(mode) {
  const settingsPath = PATHS.claudeSettings;

  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      return { success: false, error: 'Failed to parse settings.json' };
    }
  }

  if (mode === 'zstheme') {
    settings.statusLine = { command: '~/.claude/statusline.sh' };
  } else if (mode === 'original') {
    const original = getOriginalStatusline();
    if (original === undefined) {
      return { success: false, error: 'No backup found. Run install.sh first.' };
    }
    if (original === null) {
      // No previous statusline — remove the key
      delete settings.statusLine;
    } else {
      settings.statusLine = original;
    }
  } else {
    return { success: false, error: `Unknown mode: ${mode}` };
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  return { success: true, mode };
}
