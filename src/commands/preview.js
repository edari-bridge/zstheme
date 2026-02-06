import chalk from 'chalk';
import { getAllThemes, filterThemes } from '../utils/themes.js';
import { renderThemePreview } from '../utils/preview.js';

// 기본 샘플 테마
const SAMPLE_THEMES = [
  '1line',
  '1line-nerd',
  '2line',
  '2line-nerd',
  'card',
  'card-nerd',
  'bars',
  'bars-nerd',
  'badges',
  'badges-nerd',
  'rainbow-2line',
  'mono-2line-nerd',
];

export function cmdPreview(showAll = false, filters = {}) {
  // 숨겨진 애니메이션 필터 사용 시 숨겨진 테마 포함
  const hiddenAnimations = new Set(['lsd']);
  const includeHidden = hiddenAnimations.has(filters.animation);
  let themes = showAll ? getAllThemes(includeHidden) : SAMPLE_THEMES;

  // 필터 적용
  const hasFilters = filters.layout || filters.color || filters.animation || filters.icon;
  if (hasFilters) {
    themes = filterThemes(getAllThemes(includeHidden), filters);
  }

  if (themes.length === 0) {
    console.log('');
    console.log(chalk.yellow('No themes match the filter criteria.'));
    console.log('');
    return;
  }

  console.log('');
  console.log(chalk.bold(`Theme Previews (${themes.length}):`));
  console.log('');

  for (const theme of themes) {
    console.log(chalk.yellow(`━━━ ${chalk.bold(theme)} ━━━`));
    const preview = renderThemePreview(theme);
    console.log(preview);
    console.log('');
  }
}
