import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ansi256ToHex,
  FG_DEFAULTS, BG_BADGES_DEFAULTS, BG_BARS_DEFAULTS,
  PASTEL_HEX,
  getThemeColorPalette, resetToDefaults,
} from '../src/utils/colors.js';

// --- ansi256ToHex: standard colors (0-7) ---

test('ansi256ToHex: code 0 -> #000000 (black)', () => {
  assert.equal(ansi256ToHex(0), '#000000');
});

test('ansi256ToHex: code 1 -> #800000 (dark red)', () => {
  assert.equal(ansi256ToHex(1), '#800000');
});

test('ansi256ToHex: code 7 -> #c0c0c0 (silver)', () => {
  assert.equal(ansi256ToHex(7), '#c0c0c0');
});

// --- ansi256ToHex: bright colors (8-15) ---

test('ansi256ToHex: code 8 -> #808080 (grey)', () => {
  assert.equal(ansi256ToHex(8), '#808080');
});

test('ansi256ToHex: code 15 -> #ffffff (white)', () => {
  assert.equal(ansi256ToHex(15), '#ffffff');
});

// --- ansi256ToHex: 6x6x6 cube (16-231) ---

test('ansi256ToHex: code 16 -> #000000 (cube origin)', () => {
  assert.equal(ansi256ToHex(16), '#000000');
});

test('ansi256ToHex: code 196 -> #ff0000 (red)', () => {
  assert.equal(ansi256ToHex(196), '#ff0000');
});

test('ansi256ToHex: code 231 -> #ffffff (cube max)', () => {
  assert.equal(ansi256ToHex(231), '#ffffff');
});

test('ansi256ToHex: code 21 -> #0000ff (blue)', () => {
  // idx=5, r=0, g=0, b=5 -> b=255
  assert.equal(ansi256ToHex(21), '#0000ff');
});

// --- ansi256ToHex: grayscale (232-255) ---

test('ansi256ToHex: code 232 -> #080808 (darkest grey)', () => {
  assert.equal(ansi256ToHex(232), '#080808');
});

test('ansi256ToHex: code 255 -> #eeeeee (lightest grey)', () => {
  assert.equal(ansi256ToHex(255), '#eeeeee');
});

// --- FG_DEFAULTS ---

test('FG_DEFAULTS has 9 keys with name and code', () => {
  const keys = Object.keys(FG_DEFAULTS);
  assert.equal(keys.length, 9);
  const expectedKeys = ['C_BRANCH', 'C_TREE', 'C_DIR', 'C_STATUS', 'C_SYNC', 'C_MODEL', 'C_RATE', 'C_TIME', 'C_BURN'];
  assert.deepEqual(keys, expectedKeys);
  for (const key of keys) {
    assert.ok(typeof FG_DEFAULTS[key].name === 'string');
    assert.ok(typeof FG_DEFAULTS[key].code === 'number');
  }
});

// --- BG_BADGES_DEFAULTS ---

test('BG_BADGES_DEFAULTS has 9 keys', () => {
  assert.equal(Object.keys(BG_BADGES_DEFAULTS).length, 9);
  assert.ok('C_BG_BRANCH' in BG_BADGES_DEFAULTS);
  assert.ok('C_BG_BURN' in BG_BADGES_DEFAULTS);
});

// --- BG_BARS_DEFAULTS ---

test('BG_BARS_DEFAULTS has 3 keys', () => {
  const keys = Object.keys(BG_BARS_DEFAULTS);
  assert.equal(keys.length, 3);
  assert.deepEqual(keys, ['C_BG_LOC', 'C_BG_GIT', 'C_BG_SES']);
});

// --- PASTEL_HEX ---

test('PASTEL_HEX contains 9 hex strings', () => {
  assert.equal(PASTEL_HEX.length, 9);
  for (const hex of PASTEL_HEX) {
    assert.ok(hex.startsWith('#'), `${hex} should start with #`);
    assert.equal(hex.length, 7, `${hex} should be 7 chars`);
  }
});

// --- getThemeColorPalette ---

test('getThemeColorPalette: pastel static "2line" -> 9 colors (PASTEL_HEX)', () => {
  const result = getThemeColorPalette('2line');
  assert.equal(result.length, 9);
  assert.deepEqual(result, PASTEL_HEX);
});

test('getThemeColorPalette: "badges" -> 9 colors (same as PASTEL_HEX)', () => {
  const result = getThemeColorPalette('badges');
  assert.deepEqual(result, PASTEL_HEX);
});

test('getThemeColorPalette: "mono-2line" -> 1 color', () => {
  const result = getThemeColorPalette('mono-2line');
  assert.equal(result.length, 1);
  assert.ok(result[0].startsWith('#'));
});

test('getThemeColorPalette: "rainbow-2line" -> 10 sampled colors', () => {
  const result = getThemeColorPalette('rainbow-2line');
  assert.equal(result.length, 10);
  for (const hex of result) {
    assert.ok(hex.startsWith('#'), `${hex} should start with #`);
  }
});

test('getThemeColorPalette: "lsd-bars" -> 10 sampled colors', () => {
  const result = getThemeColorPalette('lsd-bars');
  assert.equal(result.length, 10);
});

test('getThemeColorPalette: "mono-rainbow-card" -> 10 sampled mono colors', () => {
  const result = getThemeColorPalette('mono-rainbow-card');
  assert.equal(result.length, 10);
});

// --- resetToDefaults ---

test('resetToDefaults returns fg, bg, bgBadges, bgBars, layout, iconType', () => {
  const result = resetToDefaults();
  assert.ok('fg' in result);
  assert.ok('bg' in result);
  assert.ok('bgBadges' in result);
  assert.ok('bgBars' in result);
  assert.equal(result.layout, '2line');
  assert.equal(result.iconType, 'nerd');
});

test('resetToDefaults fg contains all 9 default codes', () => {
  const result = resetToDefaults();
  assert.equal(Object.keys(result.fg).length, 9);
  assert.equal(result.fg.C_BRANCH, FG_DEFAULTS.C_BRANCH.code);
  assert.equal(result.fg.C_BURN, FG_DEFAULTS.C_BURN.code);
});

test('resetToDefaults bg is alias for bgBadges', () => {
  const result = resetToDefaults();
  assert.deepEqual(result.bg, result.bgBadges);
});

test('resetToDefaults bgBars contains 3 default codes', () => {
  const result = resetToDefaults();
  assert.equal(Object.keys(result.bgBars).length, 3);
  assert.equal(result.bgBars.C_BG_LOC, BG_BARS_DEFAULTS.C_BG_LOC.code);
});
