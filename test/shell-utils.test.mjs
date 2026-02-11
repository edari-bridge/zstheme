import test from 'node:test';
import assert from 'node:assert/strict';
import { getZsthemeStatuslineCommand, isZsthemeStatuslineCommand, getShellConfigPath, getThemeConfigPath, isZsthemeActive } from '../src/utils/shell.js';

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

// --- getShellConfigPath ---

test('getShellConfigPath returns a path ending with rc or profile', () => {
  const configPath = getShellConfigPath();
  assert.ok(
    configPath.endsWith('.zshrc') || configPath.endsWith('.bashrc') || configPath.endsWith('.bash_profile'),
    `should end with shell config name, got: ${configPath}`
  );
});

// --- getThemeConfigPath ---

test('getThemeConfigPath returns path containing .claude/theme-config.sh', () => {
  const configPath = getThemeConfigPath();
  assert.ok(configPath.includes('.claude'), 'should be in .claude directory');
  assert.ok(configPath.endsWith('theme-config.sh'), 'should end with theme-config.sh');
});

// --- isZsthemeActive ---

test('isZsthemeActive returns boolean', () => {
  const result = isZsthemeActive();
  assert.equal(typeof result, 'boolean');
});
