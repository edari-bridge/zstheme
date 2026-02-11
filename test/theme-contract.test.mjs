import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LAYOUTS, COLOR_MODES, ANIMATION_MODES, HIDDEN_ANIMATION_MODES, ICON_MODES,
  STANDALONE_THEMES,
  parseThemeContract, isValidTheme, getAllAnimations,
} from '../src/utils/themeContract.js';

// --- Constants ---

test('LAYOUTS contains 5 layouts', () => {
  assert.equal(LAYOUTS.length, 5);
  assert.deepEqual(LAYOUTS, ['1line', '2line', 'badges', 'bars', 'card']);
});

test('COLOR_MODES contains 3 modes', () => {
  assert.equal(COLOR_MODES.length, 3);
  assert.deepEqual(COLOR_MODES, ['', 'mono-', 'custom-']);
});

test('STANDALONE_THEMES contains 4 entries', () => {
  assert.equal(Object.keys(STANDALONE_THEMES).length, 4);
  assert.ok('p.lsd-bars' in STANDALONE_THEMES);
  assert.ok('p.lsd-bars-nerd' in STANDALONE_THEMES);
  assert.ok('p.lsd-badges' in STANDALONE_THEMES);
  assert.ok('p.lsd-badges-nerd' in STANDALONE_THEMES);
});

test('ANIMATION_MODES has 2 entries, HIDDEN has 1', () => {
  assert.equal(ANIMATION_MODES.length, 2);
  assert.equal(HIDDEN_ANIMATION_MODES.length, 1);
  assert.deepEqual(HIDDEN_ANIMATION_MODES, ['lsd-']);
});

test('ICON_MODES has 2 entries', () => {
  assert.equal(ICON_MODES.length, 2);
  assert.deepEqual(ICON_MODES, ['', '-nerd']);
});

// --- parseThemeContract basic ---

test('parseThemeContract basic: "2line" -> pastel/static/2line/emoji', () => {
  const result = parseThemeContract('2line');
  assert.deepEqual(result, { color: 'pastel', animation: 'static', layout: '2line', icon: 'emoji' });
});

test('parseThemeContract basic: "badges" -> pastel/static/badges/emoji', () => {
  const result = parseThemeContract('badges');
  assert.deepEqual(result, { color: 'pastel', animation: 'static', layout: 'badges', icon: 'emoji' });
});

// --- parseThemeContract full (all 4 axes) ---

test('parseThemeContract full: "mono-rainbow-badges-nerd" -> all 4 axes', () => {
  const result = parseThemeContract('mono-rainbow-badges-nerd');
  assert.deepEqual(result, { color: 'mono', animation: 'rainbow', layout: 'badges', icon: 'nerd' });
});

// --- parseThemeContract custom ---

test('parseThemeContract custom: "custom-2line" -> color=custom', () => {
  const result = parseThemeContract('custom-2line');
  assert.deepEqual(result, { color: 'custom', animation: 'static', layout: '2line', icon: 'emoji' });
});

test('parseThemeContract custom nerd: "custom-bars-nerd" -> custom/static/bars/nerd', () => {
  const result = parseThemeContract('custom-bars-nerd');
  assert.deepEqual(result, { color: 'custom', animation: 'static', layout: 'bars', icon: 'nerd' });
});

// --- parseThemeContract lsd ---

test('parseThemeContract lsd: "lsd-bars" -> animation=lsd', () => {
  const result = parseThemeContract('lsd-bars');
  assert.deepEqual(result, { color: 'pastel', animation: 'lsd', layout: 'bars', icon: 'emoji' });
});

test('parseThemeContract lsd nerd: "lsd-card-nerd" -> lsd/card/nerd', () => {
  const result = parseThemeContract('lsd-card-nerd');
  assert.deepEqual(result, { color: 'pastel', animation: 'lsd', layout: 'card', icon: 'nerd' });
});

// --- parseThemeContract standalone ---

test('parseThemeContract standalone: "p.lsd-bars" -> standalone mapping', () => {
  const result = parseThemeContract('p.lsd-bars');
  assert.deepEqual(result, { color: 'pastel', animation: 'p.lsd', layout: 'bars', icon: 'emoji' });
});

test('parseThemeContract standalone: "p.lsd-badges-nerd" -> standalone mapping', () => {
  const result = parseThemeContract('p.lsd-badges-nerd');
  assert.deepEqual(result, { color: 'pastel', animation: 'p.lsd', layout: 'badges', icon: 'nerd' });
});

test('parseThemeContract standalone excludes hidden field', () => {
  const result = parseThemeContract('p.lsd-bars');
  assert.equal('hidden' in result, false);
});

// --- parseThemeContract invalid ---

test('parseThemeContract invalid: "invalid" -> layout=null', () => {
  const result = parseThemeContract('invalid');
  assert.equal(result.layout, null);
});

test('parseThemeContract invalid: empty string -> layout=null', () => {
  const result = parseThemeContract('');
  assert.equal(result.layout, null);
});

test('parseThemeContract invalid: "foo-bar" -> layout=null', () => {
  const result = parseThemeContract('foo-bar');
  assert.equal(result.layout, null);
});

// --- isValidTheme valid ---

test('isValidTheme valid: standard themes', () => {
  assert.equal(isValidTheme('2line'), true);
  assert.equal(isValidTheme('mono-badges'), true);
  assert.equal(isValidTheme('rainbow-card-nerd'), true);
  assert.equal(isValidTheme('custom-bars'), true);
});

test('isValidTheme valid: standalone themes', () => {
  assert.equal(isValidTheme('p.lsd-bars'), true);
  assert.equal(isValidTheme('p.lsd-badges-nerd'), true);
});

// --- isValidTheme: lsd with default includeHidden=true ---

test('isValidTheme: "lsd-2line" with default options -> true (includeHidden defaults to true)', () => {
  assert.equal(isValidTheme('lsd-2line'), true);
});

test('isValidTheme: "lsd-bars-nerd" with default options -> true', () => {
  assert.equal(isValidTheme('lsd-bars-nerd'), true);
});

// --- isValidTheme invalid ---

test('isValidTheme invalid: malformed names', () => {
  assert.equal(isValidTheme('invalid'), false);
  assert.equal(isValidTheme(''), false);
  assert.equal(isValidTheme('foo-bar'), false);
});

// --- isValidTheme includeHidden=false ---

test('isValidTheme includeHidden=false: "lsd-2line" -> false', () => {
  assert.equal(isValidTheme('lsd-2line', { includeHidden: false }), false);
});

test('isValidTheme includeHidden=false: standalone hidden themes -> false', () => {
  assert.equal(isValidTheme('p.lsd-bars', { includeHidden: false }), false);
  assert.equal(isValidTheme('p.lsd-badges-nerd', { includeHidden: false }), false);
});

test('isValidTheme includeHidden=false: rainbow (non-hidden) -> true', () => {
  assert.equal(isValidTheme('rainbow-2line', { includeHidden: false }), true);
});

// --- getAllAnimations ---

test('getAllAnimations without hidden returns 2 entries', () => {
  const result = getAllAnimations();
  assert.equal(result.length, 2);
  assert.deepEqual(result, ['', 'rainbow-']);
});

test('getAllAnimations with hidden returns 3 entries', () => {
  const result = getAllAnimations(true);
  assert.equal(result.length, 3);
  assert.ok(result.includes('lsd-'));
  assert.ok(result.includes(''));
  assert.ok(result.includes('rainbow-'));
});
