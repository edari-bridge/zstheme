import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOCK_DATA,
  renderThemePreview,
  renderCustomPreview,
  renderLsdPreview,
  simplePreview,
} from '../src/utils/preview.js';

// --- MOCK_DATA structure ---

test('MOCK_DATA has required top-level keys', () => {
  assert.ok('model' in MOCK_DATA);
  assert.ok('workspace' in MOCK_DATA);
  assert.ok('context_window' in MOCK_DATA);
  assert.ok('cost' in MOCK_DATA);
});

test('MOCK_DATA nested properties exist', () => {
  assert.equal(typeof MOCK_DATA.model.display_name, 'string');
  assert.equal(typeof MOCK_DATA.workspace.current_dir, 'string');
  assert.equal(typeof MOCK_DATA.context_window.used_percentage, 'number');
});

// --- renderThemePreview ---

test('renderThemePreview 2line returns string with ANSI codes and 2 lines', () => {
  const result = renderThemePreview('2line');
  assert.equal(typeof result, 'string');
  assert.ok(result.includes('\x1b['), 'should contain ANSI escape codes');
  assert.equal(result.split('\n').length, 2, 'should have 2 lines');
});

test('renderThemePreview 1line returns single line', () => {
  const result = renderThemePreview('1line');
  assert.equal(typeof result, 'string');
  assert.ok(!result.includes('\n'), 'should be a single line (no newline)');
});

test('renderThemePreview card contains box-drawing characters', () => {
  const result = renderThemePreview('card');
  assert.equal(typeof result, 'string');
  assert.ok(result.includes('\u256D') || result.includes('\u2570'), 'should contain box chars');
});

// --- renderLsdPreview ---

test('renderLsdPreview returns string with ANSI codes', () => {
  const result = renderLsdPreview('2line', 'emoji');
  assert.equal(typeof result, 'string');
  assert.ok(result.includes('\x1b['), 'should contain ANSI escape codes');
});

// --- renderCustomPreview ---

test('renderCustomPreview returns string with ANSI codes', () => {
  const fgColors = {
    C_BRANCH: 11, C_TREE: 10, C_DIR: 14, C_STATUS: 111,
    C_SYNC: 141, C_MODEL: 13, C_RATE: 229, C_TIME: 75, C_BURN: 216,
  };
  const bgBadgesColors = {
    C_BG_BRANCH: 58, C_BG_TREE: 22, C_BG_DIR: 23, C_BG_STATUS: 24,
    C_BG_SYNC: 53, C_BG_MODEL: 53, C_BG_RATE: 58, C_BG_TIME: 24, C_BG_BURN: 94,
  };
  const bgBarsColors = {
    C_BG_LOC: 23, C_BG_GIT: 24, C_BG_SES: 53,
  };
  const result = renderCustomPreview('2line', 'emoji', fgColors, bgBadgesColors, bgBarsColors);
  assert.equal(typeof result, 'string');
  assert.ok(result.includes('\x1b['), 'should contain ANSI escape codes');
});

// --- simplePreview per layout ---

test('simplePreview 1line returns single line', () => {
  const result = simplePreview('1line');
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0, 'should be non-empty');
  assert.ok(!result.includes('\n'), 'should be a single line');
});

test('simplePreview 2line returns 2 lines', () => {
  const result = simplePreview('2line');
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0, 'should be non-empty');
  assert.ok(result.includes('\n'), 'should have newline');
  assert.equal(result.split('\n').length, 2, 'should be exactly 2 lines');
});

test('simplePreview card contains box-drawing character', () => {
  const result = simplePreview('card');
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0, 'should be non-empty');
  assert.ok(result.includes('\u256D'), 'should contain top-left box char');
});

test('simplePreview bars contains background ANSI code', () => {
  const result = simplePreview('bars');
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0, 'should be non-empty');
  assert.ok(result.includes('\x1b[48;'), 'should contain background color code');
});

test('simplePreview badges contains background ANSI code', () => {
  const result = simplePreview('badges');
  assert.equal(typeof result, 'string');
  assert.ok(result.length > 0, 'should be non-empty');
  assert.ok(result.includes('\x1b[48;'), 'should contain background color code');
});
