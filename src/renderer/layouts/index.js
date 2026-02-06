// Layout dispatcher
import { render as renderOneline } from './oneline.js';
import { render as renderTwoline } from './twoline.js';
import { render as renderCard } from './card.js';
import { render as renderBars } from './bars.js';
import { render as renderBadges } from './badges.js';

const LAYOUTS = {
  '1line': renderOneline,
  '2line': renderTwoline,
  'card': renderCard,
  'bars': renderBars,
  'badges': renderBadges,
};

export function renderLayout(layoutName, ctx) {
  const renderer = LAYOUTS[layoutName];
  if (!renderer) {
    return LAYOUTS['badges'](ctx);
  }
  return renderer(ctx);
}
