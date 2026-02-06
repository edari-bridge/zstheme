export const LAYOUTS = ['1line', '2line', 'card', 'bars', 'badges'];

export const COLOR_MODES = ['', 'mono-', 'custom-'];
export const ANIMATION_MODES = ['', 'rainbow-'];
export const HIDDEN_ANIMATION_MODES = ['lsd-'];
export const ICON_MODES = ['', '-nerd'];

const ALL_ANIMATIONS = [...ANIMATION_MODES, ...HIDDEN_ANIMATION_MODES];

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
