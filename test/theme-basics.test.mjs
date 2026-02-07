import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllThemes, isValidTheme, filterThemesByCategory } from '../src/utils/themes.js';

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
