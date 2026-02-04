import chalk from 'chalk';
import { getAllThemes } from '../utils/themes.js';
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
  'lsd-2line',
  'rainbow-2line',
  'mono-2line-nerd',
];

/**
 * 테마 필터링
 */
function filterThemes(themes, filters) {
  return themes.filter(theme => {
    // 레이아웃 필터
    if (filters.layout) {
      const layoutMatch = theme.match(/(1line|2line|card|bars|badges)/);
      if (!layoutMatch || layoutMatch[1] !== filters.layout) return false;
    }

    // 색상 필터
    if (filters.color === 'mono' && !theme.startsWith('mono-')) return false;
    if (filters.color === 'custom' && !theme.startsWith('custom-')) return false;

    // 애니메이션 필터
    if (filters.animation === 'lsd' && !theme.includes('lsd-')) return false;
    if (filters.animation === 'rainbow' && !theme.includes('rainbow-')) return false;

    // 아이콘 필터
    if (filters.icon === 'nerd' && !theme.endsWith('-nerd')) return false;

    return true;
  });
}

export function cmdPreview(showAll = false, filters = {}) {
  let themes = showAll ? getAllThemes() : SAMPLE_THEMES;

  // 필터 적용
  const hasFilters = filters.layout || filters.color || filters.animation || filters.icon;
  if (hasFilters) {
    themes = filterThemes(getAllThemes(), filters);
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
