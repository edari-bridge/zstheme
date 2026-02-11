import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LSD_COLORS, ANIMATION_INTERVAL, GRID_COLUMNS,
  getModelDisplayName, getModelPricing, aggregateModelUsage,
  getLatestModelName, formatNumber, formatCurrency,
} from '../src/constants.js';

// --- LSD_COLORS ---

test('LSD_COLORS contains 6 color strings', () => {
  assert.equal(LSD_COLORS.length, 6);
  assert.deepEqual(LSD_COLORS, ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan']);
});

// --- Constants ---

test('ANIMATION_INTERVAL is 100', () => {
  assert.equal(ANIMATION_INTERVAL, 100);
});

test('GRID_COLUMNS is 3', () => {
  assert.equal(GRID_COLUMNS, 3);
});

// --- getModelDisplayName ---

test('getModelDisplayName: "claude-opus-4-6" -> "Opus 4.6"', () => {
  assert.equal(getModelDisplayName('claude-opus-4-6'), 'Opus 4.6');
});

test('getModelDisplayName: "claude-sonnet-4-5" -> "Sonnet 4.5"', () => {
  assert.equal(getModelDisplayName('claude-sonnet-4-5'), 'Sonnet 4.5');
});

test('getModelDisplayName: "claude-haiku-3-5" -> "Haiku 3.5"', () => {
  assert.equal(getModelDisplayName('claude-haiku-3-5'), 'Haiku 3.5');
});

test('getModelDisplayName: undefined -> "Unknown"', () => {
  assert.equal(getModelDisplayName(undefined), 'Unknown');
});

test('getModelDisplayName: null -> "Unknown"', () => {
  assert.equal(getModelDisplayName(null), 'Unknown');
});

test('getModelDisplayName strips date suffix: "claude-opus-4-6-20250101"', () => {
  assert.equal(getModelDisplayName('claude-opus-4-6-20250101'), 'Opus 4.6');
});

// --- getModelPricing ---

test('getModelPricing: "claude-opus-4-6" -> input=5, output=25', () => {
  const p = getModelPricing('claude-opus-4-6');
  assert.equal(p.input, 5);
  assert.equal(p.output, 25);
  assert.equal(p.cacheRead, 0.50);
  assert.equal(p.cacheCreate, 6.25);
});

test('getModelPricing: "claude-haiku-4-5" -> input=1, output=5', () => {
  const p = getModelPricing('claude-haiku-4-5');
  assert.equal(p.input, 1);
  assert.equal(p.output, 5);
});

test('getModelPricing: unknown model -> DEFAULT (opus-4-6 pricing)', () => {
  const p = getModelPricing('unknown-model');
  assert.equal(p.input, 5);
  assert.equal(p.output, 25);
});

test('getModelPricing: null -> DEFAULT pricing', () => {
  const p = getModelPricing(null);
  assert.equal(p.input, 5);
  assert.equal(p.output, 25);
});

test('getModelPricing: model with date suffix matches', () => {
  const p = getModelPricing('claude-sonnet-4-5-20250929');
  assert.equal(p.input, 3);
  assert.equal(p.output, 15);
});

// --- aggregateModelUsage ---

test('aggregateModelUsage: single model opus-4-6 cost calculation', () => {
  const usage = {
    'claude-opus-4-6': { inputTokens: 1000000, outputTokens: 500000 },
  };
  const result = aggregateModelUsage(usage);
  assert.equal(result.inputTokens, 1000000);
  assert.equal(result.outputTokens, 500000);
  // input cost: 1M * 5/1M = 5, output cost: 0.5M * 25/1M = 12.5, total = 17.5
  assert.equal(result.inputCost, 5);
  assert.equal(result.outputCost, 12.5);
  assert.equal(result.cost, 17.5);
});

test('aggregateModelUsage: multi model opus + haiku', () => {
  const usage = {
    'claude-opus-4-6': { inputTokens: 1000000, outputTokens: 500000 },
    'claude-haiku-4-5': { inputTokens: 2000000, outputTokens: 1000000 },
  };
  const result = aggregateModelUsage(usage);
  assert.equal(result.inputTokens, 3000000);
  assert.equal(result.outputTokens, 1500000);
  // opus: 5 + 12.5 = 17.5, haiku: 2 + 5 = 7, total = 24.5
  const opusInputCost = 5;
  const opusOutputCost = 12.5;
  const haikuInputCost = 2;
  const haikuOutputCost = 5;
  assert.equal(result.cost, opusInputCost + opusOutputCost + haikuInputCost + haikuOutputCost);
});

test('aggregateModelUsage: with cache tokens', () => {
  const usage = {
    'claude-opus-4-6': {
      inputTokens: 1000000,
      outputTokens: 0,
      cacheReadInputTokens: 2000000,
      cacheCreationInputTokens: 500000,
    },
  };
  const result = aggregateModelUsage(usage);
  assert.equal(result.cacheRead, 2000000);
  assert.equal(result.cacheCreate, 500000);
  // input: 5, output: 0, cacheRead: 2*0.5=1, cacheCreate: 0.5*6.25=3.125
  assert.equal(result.inputCost, 5);
  assert.equal(result.outputCost, 0);
  assert.equal(result.cacheReadCost, 1);
  assert.equal(result.cacheCreateCost, 3.125);
  assert.equal(result.cost, 5 + 0 + 1 + 3.125);
});

test('aggregateModelUsage: undefined -> all zeros', () => {
  const result = aggregateModelUsage(undefined);
  assert.equal(result.inputTokens, 0);
  assert.equal(result.outputTokens, 0);
  assert.equal(result.cost, 0);
});

test('aggregateModelUsage: null -> all zeros', () => {
  const result = aggregateModelUsage(null);
  assert.equal(result.inputTokens, 0);
  assert.equal(result.cost, 0);
});

test('aggregateModelUsage: empty object -> all zeros', () => {
  const result = aggregateModelUsage({});
  assert.equal(result.inputTokens, 0);
  assert.equal(result.outputTokens, 0);
  assert.equal(result.cost, 0);
});

// --- getLatestModelName ---

test('getLatestModelName: opus-4-6 is highest priority', () => {
  const usage = {
    'claude-haiku-4-5': { inputTokens: 100 },
    'claude-opus-4-6': { inputTokens: 100 },
    'claude-sonnet-4-5': { inputTokens: 100 },
  };
  assert.equal(getLatestModelName(usage), 'Opus 4.6');
});

test('getLatestModelName: single model returns its display name', () => {
  const usage = { 'claude-sonnet-4': { inputTokens: 100 } };
  assert.equal(getLatestModelName(usage), 'Sonnet 4');
});

test('getLatestModelName: empty/null -> "Unknown"', () => {
  assert.equal(getLatestModelName(undefined), 'Unknown');
  assert.equal(getLatestModelName(null), 'Unknown');
  assert.equal(getLatestModelName({}), 'Unknown');
});

// --- formatNumber ---

test('formatNumber: 1234567 -> "1,234,567"', () => {
  assert.equal(formatNumber(1234567), '1,234,567');
});

test('formatNumber: 0 -> "0"', () => {
  assert.equal(formatNumber(0), '0');
});

test('formatNumber: 999 -> "999"', () => {
  assert.equal(formatNumber(999), '999');
});

// --- formatCurrency ---

test('formatCurrency: 1234.56 -> "$1,234.56"', () => {
  assert.equal(formatCurrency(1234.56), '$1,234.56');
});

test('formatCurrency: 0 -> "$0.00"', () => {
  assert.equal(formatCurrency(0), '$0.00');
});

test('formatCurrency: 5 -> "$5.00"', () => {
  assert.equal(formatCurrency(5), '$5.00');
});
