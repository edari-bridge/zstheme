import fs from 'fs';
import os from 'os';
import path from 'path';

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
