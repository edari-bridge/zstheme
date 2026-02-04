import chalk from 'chalk';
import { isValidTheme } from '../utils/themes.js';

export function cmdApply(theme) {
  if (!isValidTheme(theme)) {
    console.log(chalk.bold('Error:') + ` Theme '${theme}' not found.`);
    console.log('');
    console.log('Theme format: [mono-|custom-][lsd-|rainbow-]{layout}[-nerd]');
    console.log('  Layouts: 1line, 2line, card, bars, badges');
    console.log('  Examples: lsd-bars, mono-card-nerd, badges-nerd');
    console.log('');
    console.log(`Run '${chalk.cyan('zstheme --list')}' to see all available themes.`);
    process.exit(1);
  }

  console.log('');
  console.log(chalk.green(`Theme '${chalk.bold(theme)}' selected!`));
  console.log('');
  console.log('To apply, add this to your shell config (~/.zshrc or ~/.bashrc):');
  console.log('');
  console.log(`  ${chalk.cyan(`export CLAUDE_THEME="${theme}"`)}`);
  console.log('');
  console.log('Then restart your terminal or run:');
  console.log('');
  console.log(`  ${chalk.cyan('source ~/.zshrc')}`);
  console.log('');
  console.log(chalk.dim('Quick apply (current session only):'));
  console.log(`  ${chalk.cyan(`export CLAUDE_THEME="${theme}"`)}`);
  console.log('');
}
