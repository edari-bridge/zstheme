import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStatusline } from '../src/renderer/index.js';

const SAMPLE_INPUT = JSON.stringify({
  model: { display_name: 'Opus 4.5' },
  workspace: { current_dir: '/tmp/my-project' },
  context_window: { used_percentage: 35 },
  cost: { total_duration_ms: 420000 },
});

test('renderStatusline honors explicit themeName override', () => {
  const oneLine = renderStatusline(SAMPLE_INPUT, { themeName: '1line' });
  const twoLine = renderStatusline(SAMPLE_INPUT, { themeName: '2line' });

  assert.equal(oneLine.includes('\n'), false);
  assert.equal(twoLine.split('\n').length, 2);
});
