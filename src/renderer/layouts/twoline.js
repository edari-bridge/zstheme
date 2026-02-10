// 2line layout (ported from 2line.sh)
import { renderText, formatGitStatus, formatGitSync, formatContext, isAnimated } from '../helpers.js';
import { colorizeText, colorizeFgSparkle } from '../animation.js';
import { getRateColor } from '../colors.js';

export function render(ctx) {
  const { colors, data, git } = ctx;

  // Line 1: Git info + context
  const line1Parts = [];
  line1Parts.push(renderText(colors.C_I_BRANCH, colors.icons.BRANCH, git.branch || 'branch', colors.C_BRANCH, 0, ctx));
  line1Parts.push(renderText(colors.C_I_TREE, colors.icons.TREE, git.worktree || 'worktree', colors.C_TREE, 3, ctx));
  line1Parts.push(renderText(colors.C_I_DIR, colors.icons.DIR, data.dirName, colors.C_DIR, 6, ctx));

  if (git.isGitRepo) {
    line1Parts.push(formatGitStatus('  ', ctx));
    line1Parts.push(formatGitSync('  ', ctx));
  } else {
    line1Parts.push(`${colors.C_DIM_STATUS}${colors.icons.GIT_STATUS} status${colors.RST}`);
    line1Parts.push(`${colors.C_DIM_SYNC}${colors.icons.SYNC} sync${colors.RST}`);
  }

  line1Parts.push(formatContext(ctx));

  // Line 2: Session info + theme
  const line2Parts = [];
  line2Parts.push(renderText(colors.C_I_MODEL, colors.icons.MODEL, data.model, colors.C_MODEL, 9, ctx));

  if (data.rateTimeLeft && data.rateResetTime && (data.rateLimitPct || data.rateLimitPct === 0)) {
    if (ctx.animationMode === 'lsd') {
      line2Parts.push(`${colors.C_I_RATE}${colors.icons.TIME}${colors.RST} ${colorizeFgSparkle(`${data.rateTimeLeft} \u00b7 ${data.rateResetTime} (${data.rateLimitPct}%)`, 10, ctx.bgOffset, ctx.colorMode)}`);
    } else if (isAnimated(ctx.animationMode)) {
      line2Parts.push(`${colors.C_I_RATE}${colors.icons.TIME}${colors.RST} ${colorizeText(`${data.rateTimeLeft} \u00b7 ${data.rateResetTime} (${data.rateLimitPct}%)`, 10, ctx.colorOffset, ctx.animationMode, ctx.colorMode)}`);
    } else {
      const rateColor = getRateColor(data.rateLimitPct, ctx.colorMode, colors);
      line2Parts.push(`${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}${data.rateTimeLeft} \u00b7 ${data.rateResetTime} (${rateColor}${data.rateLimitPct}%${colors.C_RATE})${colors.RST}`);
    }
  } else if (data.rateLimitPct) {
    if (ctx.animationMode === 'lsd') {
      line2Parts.push(`${colors.C_I_RATE}${colors.icons.TIME}${colors.RST} ${colorizeFgSparkle(`(${data.rateLimitPct}%)`, 10, ctx.bgOffset, ctx.colorMode)}`);
    } else if (isAnimated(ctx.animationMode)) {
      line2Parts.push(`${colors.C_I_RATE}${colors.icons.TIME}${colors.RST} ${colorizeText(`(${data.rateLimitPct}%)`, 10, ctx.colorOffset, ctx.animationMode, ctx.colorMode)}`);
    } else {
      const rateColor = getRateColor(data.rateLimitPct, ctx.colorMode, colors);
      line2Parts.push(`${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}(${rateColor}${data.rateLimitPct}%${colors.C_RATE})${colors.RST}`);
    }
  }

  line2Parts.push(renderText(colors.C_I_TIME, colors.icons.SESSION, `${data.sessionDurationMin}m`, colors.C_TIME, 20, ctx));

  if (data.burnRate) {
    line2Parts.push(renderText(colors.C_I_BURN, colors.icons.COST, data.burnRate, colors.C_BURN, 30, ctx));
  }

  if (isAnimated(ctx.animationMode)) {
    line2Parts.push(`${colors.C_I_THEME}${colors.icons.THEME}${colors.RST} ${colorizeText(data.themeName, 5, ctx.colorOffset, ctx.animationMode, ctx.colorMode)}`);
  } else {
    line2Parts.push(`${colors.C_I_THEME}${colors.icons.THEME} ${colors.C_I_THEME}${data.themeName}${colors.RST}`);
  }

  const line1 = line1Parts.join('    ');
  const line2 = line2Parts.join('     ');

  return `${line1}\n${line2}`;
}
