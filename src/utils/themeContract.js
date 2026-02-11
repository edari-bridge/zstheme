export const LAYOUTS = ['1line', '2line', 'badges', 'bars', 'card'];

export const COLOR_MODES = ['', 'mono-', 'custom-'];
export const ANIMATION_MODES = ['', 'rainbow-'];
export const HIDDEN_ANIMATION_MODES = ['lsd-'];
export const ICON_MODES = ['', '-nerd'];

const ALL_ANIMATIONS = [...ANIMATION_MODES, ...HIDDEN_ANIMATION_MODES];

// 독립 테마: contract 네이밍 규칙을 따르지 않는 특수 테마
// 독립 테마: contract 네이밍 규칙을 따르지 않는 특수 테마
export const STANDALONE_THEMES = {
  'p.lsd-bars': { color: 'pastel', animation: 'p.lsd', layout: 'bars', icon: 'emoji', hidden: true },
  'p.lsd-bars-nerd': { color: 'pastel', animation: 'p.lsd', layout: 'bars', icon: 'nerd', hidden: true },
  'p.lsd-badges': { color: 'pastel', animation: 'p.lsd', layout: 'badges', icon: 'emoji', hidden: true },
  'p.lsd-badges-nerd': { color: 'pastel', animation: 'p.lsd', layout: 'badges', icon: 'nerd', hidden: true },
};

function stripColorPrefix(themeName) {
  if (themeName.startsWith('custom-')) return { color: 'custom', rest: themeName.slice(7) };
  if (themeName.startsWith('mono-')) return { color: 'mono', rest: themeName.slice(5) };
  return { color: 'pastel', rest: themeName };
}

function stripAnimationPrefix(themeName) {
  const prefixes = ['lsd-', 'rainbow-'];
  for (const prefix of prefixes) {
    if (themeName.startsWith(prefix)) {
      return { animation: prefix.slice(0, -1), rest: themeName.slice(prefix.length) };
    }
  }
  return { animation: 'static', rest: themeName };
}

export function parseThemeContract(themeName) {
  // 독립 테마 우선 확인
  if (STANDALONE_THEMES[themeName]) {
    const { hidden, ...meta } = STANDALONE_THEMES[themeName];
    return meta;
  }

  let name = themeName;
  let icon = 'emoji';

  if (name.endsWith('-nerd')) {
    icon = 'nerd';
    name = name.slice(0, -5);
  }

  const { color, rest: afterColor } = stripColorPrefix(name);
  const { animation, rest: afterAnimation } = stripAnimationPrefix(afterColor);

  return {
    color,
    animation,
    layout: LAYOUTS.includes(afterAnimation) ? afterAnimation : null,
    icon,
  };
}

export function isValidTheme(themeName, { includeHidden = true } = {}) {
  if (STANDALONE_THEMES[themeName]) {
    return includeHidden || !STANDALONE_THEMES[themeName].hidden;
  }

  const parsed = parseThemeContract(themeName);
  if (!parsed.layout) return false;

  if (parsed.animation === 'static') return true;

  const animationPrefix = `${parsed.animation}-`;
  const allowedAnimations = includeHidden ? ALL_ANIMATIONS : ANIMATION_MODES;
  return allowedAnimations.includes(animationPrefix);
}

export function getAllAnimations(includeHidden = false) {
  return includeHidden ? ALL_ANIMATIONS : ANIMATION_MODES;
}
