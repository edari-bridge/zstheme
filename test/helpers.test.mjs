import test from 'node:test';
import assert from 'node:assert/strict';
import { stripAnsi, isAnimated, formatGitStatus, formatGitSync, formatContext, renderText } from '../src/renderer/helpers.js';
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
