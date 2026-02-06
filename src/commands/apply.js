import chalk from 'chalk';
import path from 'path';
import { isValidTheme } from '../utils/themes.js';
import { saveThemeToShellConfig } from '../utils/shell.js';

export function cmdApply(theme) {
  if (!isValidTheme(theme)) {
    console.log(chalk.bold('Error:') + ` Theme '${theme}' not found.`);
    console.log('');
    console.log('Theme format: [mono-|custom-][lsd-|rainbow-]{layout}[-nerd]');
    console.log('  Layouts: 1line, 2line, card, bars, badges');
    console.log('  Examples: lsd-bars, rainbow-badges, mono-card-nerd');
    console.log('');
    console.log(`Run '${chalk.cyan('zstheme --list')}' to see all available themes.`);
    process.exit(1);
  }

  let configPath = '';
  try {
    configPath = saveThemeToShellConfig(theme);
  } catch (error) {
    console.log('');
    console.log(chalk.red('Failed to save theme configuration.'));
    console.log(chalk.dim(error.message));
    console.log('');
    process.exit(1);
  }
  const configName = path.basename(configPath);

  console.log('');
  console.log(chalk.green(`Theme '${chalk.bold(theme)}' saved to ~/${configName}`));
  console.log('');
  console.log('To apply now, run:');
  console.log(`  ${chalk.cyan(`source ~/${configName}`)}`);
  console.log('');
  console.log(chalk.dim('Or restart your terminal / Claude Code.'));
  console.log('');
}
