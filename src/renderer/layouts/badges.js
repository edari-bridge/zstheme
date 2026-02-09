// Badges layout (ported from badges.sh)
import { colorizeText, colorizeBgSparkle, getAnimatedBadgeBg } from '../animation.js';
import { formatContext, isAnimated, makeChip } from '../helpers.js';
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
  let bgBranch, bgTree, bgDir, bgStatus, bgSync, bgModel;
  if (isAnimated(animationMode)) {
    bgBranch = getAnimatedBadgeBg(0, bgOffset, animationMode, colorMode);
    bgTree = getAnimatedBadgeBg(1, bgOffset, animationMode, colorMode);
    bgDir = getAnimatedBadgeBg(2, bgOffset, animationMode, colorMode);
    bgStatus = getAnimatedBadgeBg(3, bgOffset, animationMode, colorMode);
    bgSync = getAnimatedBadgeBg(4, bgOffset, animationMode, colorMode);
    bgModel = getAnimatedBadgeBg(5, bgOffset, animationMode, colorMode);
  } else {
    bgBranch = colors.C_BG_BRANCH; bgTree = colors.C_BG_TREE; bgDir = colors.C_BG_DIR;
    bgStatus = colors.C_BG_STATUS; bgSync = colors.C_BG_SYNC; bgModel = colors.C_BG_MODEL;
  }

  // === Line 1 chips ===
  let chipBranch, chipTree, chipDir, chipStatus, chipSync;

  // Branch
  if (isAnimated(animationMode)) {
    if (animationMode === 'lsd') {
      chipBranch = colorizeBgSparkle(` ${colors.icons.BRANCH} ${git.branch || 'branch'} `, 0, bgOffset, colorMode, '\x1b[30m');
    } else {
      chipBranch = makeChip(colors.C_BG_BRANCH, `${colors.C_I_BRANCH}${colors.icons.BRANCH} ${colorizeText(git.branch || 'branch', 0, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
    }
  } else {
    chipBranch = makeChip(bgBranch, `${colors.C_I_BRANCH}${colors.icons.BRANCH} ${colors.C_BRANCH}${git.branch || 'branch'}`, chipStyle, colors);
  }

  // Worktree
  if (isAnimated(animationMode)) {
    if (animationMode === 'lsd') {
      chipTree = colorizeBgSparkle(` ${colors.icons.TREE} ${git.worktree || 'worktree'} `, 10, bgOffset, colorMode, '\x1b[30m');
    } else {
      chipTree = makeChip(colors.C_BG_TREE, `${colors.C_I_TREE}${colors.icons.TREE} ${colorizeText(git.worktree || 'worktree', 10, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
    }
  } else {
    chipTree = makeChip(bgTree, `${colors.C_I_TREE}${colors.icons.TREE} ${colors.C_TREE}${git.worktree || 'worktree'}`, chipStyle, colors);
  }

  // Directory
  if (isAnimated(animationMode)) {
    if (animationMode === 'lsd') {
      chipDir = colorizeBgSparkle(` ${colors.icons.DIR} ${data.dirName} `, 20, bgOffset, colorMode, '\x1b[30m');
    } else {
      chipDir = makeChip(colors.C_BG_DIR, `${colors.C_I_DIR}${colors.icons.DIR} ${colorizeText(data.dirName, 20, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
    }
  } else {
    chipDir = makeChip(bgDir, `${colors.C_I_DIR}${colors.icons.DIR} ${colors.C_DIR}${data.dirName}`, chipStyle, colors);
  }

  // Git status + sync
  if (git.isGitRepo) {
    const add = git.added > 0 ? `+${git.added}` : '+0';
    const mod = git.modified > 0 ? `~${git.modified}` : '~0';
    const del = git.deleted > 0 ? `-${git.deleted}` : '-0';
    const ahead = git.ahead > 0 ? `\u2191 ${git.ahead}` : '\u2191 0';
    const behind = git.behind > 0 ? `\u2193 ${git.behind}` : '\u2193 0';

    if (isAnimated(animationMode)) {
      if (animationMode === 'lsd') {
        chipStatus = colorizeBgSparkle(` ${colors.icons.GIT_STATUS} ${add} ${mod} ${del} `, 30, bgOffset, colorMode, '\x1b[30m');
        chipSync = colorizeBgSparkle(` ${colors.icons.SYNC} ${ahead} ${behind} `, 40, bgOffset, colorMode, '\x1b[30m');
      } else {
        chipStatus = makeChip(colors.C_BG_STATUS, `${colors.C_I_STATUS}${colors.icons.GIT_STATUS} ${colorizeText(`${add} ${mod} ${del}`, 30, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
        chipSync = makeChip(colors.C_BG_SYNC, `${colors.C_I_SYNC}${colors.icons.SYNC} ${colorizeText(`${ahead} ${behind}`, 40, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
      }
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
  const line1 = `${chipBranch} ${chipTree} ${chipDir}  ${chipStatus} ${chipSync}  ${chipCtx}`;

  // === Line 2 chips ===
  let chipModel, chipRate, chipTime, chipBurn, chipTheme;

  // Model
  if (isAnimated(animationMode)) {
    if (animationMode === 'lsd') {
      chipModel = colorizeBgSparkle(` ${colors.icons.MODEL} ${data.model} `, 50, bgOffset, colorMode, '\x1b[30m');
    } else {
      chipModel = makeChip(colors.C_BG_MODEL, `${colors.C_I_MODEL}${colors.icons.MODEL} ${colorizeText(data.model, 50, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
    }
  } else {
    chipModel = makeChip(bgModel, `${colors.C_I_MODEL}${colors.icons.MODEL} ${colors.C_MODEL}${data.model}`, chipStyle, colors);
  }

  // Rate limit
  if (data.rateTimeLeft && data.rateResetTime && (data.rateLimitPct || data.rateLimitPct === 0)) {
    if (isAnimated(animationMode)) {
      if (animationMode === 'lsd') {
        chipRate = colorizeBgSparkle(` ${colors.icons.TIME} ${data.rateTimeLeft}\u00b7${data.rateResetTime} (${data.rateLimitPct}%) `, 60, bgOffset, colorMode, '\x1b[30m');
      } else {
        chipRate = makeChip(colors.C_BG_RATE, `${colors.C_I_RATE}${colors.icons.TIME} ${colorizeText(`${data.rateTimeLeft}\u00b7${data.rateResetTime} (${data.rateLimitPct}%)`, 60, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
      }
    } else {
      const rateColor = getRateColor(data.rateLimitPct, colorMode, colors);
      chipRate = makeChip(colors.C_BG_RATE, `${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}${data.rateTimeLeft}\u00b7${data.rateResetTime} ${rateColor}(${data.rateLimitPct}%)`, chipStyle, colors);
    }
  } else {
    chipRate = '';
  }

  // Session time
  if (isAnimated(animationMode)) {
    if (animationMode === 'lsd') {
      chipTime = colorizeBgSparkle(` ${colors.icons.SESSION} ${data.sessionDurationMin}m `, 70, bgOffset, colorMode, '\x1b[30m');
    } else {
      chipTime = makeChip(colors.C_BG_TIME, `${colors.C_I_TIME}${colors.icons.SESSION} ${colorizeText(`${data.sessionDurationMin}m`, 70, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
    }
  } else {
    chipTime = makeChip(colors.C_BG_TIME, `${colors.C_I_TIME}${colors.icons.SESSION} ${colors.C_TIME}${data.sessionDurationMin}m`, chipStyle, colors);
  }

  // Burn rate
  if (data.burnRate) {
    if (isAnimated(animationMode)) {
      if (animationMode === 'lsd') {
        chipBurn = colorizeBgSparkle(` ${colors.icons.COST} ${data.burnRate} `, 80, bgOffset, colorMode, '\x1b[30m');
      } else {
        chipBurn = makeChip(colors.C_BG_BURN, `${colors.C_I_BURN}${colors.icons.COST} ${colorizeText(data.burnRate, 80, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
      }
    } else {
      chipBurn = makeChip(colors.C_BG_BURN, `${colors.C_I_BURN}${colors.icons.COST} ${colors.C_BURN}${data.burnRate}`, chipStyle, colors);
    }
  } else {
    chipBurn = '';
  }

  // Theme
  if (isAnimated(animationMode)) {
    chipTheme = colorizeText(`${colors.icons.THEME} ${data.themeName}`, 0, colorOffset, animationMode, colorMode);
  } else {
    chipTheme = `${colors.C_I_THEME}${colors.icons.THEME} ${colors.C_RATE}${data.themeName}${RST}`;
  }

  let line2 = `${chipModel} ${chipRate} ${chipTime} ${chipBurn}  ${chipTheme}`;
  // Collapse multiple spaces from empty chips
  line2 = line2.replace(/ {2,}/g, ' ');

  return `${line1}\n${line2}`;
}
