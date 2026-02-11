import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllThemes, isValidTheme, filterThemesByCategory, filterThemesByTab, getAvailableTabs, sortThemes, getThemeDescription, getThemesByLayout, filterThemes, parseThemeName, getCurrentTheme } from '../src/utils/themes.js';

test('theme list should contain unique names', () => {
  const themes = getAllThemes();
  const uniqueCount = new Set(themes).size;
  assert.equal(uniqueCount, themes.length);
  assert.ok(themes.includes('2line'));
  assert.ok(themes.includes('rainbow-2line'));
});

test('theme validator should reject malformed theme names', () => {
  assert.equal(isValidTheme('2line'), true);
  assert.equal(isValidTheme('mono-rainbow-card-nerd'), true);
  assert.equal(isValidTheme('plasma-badges'), false);
  assert.equal(isValidTheme('not-a-theme'), false);
});

test('filterThemesByCategory should keep only custom themes for Custom tab', () => {
  const themes = ['2line', 'custom-2line', 'rainbow-badges', 'custom-bars-nerd'];
  const filtered = filterThemesByCategory(themes, 'Custom');
  assert.deepEqual(filtered, ['custom-2line', 'custom-bars-nerd']);
});

test('filterThemesByCategory should exclude custom themes for Standard tab', () => {
  const themes = ['2line', 'custom-2line', 'rainbow-badges', 'custom-bars-nerd'];
  const filtered = filterThemesByCategory(themes, 'Standard');
  assert.deepEqual(filtered, ['2line', 'rainbow-badges']);
});

// filterThemesByTab tests
test('filterThemesByTab should filter by layout, excluding custom and lsd', () => {
  const themes = ['1line', 'mono-1line', 'rainbow-1line', 'custom-1line', 'lsd-1line', '2line', 'mono-2line'];
  const filtered = filterThemesByTab(themes, '1line');
  assert.deepEqual(filtered, ['1line', 'mono-1line', 'rainbow-1line']);
});

test('filterThemesByTab should return only custom themes for Custom tab', () => {
  const themes = ['2line', 'custom-2line', 'custom-bars-nerd', 'rainbow-card'];
  const filtered = filterThemesByTab(themes, 'Custom');
  assert.deepEqual(filtered, ['custom-2line', 'custom-bars-nerd']);
});

test('filterThemesByTab should return lsd themes for LSD tab when unlocked', () => {
  const themes = ['2line', 'lsd-2line', 'lsd-card-nerd', 'rainbow-bars'];
  const filtered = filterThemesByTab(themes, 'LSD', true);
  assert.deepEqual(filtered, ['lsd-2line', 'lsd-card-nerd']);
});

test('filterThemesByTab should return empty for LSD tab when locked', () => {
  const themes = ['2line', 'lsd-2line', 'lsd-card-nerd'];
  const filtered = filterThemesByTab(themes, 'LSD', false);
  assert.deepEqual(filtered, []);
});

// getAvailableTabs tests
test('getAvailableTabs should return 7 tabs without LSD', () => {
  const tabs = getAvailableTabs(false);
  assert.deepEqual(tabs, ['All', '1line', '2line', 'badges', 'bars', 'card', 'Custom']);
});

test('getAvailableTabs should include LSD tab first when unlocked', () => {
  const tabs = getAvailableTabs(true);
  assert.deepEqual(tabs, ['LSD', 'All', '1line', '2line', 'badges', 'bars', 'card', 'Custom']);
});

// --- sortThemes ---

test('sortThemes orders by layout (1line < 2line < badges)', () => {
  const themes = ['badges', '2line', '1line'];
  const sorted = sortThemes(themes);
  assert.equal(sorted[0], '1line');
  assert.equal(sorted[1], '2line');
  assert.equal(sorted[2], 'badges');
});

test('sortThemes in LSD mode promotes lsd animation', () => {
  const themes = ['2line', 'rainbow-2line', 'lsd-2line'];
  const sorted = sortThemes(themes, true);
  assert.equal(sorted[0], 'lsd-2line', 'lsd should be first in LSD mode');
});

// --- getThemeDescription ---

test('getThemeDescription returns human-readable string', () => {
  const desc = getThemeDescription('2line');
  assert.equal(typeof desc, 'string');
  assert.ok(desc.includes('Classic'), '2line description should include Classic');
  assert.ok(desc.includes('pastel'), 'should include color mode');
});

// --- getThemesByLayout ---

test('getThemesByLayout returns 5 layout keys', () => {
  const grouped = getThemesByLayout();
  const keys = Object.keys(grouped);
  assert.equal(keys.length, 5);
  assert.ok(keys.includes('1line'));
  assert.ok(keys.includes('bars'));
  for (const layout of keys) {
    assert.ok(Array.isArray(grouped[layout]));
    assert.ok(grouped[layout].length > 0, `${layout} should have at least one theme`);
  }
});

// --- filterThemes ---

test('filterThemes by layout returns only matching layout', () => {
  const themes = getAllThemes();
  const barsOnly = filterThemes(themes, { layout: 'bars' });
  for (const t of barsOnly) {
    const parsed = parseThemeName(t);
    assert.equal(parsed.layout, 'bars');
  }
});

test('filterThemes by animation returns only matching animation', () => {
  const themes = getAllThemes(true);
  const rainbowOnly = filterThemes(themes, { animation: 'rainbow' });
  for (const t of rainbowOnly) {
    const parsed = parseThemeName(t);
    assert.equal(parsed.animation, 'rainbow');
  }
});

// --- parseThemeName ---

test('parseThemeName returns layout default 2line for unknown', () => {
  const parsed = parseThemeName('invalid-theme');
  assert.equal(parsed.layout, '2line', 'invalid layout should default to 2line');
});

// --- getCurrentTheme ---

test('getCurrentTheme returns a string', () => {
  const theme = getCurrentTheme();
  assert.equal(typeof theme, 'string');
  assert.ok(theme.length > 0);
});
