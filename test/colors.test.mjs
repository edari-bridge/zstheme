import test from 'node:test';
import assert from 'node:assert/strict';
import { initColors, getRateColor } from '../src/renderer/colors.js';

// --- initColors pastel ---

test('initColors pastel returns all required keys', () => {
  const c = initColors('pastel', 'emoji', 25, 'static');
  const requiredKeys = ['RST', 'C_BRANCH', 'C_TREE', 'C_DIR', 'C_MODEL', 'C_STATUS', 'C_SYNC',
    'C_DIM_STATUS', 'C_BRIGHT_STATUS', 'C_DIM_SYNC', 'C_BRIGHT_SYNC',
    'CTX_ICON', 'C_CTX_TEXT', 'icons', 'iconMode'];
  for (const key of requiredKeys) {
    assert.ok(key in c, `missing key: ${key}`);
  }
});

test('initColors pastel includes emoji icons', () => {
  const c = initColors('pastel', 'emoji', 25, 'static');
  assert.ok(c.icons.BRANCH, 'icons.BRANCH should exist');
  assert.ok(c.icons.MODEL, 'icons.MODEL should exist');
  assert.equal(c.iconMode, 'emoji');
});

// --- initColors mono ---

test('initColors mono uses grayscale fg codes', () => {
  const c = initColors('mono', 'emoji', 25, 'static');
  assert.ok(c.C_BRANCH.includes('38;5;250'), 'mono branch should use fg 250');
});

test('initColors mono iconMode is emoji', () => {
  const c = initColors('mono', 'emoji', 25, 'static');
  assert.equal(c.iconMode, 'emoji');
});

// --- Context thresholds ---

test('initColors context < 50 uses CTX_NORM icon (battery)', () => {
  const c = initColors('pastel', 'emoji', 30, 'static');
  assert.equal(c.CTX_ICON, '\u{1F50B}'); // 🔋
});

test('initColors context >= 50 uses CTX_WARN icon (low battery)', () => {
  const c = initColors('pastel', 'emoji', 55, 'static');
  assert.equal(c.CTX_ICON, '\u{1FAB3}'); // 🪫
});

test('initColors context >= 70 uses CTX_CRIT icon (fire)', () => {
  const c = initColors('pastel', 'emoji', 75, 'static');
  assert.equal(c.CTX_ICON, '\u{1F525}'); // 🔥
});

// --- Nerd vs emoji icons ---

test('initColors nerd mode uses nerd font icons', () => {
  const c = initColors('pastel', 'nerd', 25, 'static');
  assert.equal(c.iconMode, 'nerd');
  // Nerd icons have trailing space
  assert.ok(c.icons.BRANCH.includes('\u{F062C}'), 'nerd branch icon');
});

test('initColors emoji mode uses unicode emoji', () => {
  const c = initColors('pastel', 'emoji', 25, 'static');
  assert.equal(c.icons.BRANCH, '\u{1F531}'); // 🔱
});

// --- getRateColor ---

test('getRateColor >= 80 returns red (bright)', () => {
  const color = getRateColor(85, 'pastel', {});
  assert.ok(color.includes('91'), 'should contain bright red code 91');
});

test('getRateColor >= 50 returns orange (208)', () => {
  const color = getRateColor(55, 'pastel', {});
  assert.ok(color.includes('208'), 'should contain 208 orange');
});

test('getRateColor < 50 returns default C_RATE or fg(229)', () => {
  const color = getRateColor(30, 'pastel', { C_RATE: '\x1b[38;5;229m' });
  assert.ok(color.includes('229'), 'should use C_RATE color');
});

test('getRateColor mono >= 80 returns bright white', () => {
  const color = getRateColor(85, 'mono', {});
  assert.ok(color.includes('255'), 'mono high rate should use 255');
});

test('getRateColor mono < 50 returns grayscale', () => {
  const color = getRateColor(30, 'mono', {});
  assert.ok(color.includes('245'), 'mono low rate should use 245');
});

// --- initColors custom ---

test('initColors custom mode includes ANSI color codes', () => {
  const c = initColors('custom', 'nerd', 25, 'static');
  assert.ok(c.C_BRANCH.includes('38;5;'), 'custom branch should have fg ANSI code');
  assert.ok(c.C_MODEL.includes('38;5;'), 'custom model should have fg ANSI code');
});

// --- Context 50% bold ---

test('initColors context 50% uses bold colors', () => {
  const c = initColors('pastel', 'emoji', 55, 'static');
  // At 50%+, pastel uses bold: \x1b[1;33m etc
  assert.ok(c.C_BRANCH.includes('[1;'), 'branch should be bold at 50%+');
  assert.equal(c.CTX_ICON, '\u{1FAB3}'); // 🪫
});

// --- Context 70% bold + red ---

test('initColors context 70% uses bold+red CTX', () => {
  const c = initColors('pastel', 'emoji', 75, 'static');
  assert.ok(c.C_CTX_TEXT.includes('91'), 'CTX text should be bright red (91) at 70%+');
  assert.ok(c.C_BRANCH.includes('[1;'), 'branch should be bold at 70%+');
  assert.equal(c.CTX_ICON, '\u{1F525}'); // 🔥
});
