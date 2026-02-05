import { program } from 'commander';
import { VERSION } from './utils/config.js';
import { cmdList } from './commands/list.js';
import { cmdPreview } from './commands/preview.js';
import { cmdApply } from './commands/apply.js';
import { cmdInteractive } from './commands/interactive.js';
import { cmdEdit } from './commands/edit.js';
import { cmdStats } from './commands/usage.js';

export function cli() {
  program
    .name('zstheme')
    .description('Claude Code Statusline Theme Manager - 60 customizable themes')
    .version(VERSION, '-v, --version', 'Show version');

  program
    .option('-l, --list', 'List available themes')
    .option('-p, --preview', 'Preview themes')
    .option('-P, --preview-all', 'Preview all 60 themes')
    .option('-e, --edit', 'Launch interactive color editor')
    .option('-s, --stats', 'Show Claude Code usage statistics')
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
  if (options.list) {
    cmdList(filters);
  } else if (options.previewAll) {
    cmdPreview(true, filters);
  } else if (options.preview) {
    cmdPreview(false, filters);
  } else if (options.edit) {
    cmdEdit();
  } else if (options.stats) {
    cmdStats();
  } else if (args.length > 0) {
    cmdApply(args[0]);
  } else {
    cmdInteractive();
  }
}
