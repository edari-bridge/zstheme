import chalk from 'chalk';
import { getAllThemes, getCurrentTheme, getThemesByLayout, filterThemes } from '../utils/themes.js';
import { LAYOUTS } from '../utils/config.js';

export function cmdList(filters = {}) {
  const current = getCurrentTheme();
  const hasFilters = filters.layout || filters.color || filters.animation || filters.icon;

  // 숨겨진 애니메이션 필터 사용 시 숨겨진 테마 포함
  const hiddenAnimations = new Set(['lsd', 'plasma', 'neon', 'noise']);
  const includeHidden = hiddenAnimations.has(filters.animation);
  let themes = getAllThemes(includeHidden);

  if (hasFilters) {
    themes = filterThemes(themes, filters);
  }

  if (themes.length === 0) {
    console.log('');
    console.log(chalk.yellow('No themes match the filter criteria.'));
    console.log('');
    return;
  }

  console.log('');
  console.log(chalk.bold(`Available themes (${themes.length}):`));
  console.log(chalk.dim('Format: [mono-|custom-][lsd-|rainbow-|plasma-|neon-|noise-]{layout}[-nerd]'));
  console.log('');

  // 레이아웃별 그룹핑
  const grouped = {};
  for (const layout of LAYOUTS) {
    grouped[layout] = themes.filter(theme => {
      const base = theme.replace(/^(custom-|mono-)?(lsd-|rainbow-)?/, '').replace(/-nerd$/, '');
      return base === layout;
    });
  }

  for (const layout of LAYOUTS) {
    if (grouped[layout].length === 0) continue;

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
