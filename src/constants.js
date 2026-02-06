// Centralized constants for zstheme

// Re-export from config.js
export { VERSION, LAYOUTS, PATHS } from './utils/config.js';

// Icons (moved from colors.js)
export { ICONS } from './utils/colors.js';

// UI animation
export const LSD_COLORS = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan'];
export const ANIMATION_INTERVAL = 100;
export const EASTER_EGG_TRIGGER_COUNT = 3;

// Grid constants (ThemeSelector)
export const GRID_COLUMNS = 3;
export const GRID_VISIBLE_ROWS = 6;

// Opus 4.5 pricing (USD per 1M tokens)
export const PRICING = {
  input: 15,
  output: 75,
  cacheRead: 1.875,
  cacheCreate: 18.75,
};

// Model ID for stats lookup
export const MODEL_ID = 'claude-opus-4-5-20251101';

// Format utilities
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

export function formatCurrency(num) {
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
