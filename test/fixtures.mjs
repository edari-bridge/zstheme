// Shared fixture factory for renderer tests
import { initColors } from '../src/renderer/colors.js';

export const SAMPLE_JSON_INPUT = JSON.stringify({
  model: { display_name: 'Claude Sonnet 4' },
  workspace: { current_dir: '/home/user/projects/myapp' },
  context_window: { used_percentage: 25 },
  cost: {
    total_duration_ms: 180000,
    total_lines_added: 42,
    total_lines_removed: 7,
  },
});

export function createMockGit(overrides = {}) {
  return {
    isGitRepo: true,
    branch: 'main',
    worktree: 'myapp',
    added: 3,
    modified: 1,
    deleted: 0,
    ahead: 2,
    behind: 0,
    ...overrides,
  };
}

export function createMockData(overrides = {}) {
  return {
    model: 'Claude Sonnet 4',
    dir: '/home/user/projects/myapp',
    dirName: 'myapp',
    contextPct: 25,
    sessionDurationMs: 180000,
    sessionDurationMin: 3,
    linesAdded: 42,
    linesRemoved: 7,
    themeName: '2line',
    burnRate: null,
    rateTimeLeft: null,
    rateResetTime: null,
    rateLimitPct: null,
    ...overrides,
  };
}

export function createMockCtx(overrides = {}) {
  const colorMode = overrides.colorMode || 'pastel';
  const iconMode = overrides.iconMode || 'emoji';
  const animationMode = overrides.animationMode || 'static';
  const data = createMockData(overrides.data);
  const git = createMockGit(overrides.git);
  const colors = initColors(colorMode, iconMode, data.contextPct, animationMode);

  return {
    colors,
    colorMode,
    iconMode,
    animationMode,
    colorOffset: overrides.colorOffset ?? 0,
    bgOffset: overrides.bgOffset ?? 0,
    data,
    git,
    ...overrides,
    // Re-apply computed fields that overrides shouldn't clobber
    colors: overrides.colors || initColors(colorMode, iconMode, data.contextPct, animationMode),
  };
}
