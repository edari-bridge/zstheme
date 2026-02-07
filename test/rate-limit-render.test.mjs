import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLayout } from '../src/renderer/layouts/index.js';
import { stripAnsi } from '../src/renderer/helpers.js';
import { createMockCtx } from './fixtures.mjs';

const LAYOUTS = ['1line', '2line', 'card', 'bars', 'badges'];

for (const layout of LAYOUTS) {
  test(`${layout} should render rate limit when percentage is 0`, () => {
    const ctx = createMockCtx();
    ctx.data = {
      ...ctx.data,
      rateTimeLeft: '2h 30m',
      rateResetTime: '04:00',
      rateLimitPct: 0,
    };

    const output = renderLayout(layout, ctx);
    const plain = stripAnsi(output);

    assert.ok(plain.includes('(0%)'), `expected '(0%)' in ${layout} output`);
  });
}
