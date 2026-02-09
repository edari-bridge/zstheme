// Main renderer entry point (ported from statusline_engine.sh + statusline.sh)
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parseInput, collectGitInfo } from './data.js';
import { initColors } from './colors.js';
import { computeOffsets } from './animation.js';
import { renderLayout } from './layouts/index.js';
import { parseThemeContract } from '../utils/themeContract.js';

function loadThemeName(themeNameOverride = '') {
  if (typeof themeNameOverride === 'string' && themeNameOverride.trim()) {
    return themeNameOverride.trim();
  }

  const configFile = join(homedir(), '.claude', 'theme-config.sh');
  if (existsSync(configFile)) {
    try {
      const content = readFileSync(configFile, 'utf-8');
      const match = content.match(/CLAUDE_THEME="([^"]+)"/);
      if (match) return match[1];
    } catch { /* empty */ }
  }
  return process.env.CLAUDE_THEME || '2line';
}

export function renderStatusline(jsonInput, options = {}) {
  const data = parseInput(jsonInput);
  const git = options.mockGit || collectGitInfo(data.dir);
  const themeName = loadThemeName(options.themeName);
  const theme = parseThemeContract(themeName);

  if (!theme.layout) {
    return `\u{1F9E0} ${data.model}  \u{1F50B} ${data.contextPct}%`;
  }

  const colorMode = theme.color;
  const animationMode = theme.animation;
  const iconMode = theme.icon;

  const colors = initColors(colorMode, iconMode, data.contextPct, animationMode);
  const { colorOffset, bgOffset } = computeOffsets(animationMode, colorMode);

  const ctx = {
    colors,
    colorMode,
    animationMode,
    iconMode,
    colorOffset,
    bgOffset,
    data: {
      ...data,
      themeName,
    },
    git: {
      isGitRepo: git.isGitRepo,
      branch: git.branch,
      worktree: git.worktree,
      added: git.added,
      modified: git.modified,
      deleted: git.deleted,
      ahead: git.ahead,
      behind: git.behind,
    },
  };

  return renderLayout(theme.layout, ctx);
}
