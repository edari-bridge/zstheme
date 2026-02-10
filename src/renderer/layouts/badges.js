// Badges layout (ported from badges.sh)
import { colorizeText, colorizeBgSparkle, getAnimatedBadgeBg } from '../animation.js';
import { applyAnimation, formatContext, isAnimated, makeChip } from '../helpers.js';
import { getRateColor } from '../colors.js';

export function render(ctx) {
  const { colors, data, git, animationMode, colorMode, colorOffset, bgOffset } = ctx;
  const chipStyle = process.env.CHIP_STYLE || 'badge';
  const RST = colors.RST;

  // Context background
  let bgCtx;
  if (data.contextPct >= 70) bgCtx = colors.C_BG_CTX_CRIT;
  else if (data.contextPct >= 50) bgCtx = colors.C_BG_CTX_WARN;
  else bgCtx = colors.C_BG_CTX;

  // Badge backgrounds
  let bgBranch, bgTree, bgDir, bgStatus, bgSync, bgModel, bgRate, bgTime, bgBurn;
  if (isAnimated(animationMode)) {
    bgBranch = getAnimatedBadgeBg(0, bgOffset, animationMode, colorMode);
    bgTree = getAnimatedBadgeBg(1, bgOffset, animationMode, colorMode);
    bgDir = getAnimatedBadgeBg(2, bgOffset, animationMode, colorMode);
    bgStatus = getAnimatedBadgeBg(3, bgOffset, animationMode, colorMode);
    bgSync = getAnimatedBadgeBg(4, bgOffset, animationMode, colorMode);
    bgModel = getAnimatedBadgeBg(5, bgOffset, animationMode, colorMode);
    bgRate = getAnimatedBadgeBg(6, bgOffset, animationMode, colorMode);
    bgTime = getAnimatedBadgeBg(7, bgOffset, animationMode, colorMode);
    bgBurn = getAnimatedBadgeBg(8, bgOffset, animationMode, colorMode);
  } else {
    bgBranch = colors.C_BG_BRANCH; bgTree = colors.C_BG_TREE; bgDir = colors.C_BG_DIR;
    bgStatus = colors.C_BG_STATUS; bgSync = colors.C_BG_SYNC; bgModel = colors.C_BG_MODEL;
    bgRate = colors.C_BG_RATE; bgTime = colors.C_BG_TIME; bgBurn = colors.C_BG_BURN;
  }

  // === Line 1 chips ===
  let chipBranch, chipTree, chipDir, chipStatus, chipSync;

  chipBranch = applyAnimation(ctx, { type: 'bg_chip', text: git.branch || 'branch', offset: 0, iconColor: colors.C_I_BRANCH, icon: colors.icons.BRANCH, bgColor: bgBranch, textColor: colors.C_BRANCH });
  chipTree = applyAnimation(ctx, { type: 'bg_chip', text: git.worktree || 'worktree', offset: 10, iconColor: colors.C_I_TREE, icon: colors.icons.TREE, bgColor: bgTree, textColor: colors.C_TREE });
  chipDir = applyAnimation(ctx, { type: 'bg_chip', text: data.dirName, offset: 20, iconColor: colors.C_I_DIR, icon: colors.icons.DIR, bgColor: bgDir, textColor: colors.C_DIR });

  // Git status + sync
  if (git.isGitRepo) {
    if (isAnimated(animationMode)) {
      const add = git.added > 0 ? `+${git.added}` : '+0';
      const mod = git.modified > 0 ? `~${git.modified}` : '~0';
      const del = git.deleted > 0 ? `-${git.deleted}` : '-0';
      const ahead = git.ahead > 0 ? `\u2191 ${git.ahead}` : '\u2191 0';
      const behind = git.behind > 0 ? `\u2193 ${git.behind}` : '\u2193 0';
      chipStatus = applyAnimation(ctx, { type: 'bg_chip', text: `${add} ${mod} ${del}`, offset: 30, iconColor: colors.C_I_STATUS, icon: colors.icons.GIT_STATUS, bgColor: bgStatus, textColor: '' });
      chipSync = applyAnimation(ctx, { type: 'bg_chip', text: `${ahead} ${behind}`, offset: 40, iconColor: colors.C_I_SYNC, icon: colors.icons.SYNC, bgColor: bgSync, textColor: '' });
    } else {
      const addS = git.added > 0 ? `${colors.C_BRIGHT_STATUS}+${git.added}` : `${colors.C_DIM_STATUS}+0`;
      const modS = git.modified > 0 ? `${colors.C_BRIGHT_STATUS}~${git.modified}` : `${colors.C_DIM_STATUS}~0`;
      const delS = git.deleted > 0 ? `${colors.C_BRIGHT_STATUS}-${git.deleted}` : `${colors.C_DIM_STATUS}-0`;
      const aheadS = git.ahead > 0 ? `${colors.C_BRIGHT_SYNC}\u2191 ${git.ahead}` : `${colors.C_DIM_SYNC}\u2191 0`;
      const behindS = git.behind > 0 ? `${colors.C_BRIGHT_SYNC}\u2193 ${git.behind}` : `${colors.C_DIM_SYNC}\u2193 0`;
      chipStatus = makeChip(bgStatus, `${colors.C_I_STATUS}${colors.icons.GIT_STATUS}${addS}  ${modS}  ${delS}`, chipStyle, colors);
      chipSync = makeChip(bgSync, `${colors.C_I_SYNC}${colors.icons.SYNC}${aheadS}  ${behindS}`, chipStyle, colors);
    }
  } else {
    chipStatus = makeChip(bgStatus, `${colors.C_DIM_STATUS}${colors.icons.GIT_STATUS} ---`, chipStyle, colors);
    chipSync = makeChip(bgSync, `${colors.C_DIM_SYNC}${colors.icons.SYNC} ---`, chipStyle, colors);
  }

  const chipCtx = formatContext(ctx);
  const line1 = `${chipBranch}    ${chipTree}    ${chipDir}    ${chipStatus}    ${chipSync}    ${chipCtx}`;

  // === Line 2 chips ===
  let chipModel, chipRate, chipTime, chipBurn, chipTheme;

  // Model
  chipModel = applyAnimation(ctx, { type: 'bg_chip', text: data.model, offset: 50, iconColor: colors.C_I_MODEL, icon: colors.icons.MODEL, bgColor: bgModel, textColor: colors.C_MODEL });

  // Rate limit
  if (data.rateTimeLeft && data.rateResetTime && (data.rateLimitPct || data.rateLimitPct === 0)) {
    if (isAnimated(animationMode)) {
      chipRate = applyAnimation(ctx, { type: 'bg_chip', text: `${data.rateTimeLeft}\u00b7${data.rateResetTime} (${data.rateLimitPct}%)`, offset: 60, iconColor: colors.C_I_RATE, icon: colors.icons.TIME, bgColor: bgRate, textColor: '' });
    } else {
      const rateColor = getRateColor(data.rateLimitPct, colorMode, colors);
      chipRate = makeChip(bgRate, `${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}${data.rateTimeLeft}\u00b7${data.rateResetTime} ${rateColor}(${data.rateLimitPct}%)`, chipStyle, colors);
    }
  } else {
    chipRate = '';
  }

  // Session time
  chipTime = applyAnimation(ctx, { type: 'bg_chip', text: `${data.sessionDurationMin}m`, offset: 70, iconColor: colors.C_I_TIME, icon: colors.icons.SESSION, bgColor: bgTime, textColor: colors.C_TIME });

  // Burn rate
  if (data.burnRate) {
    chipBurn = applyAnimation(ctx, { type: 'bg_chip', text: data.burnRate, offset: 80, iconColor: colors.C_I_BURN, icon: colors.icons.COST, bgColor: bgBurn, textColor: colors.C_BURN });
  } else {
    chipBurn = '';
  }

  // Theme
  if (isAnimated(animationMode)) {
    chipTheme = colorizeText(`${colors.icons.THEME} ${data.themeName}`, 0, colorOffset, animationMode, colorMode);
  } else {
    chipTheme = `${colors.C_I_THEME}${colors.icons.THEME} ${colors.C_I_THEME}${data.themeName}${RST}`;
  }

  const line2Chips = [chipModel, chipRate, chipTime, chipBurn].filter(Boolean);
  const line2 = `${line2Chips.join('     ')}     ${chipTheme}`;

  return `${line1}\n${line2}`;
}
