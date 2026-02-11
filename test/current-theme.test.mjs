import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getCurrentTheme } from '../src/utils/themes.js';
import { PATHS } from '../src/utils/config.js';

test('getCurrentTheme falls back to CLAUDE_THEME env when theme-config is missing', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zstheme-current-theme-'));
  const originalThemeConfigPath = PATHS.themeConfig;
  const originalEnvTheme = process.env.CLAUDE_THEME;

  PATHS.themeConfig = path.join(tmpDir, 'missing-theme-config.sh');
  process.env.CLAUDE_THEME = 'bars-nerd';

  try {
    assert.equal(getCurrentTheme(), 'bars-nerd');
  } finally {
    PATHS.themeConfig = originalThemeConfigPath;
    if (originalEnvTheme === undefined) delete process.env.CLAUDE_THEME;
    else process.env.CLAUDE_THEME = originalEnvTheme;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('getCurrentTheme parses export + single-quoted value from theme-config', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zstheme-current-theme-'));
  const originalThemeConfigPath = PATHS.themeConfig;
  const originalEnvTheme = process.env.CLAUDE_THEME;

  PATHS.themeConfig = path.join(tmpDir, 'theme-config.sh');
  process.env.CLAUDE_THEME = '2line';
  fs.mkdirSync(path.dirname(PATHS.themeConfig), { recursive: true });
  fs.writeFileSync(PATHS.themeConfig, "export CLAUDE_THEME='rainbow-2line'\n");

  try {
    assert.equal(getCurrentTheme(), 'rainbow-2line');
  } finally {
    PATHS.themeConfig = originalThemeConfigPath;
    if (originalEnvTheme === undefined) delete process.env.CLAUDE_THEME;
    else process.env.CLAUDE_THEME = originalEnvTheme;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
