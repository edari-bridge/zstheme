import chalk from 'chalk';
import { getAllThemes, getCurrentTheme, getThemesByLayout } from '../utils/themes.js';
import { LAYOUTS } from '../utils/config.js';

export function cmdList() {
  const current = getCurrentTheme();

  console.log('');
  console.log(chalk.bold('Available themes (90 combinations):'));
  console.log(chalk.dim('Format: [mono-|custom-][lsd-|rainbow-]{layout}[-nerd]'));
  console.log('');

  const grouped = getThemesByLayout();

  for (const layout of LAYOUTS) {
    console.log(`  ${chalk.magenta(layout + ':')}`);

    for (const theme of grouped[layout]) {
      if (theme === current) {
        console.log(`    ${chalk.green('* ' + chalk.bold(theme))}`);
      } else {
        console.log(`      ${chalk.cyan(theme)}`);
      }
    }
  }

  console.log('');
  console.log(chalk.dim(`Current: ${chalk.green(current)}`));
  console.log(chalk.dim(`Set theme: ${chalk.cyan('export CLAUDE_THEME=<name>')}`));
  console.log('');
}
