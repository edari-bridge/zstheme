import test from 'node:test';
import assert from 'node:assert/strict';
import { parseInput, collectGitInfo } from '../src/renderer/data.js';
import { SAMPLE_JSON_INPUT } from './fixtures.mjs';

// --- parseInput ---

test('parseInput extracts model, dir, contextPct from valid JSON', () => {
  const result = parseInput(SAMPLE_JSON_INPUT);
  assert.equal(result.model, 'Claude Sonnet 4');
  assert.equal(result.dir, '/home/user/projects/myapp');
  assert.equal(result.dirName, 'myapp');
  assert.equal(result.contextPct, 25);
});

test('parseInput converts sessionDurationMs to sessionDurationMin', () => {
  const result = parseInput(SAMPLE_JSON_INPUT);
  assert.equal(result.sessionDurationMs, 180000);
  assert.equal(result.sessionDurationMin, 3);
});

test('parseInput extracts linesAdded and linesRemoved', () => {
  const result = parseInput(SAMPLE_JSON_INPUT);
  assert.equal(result.linesAdded, 42);
  assert.equal(result.linesRemoved, 7);
});

test('parseInput returns safe defaults for invalid JSON', () => {
  const result = parseInput('not valid json{{{');
  assert.equal(result.model, 'Unknown');
  assert.equal(result.contextPct, 0);
  assert.equal(result.sessionDurationMs, 0);
  assert.equal(result.sessionDurationMin, 0);
});

test('parseInput returns defaults for empty object', () => {
  const result = parseInput('{}');
  assert.equal(result.model, 'Unknown');
  assert.equal(result.dir, '');
  assert.equal(result.contextPct, 0);
  assert.equal(result.linesAdded, 0);
  assert.equal(result.linesRemoved, 0);
});

test('parseInput handles string numbers via toInt', () => {
  const json = JSON.stringify({
    context_window: { used_percentage: '42' },
    cost: { total_duration_ms: '120000', total_lines_added: '10', total_lines_removed: '5' },
  });
  const result = parseInput(json);
  assert.equal(result.contextPct, 42);
  assert.equal(result.sessionDurationMs, 120000);
  assert.equal(result.sessionDurationMin, 2);
  assert.equal(result.linesAdded, 10);
  assert.equal(result.linesRemoved, 5);
});

test('parseInput floors sessionDurationMin', () => {
  const json = JSON.stringify({ cost: { total_duration_ms: 90000 } }); // 1.5 min
  const result = parseInput(json);
  assert.equal(result.sessionDurationMin, 1);
});

test('parseInput extracts optional rate-limit fields', () => {
  const json = JSON.stringify({
    rate: {
      time_left: '2h 30m',
      reset_time: '04:00',
      limit_pct: '42',
      burn_rate: '$4.76/h',
    },
  });

  const result = parseInput(json);
  assert.equal(result.rateTimeLeft, '2h 30m');
  assert.equal(result.rateResetTime, '04:00');
  assert.equal(result.rateLimitPct, 42);
  assert.equal(result.burnRate, '$4.76/h');
});

// --- collectGitInfo ---

test('collectGitInfo in current repo returns valid shape', () => {
  // The test itself runs inside a git repo
  const info = collectGitInfo(process.cwd());
  assert.equal(typeof info.isGitRepo, 'boolean');
  assert.equal(typeof info.branch, 'string');
  assert.equal(typeof info.worktree, 'string');
  assert.equal(typeof info.added, 'number');
  assert.equal(typeof info.modified, 'number');
  assert.equal(typeof info.deleted, 'number');
  assert.equal(typeof info.ahead, 'number');
  assert.equal(typeof info.behind, 'number');
  assert.ok(info.isGitRepo, 'should detect git repo');
});

test('collectGitInfo in /tmp returns isGitRepo false', () => {
  const info = collectGitInfo('/tmp');
  assert.equal(info.isGitRepo, false);
  assert.equal(info.branch, '');
});
