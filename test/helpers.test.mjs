import test from 'node:test';
import assert from 'node:assert/strict';
import { stripAnsi, isAnimated, formatGitStatus, formatGitSync, formatContext, renderText, makeChip, visibleWidth, alignTwoLines, applyAnimation } from '../src/renderer/helpers.js';
import { createMockCtx } from './fixtures.mjs';

// --- stripAnsi ---

test('stripAnsi removes 256-color codes', () => {
  const colored = '\x1b[38;5;111mhello\x1b[0m';
  assert.equal(stripAnsi(colored), 'hello');
});

test('stripAnsi removes bold codes', () => {
  const bold = '\x1b[1;38;5;153mworld\x1b[0m';
  assert.equal(stripAnsi(bold), 'world');
});

test('stripAnsi removes RGB codes', () => {
  const rgb = '\x1b[1;38;2;200;250;158mtest\x1b[22;39m';
  assert.equal(stripAnsi(rgb), 'test');
});

test('stripAnsi returns plain text unchanged', () => {
  assert.equal(stripAnsi('plain text'), 'plain text');
});

// --- isAnimated ---

test('isAnimated returns true for rainbow', () => {
  assert.equal(isAnimated('rainbow'), true);
});

test('isAnimated returns true for lsd', () => {
  assert.equal(isAnimated('lsd'), true);
});

test('isAnimated returns false for static', () => {
  assert.equal(isAnimated('static'), false);
});

test('isAnimated returns false for undefined', () => {
  assert.equal(isAnimated(undefined), false);
});

// --- formatGitStatus ---

test('formatGitStatus shows +N ~N -N format in static mode', () => {
  const ctx = createMockCtx({ git: { added: 5, modified: 2, deleted: 1 } });
  const result = formatGitStatus(' ', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('+5'), 'should include +5');
  assert.ok(plain.includes('~2'), 'should include ~2');
  assert.ok(plain.includes('-1'), 'should include -1');
});

test('formatGitStatus shows zero values when no changes', () => {
  const ctx = createMockCtx({ git: { added: 0, modified: 0, deleted: 0 } });
  const result = formatGitStatus(' ', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('+0'));
  assert.ok(plain.includes('~0'));
  assert.ok(plain.includes('-0'));
});

// --- formatGitSync ---

test('formatGitSync shows arrow-N format', () => {
  const ctx = createMockCtx({ git: { ahead: 3, behind: 1 } });
  const result = formatGitSync(' ', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('\u2191 3'), 'should include ↑ 3');
  assert.ok(plain.includes('\u2193 1'), 'should include ↓ 1');
});

test('formatGitSync shows zero values', () => {
  const ctx = createMockCtx({ git: { ahead: 0, behind: 0 } });
  const result = formatGitSync(' ', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('\u2191 0'));
  assert.ok(plain.includes('\u2193 0'));
});

// --- formatContext ---

test('formatContext in emoji mode includes percentage', () => {
  const ctx = createMockCtx({ data: { contextPct: 30 } });
  const result = formatContext(ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('30%'));
});

test('formatContext in nerd mode includes percentage', () => {
  const ctx = createMockCtx({ iconMode: 'nerd', data: { contextPct: 60 } });
  const result = formatContext(ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('60%'));
});

// --- renderText ---

test('renderText static mode produces icon + color + text', () => {
  const ctx = createMockCtx();
  const result = renderText(ctx.colors.C_I_BRANCH, ctx.colors.icons.BRANCH, 'main', ctx.colors.C_BRANCH, 0, ctx);
  assert.ok(result.includes('\x1b['), 'should contain ANSI codes');
  const plain = stripAnsi(result);
  assert.ok(plain.includes('main'), 'should contain text');
});

test('renderText animated mode produces RGB sequences', () => {
  const ctx = createMockCtx({ animationMode: 'rainbow' });
  const result = renderText(ctx.colors.C_I_BRANCH, ctx.colors.icons.BRANCH, 'main', ctx.colors.C_BRANCH, 0, ctx);
  assert.ok(/\x1b\[1;38;2;\d+;\d+;\d+m/.test(result), 'should contain RGB ANSI codes');
  const plain = stripAnsi(result);
  assert.ok(plain.includes('main'), 'should preserve text content');
});

// --- makeChip ---

test('makeChip badge style wraps content with bg and reset', () => {
  const colors = { RST: '\x1b[0m', C_CHIP: '\x1b[90m' };
  const result = makeChip('\x1b[44m', 'hello', 'badge', colors);
  assert.ok(result.includes('hello'), 'should contain content');
  assert.ok(result.startsWith('\x1b[44m'), 'should start with bg');
  assert.ok(result.endsWith('\x1b[0m'), 'should end with reset');
});

test('makeChip pipe style wraps content with pipe characters', () => {
  const colors = { RST: '\x1b[0m', C_CHIP: '\x1b[90m' };
  const result = makeChip('\x1b[44m', 'hello', 'pipe', colors);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('\u2503'), 'should contain pipe character');
  assert.ok(plain.includes('hello'), 'should contain content');
});

// --- visibleWidth ---

test('visibleWidth returns length for plain text', () => {
  assert.equal(visibleWidth('hello'), 5);
});

test('visibleWidth ignores ANSI escape codes', () => {
  const ansiText = '\x1b[38;5;111mhello\x1b[0m';
  assert.equal(visibleWidth(ansiText), 5);
});

test('visibleWidth counts emoji as 2 characters', () => {
  const width = visibleWidth('🔱');
  assert.equal(width, 2);
});

test('visibleWidth: ⏳ (U+23F3) hourglass = 2', () => {
  assert.equal(visibleWidth('⏳'), 2);
});

test('visibleWidth: ⏰ (U+23F0) alarm clock = 2', () => {
  assert.equal(visibleWidth('⏰'), 2);
});

test('visibleWidth: VS16 not overcounted (⚡️ = 2, not 3)', () => {
  // ⚡ (U+26A1) + VS16 (U+FE0F) → display width 2
  assert.equal(visibleWidth('⚡️'), 2);
});

test('visibleWidth: ZWJ sequence 🗓️ = 2', () => {
  assert.equal(visibleWidth('🗓️'), 2);
});

test('visibleWidth: mixed text and emoji', () => {
  // "Hello ⏰ World" = 5 + 1 + 2 + 1 + 5 = 14
  assert.equal(visibleWidth('Hello ⏰ World'), 14);
});

test('visibleWidth: ANSI + emoji combined', () => {
  const text = '\x1b[33m⏳ Loading\x1b[0m';
  // ⏳(2) + space(1) + Loading(7) = 10
  assert.equal(visibleWidth(text), 10);
});

// --- alignTwoLines ---

test('alignTwoLines aligns two sets of parts to equal width', () => {
  const { line1, line2 } = alignTwoLines(['hello', 'world'], ['a', 'b']);
  // Both lines should have the same visible width
  assert.equal(visibleWidth(line1), visibleWidth(line2));
});

test('alignTwoLines handles asymmetric parts', () => {
  const { line1, line2 } = alignTwoLines(['short'], ['much longer text here']);
  assert.ok(line1.length > 0);
  assert.ok(line2.length > 0);
});

test('alignTwoLines respects minSep', () => {
  const { line1 } = alignTwoLines(['a', 'b'], ['c', 'd'], 4);
  // With minSep=4, the separator between 'a' and 'b' should be at least 4 spaces
  assert.ok(line1.includes('    '), 'should have at least 4 spaces between parts');
});

// --- applyAnimation ---

test('applyAnimation static returns icon + text with color codes', () => {
  const ctx = createMockCtx();
  const result = applyAnimation(ctx, {
    type: 'text',
    text: 'main',
    offset: 0,
    iconColor: ctx.colors.C_I_BRANCH,
    icon: ctx.colors.icons.BRANCH,
    textColor: ctx.colors.C_BRANCH,
  });
  const plain = stripAnsi(result);
  assert.ok(plain.includes('main'));
});

test('applyAnimation rainbow returns RGB sequences', () => {
  const ctx = createMockCtx({ animationMode: 'rainbow' });
  const result = applyAnimation(ctx, {
    type: 'text',
    text: 'main',
    offset: 0,
    iconColor: ctx.colors.C_I_BRANCH,
    icon: ctx.colors.icons.BRANCH,
    bgColor: ctx.colors.C_BG_BRANCH,
    textColor: ctx.colors.C_BRANCH,
  });
  assert.ok(/\x1b\[1;38;2;\d+;\d+;\d+m/.test(result), 'should contain RGB ANSI codes');
});
