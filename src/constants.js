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
export const GRID_VISIBLE_ROWS = 3;

// Model pricing map (USD per 1M tokens)
// Source: https://platform.claude.com/docs/en/about-claude/pricing
const PRICING_MAP = {
  'claude-opus-4-6':   { input: 5, output: 25, cacheRead: 0.50, cacheCreate: 6.25 },
  'claude-opus-4-5':   { input: 5, output: 25, cacheRead: 0.50, cacheCreate: 6.25 },
  'claude-opus-4-1':   { input: 15, output: 75, cacheRead: 1.50, cacheCreate: 18.75 },
  'claude-opus-4':     { input: 15, output: 75, cacheRead: 1.50, cacheCreate: 18.75 },
  'claude-sonnet-4-5': { input: 3, output: 15, cacheRead: 0.30, cacheCreate: 3.75 },
  'claude-sonnet-4':   { input: 3, output: 15, cacheRead: 0.30, cacheCreate: 3.75 },
  'claude-haiku-4-5':  { input: 1, output: 5, cacheRead: 0.10, cacheCreate: 1.25 },
  'claude-haiku-3-5':  { input: 0.80, output: 4, cacheRead: 0.08, cacheCreate: 1 },
  'claude-haiku-3':    { input: 0.25, output: 1.25, cacheRead: 0.03, cacheCreate: 0.30 },
};

const DEFAULT_PRICING = PRICING_MAP['claude-opus-4-6'];

// Model ID → display name (e.g. 'claude-opus-4-6' → 'Opus 4.6')
export function getModelDisplayName(modelId) {
  if (!modelId) return 'Unknown';
  const stripped = modelId.replace(/^claude-/, '').replace(/-\d{8}$/, '');
  const parts = stripped.split('-');
  const family = parts[0]?.charAt(0).toUpperCase() + parts[0]?.slice(1);
  const version = parts.slice(1).join('.');
  return version ? `${family} ${version}` : family;
}

// Model ID → pricing object
export function getModelPricing(modelId) {
  if (!modelId) return DEFAULT_PRICING;
  const key = Object.keys(PRICING_MAP)
    .filter(k => modelId.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return key ? PRICING_MAP[key] : DEFAULT_PRICING;
}

// Model priority (newest first)
const MODEL_PRIORITY = Object.keys(PRICING_MAP);

// Aggregate all models: sum tokens + calculate costs per model's own pricing
export function aggregateModelUsage(modelUsage) {
  const totals = {
    inputTokens: 0, outputTokens: 0, cacheRead: 0, cacheCreate: 0,
    inputCost: 0, outputCost: 0, cacheReadCost: 0, cacheCreateCost: 0, cost: 0,
  };

  if (!modelUsage) return totals;

  for (const [id, usage] of Object.entries(modelUsage)) {
    const input = usage.inputTokens || 0;
    const output = usage.outputTokens || 0;
    const cRead = usage.cacheReadInputTokens || 0;
    const cCreate = usage.cacheCreationInputTokens || 0;
    const pricing = getModelPricing(id);

    totals.inputTokens += input;
    totals.outputTokens += output;
    totals.cacheRead += cRead;
    totals.cacheCreate += cCreate;

    const ic = (input / 1e6) * pricing.input;
    const oc = (output / 1e6) * pricing.output;
    const crc = (cRead / 1e6) * pricing.cacheRead;
    const ccc = (cCreate / 1e6) * pricing.cacheCreate;
    totals.inputCost += ic;
    totals.outputCost += oc;
    totals.cacheReadCost += crc;
    totals.cacheCreateCost += ccc;
    totals.cost += ic + oc + crc + ccc;
  }

  return totals;
}

// Find latest model name from stats-cache modelUsage
export function getLatestModelName(modelUsage) {
  if (!modelUsage || Object.keys(modelUsage).length === 0) return 'Unknown';

  const userModelIds = Object.keys(modelUsage);
  for (const prefix of MODEL_PRIORITY) {
    const match = userModelIds.find(id => id.startsWith(prefix));
    if (match) return getModelDisplayName(match);
  }
  return getModelDisplayName(userModelIds[0]);
}

// Format utilities
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

export function formatCurrency(num) {
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
