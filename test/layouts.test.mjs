import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLayout } from '../src/renderer/layouts/index.js';
import { stripAnsi } from '../src/renderer/helpers.js';
import { createMockCtx } from './fixtures.mjs';

// --- renderLayout dispatcher ---

test('renderLayout unknown layout falls back to badges', () => {
  const ctx = createMockCtx();
  const result = renderLayout('nonexistent', ctx);
  assert.ok(typeof result === 'string');
  assert.ok(result.length > 0);
});

// --- 1line structure ---

test('1line has no newlines', () => {
  const ctx = createMockCtx();
  const result = renderLayout('1line', ctx);
  assert.equal(result.split('\n').length, 1);
});

test('1line contains model, branch, dirName', () => {
  const ctx = createMockCtx();
  const result = renderLayout('1line', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('main'), 'should include branch');
  assert.ok(plain.includes('myapp'), 'should include dirName');
  assert.ok(plain.includes('Claude Sonnet 4'), 'should include model');
});

// --- 2line structure ---

test('2line has exactly 2 lines', () => {
  const ctx = createMockCtx();
  const result = renderLayout('2line', ctx);
  assert.equal(result.split('\n').length, 2);
});

test('2line contains model and branch', () => {
  const ctx = createMockCtx();
  const result = renderLayout('2line', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('main'));
  assert.ok(plain.includes('Claude Sonnet 4'));
});

// --- bars structure ---

test('bars has exactly 2 lines', () => {
  const ctx = createMockCtx();
  const result = renderLayout('bars', ctx);
  assert.equal(result.split('\n').length, 2);
});

test('bars contains model and dirName', () => {
  const ctx = createMockCtx();
  const result = renderLayout('bars', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('myapp'));
  assert.ok(plain.includes('Claude Sonnet 4'));
});

// --- badges structure ---

test('badges has exactly 2 lines', () => {
  const ctx = createMockCtx();
  const result = renderLayout('badges', ctx);
  assert.equal(result.split('\n').length, 2);
});

test('badges contains model and branch', () => {
  const ctx = createMockCtx();
  const result = renderLayout('badges', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('main'));
  assert.ok(plain.includes('Claude Sonnet 4'));
});

// --- card structure ---

test('card has 7 lines (top + 5 content + bottom)', () => {
  const ctx = createMockCtx();
  const result = renderLayout('card', ctx);
  assert.equal(result.split('\n').length, 7);
});

test('card contains box-drawing characters', () => {
  const ctx = createMockCtx();
  const result = renderLayout('card', ctx);
  assert.ok(result.includes('\u256D'), 'should include ╭');
  assert.ok(result.includes('\u2502'), 'should include │');
  assert.ok(result.includes('\u2570'), 'should include ╰');
});

test('card contains model and branch', () => {
  const ctx = createMockCtx();
  const result = renderLayout('card', ctx);
  const plain = stripAnsi(result);
  assert.ok(plain.includes('main'));
  assert.ok(plain.includes('Claude Sonnet 4'));
});

// --- Cross-layout: all layouts × static/pastel/emoji render without error ---

const LAYOUTS = ['1line', '2line', 'card', 'bars', 'badges'];

for (const layout of LAYOUTS) {
  test(`${layout} renders in static/pastel/emoji without error`, () => {
    const ctx = createMockCtx({ animationMode: 'static', colorMode: 'pastel', iconMode: 'emoji' });
    const result = renderLayout(layout, ctx);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });
}

// --- Cross-layout: rainbow animation ---

for (const layout of LAYOUTS) {
  test(`${layout} renders in rainbow mode without error`, () => {
    const ctx = createMockCtx({ animationMode: 'rainbow', colorOffset: 15, bgOffset: 30 });
    const result = renderLayout(layout, ctx);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });
}

// --- Cross-layout: no git repo ---

for (const layout of LAYOUTS) {
  test(`${layout} renders without git repo without error`, () => {
    const ctx = createMockCtx({ git: { isGitRepo: false, branch: '', worktree: '', added: 0, modified: 0, deleted: 0, ahead: 0, behind: 0 } });
    const result = renderLayout(layout, ctx);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });
}

// --- Cross-layout: nerd font ---

for (const layout of LAYOUTS) {
  test(`${layout} renders with nerd font without error`, () => {
    const ctx = createMockCtx({ iconMode: 'nerd' });
    const result = renderLayout(layout, ctx);
    assert.ok(typeof result === 'string');
    assert.ok(result.length > 0);
  });
}
