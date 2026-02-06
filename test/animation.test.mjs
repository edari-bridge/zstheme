import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeOffsets, colorizeText, colorizeBgLsd,
  getAnimatedColor, getAnimatedBg,
} from '../src/renderer/animation.js';
import { stripAnsi } from '../src/renderer/helpers.js';

// --- computeOffsets ---

test('computeOffsets static returns {0, 0}', () => {
  const { colorOffset, bgOffset } = computeOffsets('static', 'pastel');
  assert.equal(colorOffset, 0);
  assert.equal(bgOffset, 0);
});

test('computeOffsets rainbow returns 0-59 range', () => {
  const { colorOffset, bgOffset } = computeOffsets('rainbow', 'pastel');
  assert.ok(colorOffset >= 0 && colorOffset < 60, `colorOffset=${colorOffset} should be 0-59`);
  assert.ok(bgOffset >= 0 && bgOffset < 60, `bgOffset=${bgOffset} should be 0-59`);
});

test('computeOffsets lsd returns 0-59 range', () => {
  const { colorOffset, bgOffset } = computeOffsets('lsd', 'pastel');
  assert.ok(colorOffset >= 0 && colorOffset < 60);
  assert.ok(bgOffset >= 0 && bgOffset < 60);
});

// --- colorizeText ---

test('colorizeText preserves characters', () => {
  const result = colorizeText('hello', 0, 0, 'rainbow', 'pastel');
  const plain = stripAnsi(result);
  assert.equal(plain, 'hello');
});

test('colorizeText produces one RGB sequence per character', () => {
  const text = 'abc';
  const result = colorizeText(text, 0, 0, 'rainbow', 'pastel');
  const rgbMatches = result.match(/\x1b\[1;38;2;\d+;\d+;\d+m/g);
  assert.equal(rgbMatches.length, 3, 'should have 3 RGB sequences for 3 chars');
});

test('colorizeText mono produces R=G=B (grayscale)', () => {
  const result = colorizeText('a', 0, 0, 'rainbow', 'mono');
  const match = result.match(/\x1b\[1;38;2;(\d+);(\d+);(\d+)m/);
  assert.ok(match, 'should produce RGB sequence');
  assert.equal(match[1], match[2], 'R should equal G');
  assert.equal(match[2], match[3], 'G should equal B');
});

// --- colorizeBgLsd ---

test('colorizeBgLsd produces 48;2; background RGB codes', () => {
  const result = colorizeBgLsd('hi', 0, 0, 'pastel');
  assert.ok(result.includes('48;2;'), 'should contain background RGB escape');
});

test('colorizeBgLsd preserves text characters', () => {
  const result = colorizeBgLsd('test', 0, 0, 'pastel');
  const plain = stripAnsi(result);
  assert.equal(plain, 'test');
});

// --- getAnimatedColor ---

test('getAnimatedColor returns ANSI RGB format', () => {
  const result = getAnimatedColor(5, 10, 'rainbow', 'pastel');
  assert.ok(/^\x1b\[1;38;2;\d+;\d+;\d+m$/.test(result), `unexpected format: ${JSON.stringify(result)}`);
});

// --- getAnimatedBg ---

test('getAnimatedBg returns ANSI background RGB format', () => {
  const result = getAnimatedBg(0, 10, 'rainbow', 'pastel');
  assert.ok(/^\x1b\[48;2;\d+;\d+;\d+m$/.test(result), `unexpected format: ${JSON.stringify(result)}`);
});
