// 1line layout (ported from 1line.sh)
import { renderText, formatGitStatus, formatGitSync, formatContext, isAnimated } from '../helpers.js';
import { getRateColor } from '../colors.js';

export function render(ctx) {
  const { colors, data, git } = ctx;
  const parts = [];

  parts.push(renderText(colors.C_I_BRANCH, colors.icons.BRANCH, git.branch || 'branch', colors.C_BRANCH, 0, ctx));
  parts.push(renderText(colors.C_I_TREE, colors.icons.TREE, git.worktree || 'worktree', colors.C_TREE, 3, ctx));
  parts.push(renderText(colors.C_I_DIR, colors.icons.DIR, data.dirName, colors.C_DIR, 6, ctx));

  if (git.isGitRepo) {
    parts.push(formatGitStatus(' ', ctx));
    parts.push(formatGitSync(' ', ctx));
  } else {
    parts.push(`${colors.C_DIM_STATUS}${colors.icons.GIT_STATUS} status${colors.RST}`);
    parts.push(`${colors.C_DIM_SYNC}${colors.icons.SYNC} sync${colors.RST}`);
  }

  parts.push(renderText(colors.C_I_MODEL, colors.icons.MODEL, data.model, colors.C_MODEL, 9, ctx));
  parts.push(formatContext(ctx));

  if (data.rateTimeLeft && data.rateLimitPct) {
    const rateColor = getRateColor(data.rateLimitPct, ctx.colorMode);
    parts.push(`${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}${data.rateTimeLeft} (${rateColor}${data.rateLimitPct}%${colors.C_RATE})${colors.RST}`);
  }

  return parts.join('  ');
}
