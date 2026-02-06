import test from 'node:test';
import assert from 'node:assert/strict';
import { getZsthemeStatuslineCommand, isZsthemeStatuslineCommand } from '../src/utils/shell.js';

test('isZsthemeStatuslineCommand matches shell and node renderer commands', () => {
  assert.equal(isZsthemeStatuslineCommand('~/.claude/statusline.sh'), true);
  assert.equal(isZsthemeStatuslineCommand('node "C:\\Users\\user\\.zstheme\\bin\\statusline-node.js"'), true);
  assert.equal(isZsthemeStatuslineCommand('node "/tmp/other-script.js"'), false);
  assert.equal(isZsthemeStatuslineCommand(''), false);
});

test('getZsthemeStatuslineCommand returns shell path on non-windows', () => {
  assert.equal(getZsthemeStatuslineCommand('darwin', '/tmp/zstheme'), '~/.claude/statusline.sh');
});

test('getZsthemeStatuslineCommand returns node renderer command on windows', () => {
  const command = getZsthemeStatuslineCommand('win32', '/tmp/zstheme');
  assert.match(command, /^node ".+[\\/]bin[\\/]statusline-node\.js"$/);
});
