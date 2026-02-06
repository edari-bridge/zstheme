import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllThemes, isValidTheme } from '../src/utils/themes.js';

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
  assert.equal(isValidTheme('plasma-badges'), true);
  assert.equal(isValidTheme('not-a-theme'), false);
});
