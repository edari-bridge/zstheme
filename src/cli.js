import { program } from 'commander';
import { VERSION } from './utils/config.js';
import { cmdList } from './commands/list.js';
import { cmdPreview } from './commands/preview.js';
import { cmdApply } from './commands/apply.js';
import { cmdInteractive } from './commands/interactive.js';
import { cmdEdit } from './commands/edit.js';
import { cmdStats, cmdDashboard } from './commands/usage.js';
import { toggleStatusline } from './utils/shell.js';

export function cli() {
  program
    .name('zstheme')
    .description('Claude Code Statusline Theme Manager - 50 customizable themes')
    .version(VERSION, '-v, --version', 'Show version');

  program
    .option('-l, --list', 'List available themes')
    .option('-p, --preview', 'Preview themes')
    .option('-P, --preview-all', 'Preview all themes')
    .option('-e, --edit', 'Launch interactive color editor')
    .option('-s, --status', 'Show Claude Code usage statistics')
    .option('-d, --dashboard', 'Show compact usage dashboard')
    // 필터 옵션
    .option('--1line', 'Filter: 1line layout')
    .option('--2line', 'Filter: 2line layout')
    .option('--card', 'Filter: card layout')
    .option('--bars', 'Filter: bars layout')
    .option('--badges', 'Filter: badges layout')
    .option('--mono', 'Filter: mono color')
    .option('--custom', 'Filter: custom color')
    .option('--lsd', 'Filter: lsd animation')
    .option('--rainbow', 'Filter: rainbow animation')
    .option('--nerd', 'Filter: nerd font icons')
    // statusline 전환
    .option('--disable', 'Disable zstheme (restore original statusline)')
    .option('--enable', 'Enable zstheme statusline')
    .argument('[theme]', 'Apply a specific theme');

  program.parse();

  const options = program.opts();
  const args = program.args;

  // 필터 수집
  const filters = {
    layout: null,
    color: null,
    animation: null,
    icon: null,
  };

  if (options['1line']) filters.layout = '1line';
  if (options['2line']) filters.layout = '2line';
  if (options.card) filters.layout = 'card';
  if (options.bars) filters.layout = 'bars';
  if (options.badges) filters.layout = 'badges';
  if (options.mono) filters.color = 'mono';
  if (options.custom) filters.color = 'custom';
  if (options.lsd) filters.animation = 'lsd';
  if (options.rainbow) filters.animation = 'rainbow';
  if (options.nerd) filters.icon = 'nerd';

  // 명령어 라우팅
  if (options.disable) {
    const result = toggleStatusline('original');
    if (result.success) {
      console.log('\x1b[32m✓ zstheme disabled (original statusline restored)\x1b[0m');
    } else {
      console.error(`\x1b[31m✗ ${result.error}\x1b[0m`);
      process.exitCode = 1;
    }
    return;
  } else if (options.enable) {
    const result = toggleStatusline('zstheme');
    if (result.success) {
      console.log('\x1b[32m✓ zstheme enabled\x1b[0m');
    } else {
      console.error(`\x1b[31m✗ ${result.error}\x1b[0m`);
      process.exitCode = 1;
    }
    return;
  } else if (options.list) {
    cmdList(filters);
  } else if (options.previewAll) {
    cmdPreview(true, filters);
  } else if (options.preview) {
    cmdPreview(false, filters);
  } else if (options.edit) {
    cmdEdit();
  } else if (options.status) {
    cmdStats();
  } else if (options.dashboard) {
    cmdDashboard();
  } else if (args.length > 0) {
    cmdApply(args[0]);
  } else {
    cmdInteractive();
  }
}
