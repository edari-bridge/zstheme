import { readFileSync, existsSync } from 'fs';
import { PATHS } from './config.js';
import {
  LAYOUTS,
  COLOR_MODES,
  ICON_MODES,
  getAllAnimations,
  parseThemeContract,
  isValidTheme as isValidThemeContract,
} from './themeContract.js';

/**
 * 모든 테마 조합 생성
 * @param {boolean} includeHidden - 숨겨진 애니메이션 포함 여부
 */
export function getAllThemes(includeHidden = false) {
  const themes = [];
  const animations = getAllAnimations(includeHidden);

  for (const color of COLOR_MODES) {
    for (const anim of animations) {
      // custom 색상은 static 조합만 허용
      if (color === 'custom-' && anim !== '') continue;

      for (const layout of LAYOUTS) {
        for (const icon of ICON_MODES) {
          themes.push(`${color}${anim}${layout}${icon}`);
        }
      }
    }
  }

  return themes;
}

/**
 * 테마 유효성 검사
 */
export function isValidTheme(theme, options = {}) {
  return isValidThemeContract(theme, options);
}

/**
 * 현재 설정된 테마 가져오기
 */
export function getCurrentTheme() {
  if (!existsSync(PATHS.themeConfig)) {
    return '2line';
  }

  try {
    const content = readFileSync(PATHS.themeConfig, 'utf-8');
    const match = content.match(/CLAUDE_THEME="([^"]+)"/);
    return match ? match[1] : '2line';
  } catch {
    return '2line';
  }
}

/**
 * 테마 설명 생성
 */
export function getThemeDescription(theme) {
  const parsed = parseThemeName(theme);
  const parts = [];

  const layoutMap = {
    '1line': 'Compact',
    '2line': 'Classic',
    card: 'Boxed',
    bars: 'Grouped bars',
    badges: 'Individual badges',
  };
  parts.push(layoutMap[parsed.layout] || parsed.layout);

  parts.push(parsed.color);

  if (parsed.animation !== 'static') {
    parts.push(parsed.animation);
  }

  if (parsed.icon === 'nerd') {
    parts.push('(Nerd Font)');
  }

  return parts.join(' ');
}

/**
 * 테마를 레이아웃별로 그룹핑
 */
export function getThemesByLayout(includeHidden = false) {
  const grouped = {};

  for (const layout of LAYOUTS) {
    grouped[layout] = getAllThemes(includeHidden).filter(theme => parseThemeName(theme).layout === layout);
  }

  return grouped;
}

/**
 * 테마 필터링
 */
export function filterThemes(themes, filters) {
  return themes.filter(theme => {
    const parsed = parseThemeName(theme);

    if (filters.layout && parsed.layout !== filters.layout) return false;
    if (filters.color && parsed.color !== filters.color) return false;
    if (filters.animation && parsed.animation !== filters.animation) return false;
    if (filters.icon && parsed.icon !== filters.icon) return false;

    return true;
  });
}

/**
 * 테마 정렬 (Smart Sorting)
 * Layout -> Style -> Icon
 * @param {string[]} themes - 테마 목록
 * @param {boolean} isLsdMode - LSD 모드 여부
 */
export function sortThemes(themes, isLsdMode = false) {
  const layoutOrder = ['1line', '2line', 'badges', 'bars', 'card'];
  const normalOrder = ['static', 'rainbow', 'lsd', 'plasma', 'neon', 'noise'];
  const lsdOrder = ['lsd', 'static', 'rainbow', 'plasma', 'neon', 'noise'];

  const getAnimationWeight = (animation) => {
    const order = isLsdMode ? lsdOrder : normalOrder;
    const idx = order.indexOf(animation);
    return idx === -1 ? 50 : idx;
  };

  return [...themes].sort((a, b) => {
    const infoA = parseThemeName(a);
    const infoB = parseThemeName(b);

    const layoutIdxA = layoutOrder.indexOf(infoA.layout);
    const layoutIdxB = layoutOrder.indexOf(infoB.layout);
    const safeLayoutA = layoutIdxA === -1 ? 99 : layoutIdxA;
    const safeLayoutB = layoutIdxB === -1 ? 99 : layoutIdxB;

    if (safeLayoutA !== safeLayoutB) return safeLayoutA - safeLayoutB;

    const colorWeightA = infoA.color === 'custom' ? 99 : (infoA.color === 'mono' ? 10 : 0);
    const colorWeightB = infoB.color === 'custom' ? 99 : (infoB.color === 'mono' ? 10 : 0);
    if (colorWeightA !== colorWeightB) return colorWeightA - colorWeightB;

    const animationWeightA = getAnimationWeight(infoA.animation);
    const animationWeightB = getAnimationWeight(infoB.animation);
    if (animationWeightA !== animationWeightB) return animationWeightA - animationWeightB;

    if (infoA.icon !== infoB.icon) return infoA.icon === 'emoji' ? -1 : 1;

    return a.localeCompare(b);
  });
}

/**
 * 테마명 파싱
 */
export function parseThemeName(themeName) {
  const parsed = parseThemeContract(themeName);

  return {
    color: parsed.color,
    animation: parsed.animation,
    layout: parsed.layout || '2line',
    icon: parsed.icon,
  };
}
