import { readFileSync, existsSync } from 'fs';
import { PATHS, LAYOUTS, COLOR_MODES, ANIMATION_MODES, HIDDEN_ANIMATION_MODES, ICON_MODES } from './config.js';

/**
 * 모든 테마 조합 생성
 * @param {boolean} includeHidden - 숨겨진 테마(lsd) 포함 여부
 */
export function getAllThemes(includeHidden = false) {
  const themes = [];
  const animations = includeHidden
    ? [...ANIMATION_MODES, ...HIDDEN_ANIMATION_MODES]
    : ANIMATION_MODES;

  for (const color of COLOR_MODES) {
    for (const anim of animations) {
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
export function isValidTheme(theme) {
  // 색상 모드는 pastel(기본)/mono/custom 중 택일
  const pattern = /^(custom-|mono-)?(lsd-|rainbow-)?(1line|2line|card|bars|badges)(-nerd)?$/;
  return pattern.test(theme);
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
  const parts = [];

  // 레이아웃
  if (theme.includes('1line')) parts.push('Compact');
  else if (theme.includes('2line')) parts.push('Classic');
  else if (theme.includes('card')) parts.push('Boxed');
  else if (theme.includes('bars')) parts.push('Grouped bars');
  else if (theme.includes('badges')) parts.push('Individual badges');

  // 색조 (pastel/mono/custom 중 택일)
  if (theme.startsWith('mono-')) parts.push('mono');
  else if (theme.startsWith('custom-')) parts.push('custom');
  else parts.push('pastel');

  // 애니메이션
  if (theme.includes('lsd-')) parts.push('lsd');
  else if (theme.includes('rainbow-')) parts.push('rainbow');

  // 아이콘
  if (theme.endsWith('-nerd')) parts.push('(Nerd Font)');

  return parts.join(' ');
}

/**
 * 테마를 레이아웃별로 그룹핑
 */
export function getThemesByLayout() {
  const grouped = {};

  for (const layout of LAYOUTS) {
    grouped[layout] = getAllThemes().filter(theme => {
      const base = theme.replace(/^(custom-)?(mono-)?(lsd-|rainbow-)?/, '').replace(/-nerd$/, '');
      return base === layout;
    });
  }

  return grouped;
}

/**
 * 테마 필터링
 */
export function filterThemes(themes, filters) {
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



/**
 * 테마 정렬 (Smart Sorting)
 * Layout -> Style (Priority List) -> Icon
 */
export function sortThemes(themes) {
  // User defined Layout Order: 1line, 2line, Badges, Bars, Card
  const LAYOUT_ORDER = ['1line', '2line', 'badges', 'bars', 'card'];

  return themes.sort((a, b) => {
    const infoA = parseThemeName(a);
    const infoB = parseThemeName(b);

    // 1. Layout Priority
    const layoutIdxA = LAYOUT_ORDER.indexOf(infoA.layout);
    const layoutIdxB = LAYOUT_ORDER.indexOf(infoB.layout);

    // If layout is not in the list (shouldn't happen for known layouts), put it at the end
    const safeLayoutA = layoutIdxA === -1 ? 99 : layoutIdxA;
    const safeLayoutB = layoutIdxB === -1 ? 99 : layoutIdxB;

    if (safeLayoutA !== safeLayoutB) return safeLayoutA - safeLayoutB;

    // 2. Style Priority (Detailed User Request)
    // Order: Default -> Nerd -> Mono -> Nerd Mono -> Rainbow -> Mono Rainbow -> Custom
    const getStyleWeight = (info) => {
      const isNerd = info.icon === 'nerd';

      if (info.color === 'custom') return 99; // Custom at the end

      // 1. Default (Pastel, Static, Emoji)
      if (info.color === 'pastel' && info.animation === 'static' && !isNerd) return 0;

      // 2. Nerd (Pastel, Static, Nerd)
      if (info.color === 'pastel' && info.animation === 'static' && isNerd) return 1;

      // 3. Mono (Mono, Static, Emoji)
      if (info.color === 'mono' && info.animation === 'static' && !isNerd) return 2;

      // 4. Nerd Mono (Mono, Static, Nerd)
      if (info.color === 'mono' && info.animation === 'static' && isNerd) return 3;

      // 5. Rainbow (Rainbow, Emoji) - (Grouping Rainbow Nerd here too closely? User didn't specify rainbow nerd separately)
      // Let's assume Rainbow generally.
      if (info.animation === 'rainbow' && info.color === 'pastel') {
        // If we want Rainbow Nerd after Rainbow Emoji, use decimal or sub-sort
        return isNerd ? 4.5 : 4;
      }

      // 6. Mono Rainbow
      if (info.animation === 'rainbow' && info.color === 'mono') {
        return isNerd ? 5.5 : 5;
      }

      return 10; // Other variants
    };

    const styleA = getStyleWeight(infoA);
    const styleB = getStyleWeight(infoB);

    if (styleA !== styleB) return styleA - styleB;

    // 3. Tie breaker (shouldn't be reached if logic covers all)
    return a.localeCompare(b);
  });
}

/**
 * 테마명 파싱
 */
export function parseThemeName(themeName) {
  let name = themeName;
  const result = {
    color: 'pastel',
    animation: 'static',
    layout: '2line',
    icon: 'emoji',
  };

  // 색상 모드 (pastel/mono/custom 중 택일)
  if (name.startsWith('custom-')) {
    result.color = 'custom';
    name = name.slice(7);
  } else if (name.startsWith('mono-')) {
    result.color = 'mono';
    name = name.slice(5);
  }

  // lsd- 또는 rainbow- 접두사
  if (name.startsWith('lsd-')) {
    result.animation = 'lsd';
    name = name.slice(4);
  } else if (name.startsWith('rainbow-')) {
    result.animation = 'rainbow';
    name = name.slice(8);
  }

  // -nerd 접미사
  if (name.endsWith('-nerd')) {
    result.icon = 'nerd';
    name = name.slice(0, -5);
  }

  // 레이아웃
  if (LAYOUTS.includes(name)) {
    result.layout = name;
  }

  return result;
}
