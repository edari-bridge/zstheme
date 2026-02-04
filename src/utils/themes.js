import { readFileSync, existsSync } from 'fs';
import { PATHS, LAYOUTS, COLOR_MODES, ANIMATION_MODES, ICON_MODES } from './config.js';

/**
 * 모든 테마 조합 생성 (60개)
 */
export function getAllThemes() {
  const themes = [];

  for (const color of COLOR_MODES) {
    for (const anim of ANIMATION_MODES) {
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
