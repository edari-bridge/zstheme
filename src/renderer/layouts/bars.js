// Bars layout (ported from bars.sh)
import { colorizeText, colorizeBgLsd } from '../animation.js';
import { formatContext, isAnimated, makeChip } from '../helpers.js';
import { getRateColor } from '../colors.js';

export function render(ctx) {
  const { colors, data, git, animationMode, colorMode, colorOffset, bgOffset } = ctx;
  const chipStyle = process.env.CHIP_STYLE || 'badge';
  const RST = colors.RST;

  if (isAnimated(animationMode)) {
    // === Animated path ===

    // Line 1: Location chip + Git chip + Context
    const rawLoc = ` ${colors.icons.BRANCH} ${git.branch || 'branch'}    ${colors.icons.TREE} ${git.worktree || 'worktree'}    ${colors.icons.DIR} ${data.dirName} `;

    let chipLoc;
    if (animationMode === 'lsd') {
      chipLoc = colorizeBgLsd(rawLoc, 0, colorOffset, colorMode, '\x1b[30m');
    } else {
      const locContent = `${colors.C_I_BRANCH}${colors.icons.BRANCH} ${colorizeText(git.branch || 'branch', 0, colorOffset, animationMode, colorMode)}    ${colors.C_I_TREE}${colors.icons.TREE} ${colorizeText(git.worktree || 'worktree', 10, colorOffset, animationMode, colorMode)}    ${colors.C_I_DIR}${colors.icons.DIR} ${colorizeText(data.dirName, 20, colorOffset, animationMode, colorMode)}`;
      chipLoc = makeChip(colors.C_BG_LOC, locContent, chipStyle, colors);
    }

    let chipGit;
    if (git.isGitRepo) {
      const add = git.added > 0 ? `+${git.added}` : '+0';
      const mod = git.modified > 0 ? `~${git.modified}` : '~0';
      const del = git.deleted > 0 ? `-${git.deleted}` : '-0';
      const ahead = git.ahead > 0 ? `\u2191 ${git.ahead}` : '\u2191 0';
      const behind = git.behind > 0 ? `\u2193 ${git.behind}` : '\u2193 0';
      const rawGit = ` ${colors.icons.GIT_STATUS} ${add}  ${mod}  ${del}    ${colors.icons.SYNC} ${ahead}  ${behind} `;

      if (animationMode === 'lsd') {
        chipGit = colorizeBgLsd(rawGit, 30, colorOffset, colorMode, '\x1b[30m');
      } else {
        const gitContent = `${colors.C_I_STATUS}${colors.icons.GIT_STATUS} ${colorizeText(`${add}  ${mod}  ${del}`, 30, colorOffset, animationMode, colorMode)}    ${colors.C_I_SYNC}${colors.icons.SYNC} ${colorizeText(`${ahead}  ${behind}`, 40, colorOffset, animationMode, colorMode)}`;
        chipGit = makeChip(colors.C_BG_GIT, gitContent, chipStyle, colors);
      }
    } else {
      const rawGit = ` ${colors.icons.GIT_STATUS} ---    ${colors.icons.SYNC} --- `;
      if (animationMode === 'lsd') {
        chipGit = colorizeBgLsd(rawGit, 30, colorOffset, colorMode, '\x1b[30;2m');
      } else {
        chipGit = makeChip(colors.C_BG_GIT, `${colors.C_DIM_STATUS}${colors.icons.GIT_STATUS} ---    ${colors.C_DIM_SYNC}${colors.icons.SYNC} ---`, chipStyle, colors);
      }
    }

    const ctxDisplay = formatContext(ctx);
    const line1 = `${chipLoc}    ${chipGit}    ${ctxDisplay}`;

    // Line 2: Session chip + Theme
    let sesRaw = ` ${colors.icons.MODEL} ${data.model}`;
    if (data.rateTimeLeft && data.rateResetTime && (data.rateLimitPct || data.rateLimitPct === 0)) {
      sesRaw += `     ${colors.icons.TIME} ${data.rateTimeLeft} \u00b7 ${data.rateResetTime} (${data.rateLimitPct}%)`;
    }
    sesRaw += `     ${colors.icons.SESSION} ${data.sessionDurationMin}m`;
    if (data.burnRate) sesRaw += `     ${colors.icons.COST} ${data.burnRate}`;
    sesRaw += ' ';

    let chipSes;
    if (animationMode === 'lsd') {
      chipSes = colorizeBgLsd(sesRaw, 50, colorOffset, colorMode, '\x1b[30m');
    } else {
      let sesAnimated = `${colors.C_I_MODEL}${colors.icons.MODEL} ${colorizeText(data.model, 50, colorOffset, animationMode, colorMode)}`;
      if (data.rateTimeLeft && data.rateResetTime && (data.rateLimitPct || data.rateLimitPct === 0)) {
        sesAnimated += `     ${colors.C_I_RATE}${colors.icons.TIME} ${colorizeText(`${data.rateTimeLeft} \u00b7 ${data.rateResetTime} (${data.rateLimitPct}%)`, 60, colorOffset, animationMode, colorMode)}`;
      }
      sesAnimated += `     ${colors.C_I_TIME}${colors.icons.SESSION} ${colorizeText(`${data.sessionDurationMin}m`, 70, colorOffset, animationMode, colorMode)}`;
      if (data.burnRate) {
        sesAnimated += `     ${colors.C_I_BURN}${colors.icons.COST} ${colorizeText(data.burnRate, 80, colorOffset, animationMode, colorMode)}`;
      }
      chipSes = makeChip(colors.C_BG_SES, sesAnimated, chipStyle, colors);
    }

    const chipTheme = colorizeText(`${colors.icons.THEME} ${data.themeName}`, 0, colorOffset, animationMode, colorMode);
    const line2 = `${chipSes}    ${chipTheme}`;

    return `${line1}\n${line2}`;
  }

  // === Static path ===
  const bgLoc = colors.C_BG_LOC;
  const bgGit = colors.C_BG_GIT;
  const bgSes = colors.C_BG_SES;

  let locContent = `${colors.C_I_BRANCH}${colors.icons.BRANCH} ${colors.C_BRANCH}${git.branch || 'branch'}    `;
  locContent += `${colors.C_I_TREE}${colors.icons.TREE} ${colors.C_TREE}${git.worktree || 'worktree'}    `;
  locContent += `${colors.C_I_DIR}${colors.icons.DIR} ${colors.C_DIR}${data.dirName}`;

  let gitContent;
  if (git.isGitRepo) {
    const add = git.added > 0 ? `${colors.C_BRIGHT_STATUS}+${git.added}` : `${colors.C_DIM_STATUS}+0`;
    const mod = git.modified > 0 ? `${colors.C_BRIGHT_STATUS}~${git.modified}` : `${colors.C_DIM_STATUS}~0`;
    const del = git.deleted > 0 ? `${colors.C_BRIGHT_STATUS}-${git.deleted}` : `${colors.C_DIM_STATUS}-0`;
    const ahead = git.ahead > 0 ? `${colors.C_BRIGHT_SYNC}\u2191 ${git.ahead}` : `${colors.C_DIM_SYNC}\u2191 0`;
    const behind = git.behind > 0 ? `${colors.C_BRIGHT_SYNC}\u2193 ${git.behind}` : `${colors.C_DIM_SYNC}\u2193 0`;
    gitContent = `${colors.C_I_STATUS}${colors.icons.GIT_STATUS} ${add}  ${mod}  ${del}    ${colors.C_I_SYNC}${colors.icons.SYNC} ${ahead}  ${behind}`;
  } else {
    gitContent = `${colors.C_DIM_STATUS}${colors.icons.GIT_STATUS} ---    ${colors.C_DIM_SYNC}${colors.icons.SYNC} ---`;
  }

  const ctxDisplay = formatContext(ctx);
  const line1 = `${makeChip(bgLoc, locContent, chipStyle, colors)}    ${makeChip(bgGit, gitContent, chipStyle, colors)}    ${ctxDisplay}`;

  let sesContent = `${colors.C_I_MODEL}${colors.icons.MODEL} ${colors.C_MODEL}${data.model}`;
  if (data.rateTimeLeft && data.rateResetTime && (data.rateLimitPct || data.rateLimitPct === 0)) {
    const rateColor = getRateColor(data.rateLimitPct, colorMode, colors);
    sesContent += `     ${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}${data.rateTimeLeft} \u00b7 ${data.rateResetTime} ${rateColor}(${data.rateLimitPct}%)`;
  }
  sesContent += `     ${colors.C_I_TIME}${colors.icons.SESSION} ${colors.C_TIME}${data.sessionDurationMin}m`;
  if (data.burnRate) sesContent += `     ${colors.C_I_BURN}${colors.icons.COST} ${colors.C_BURN}${data.burnRate}`;

  const themeDisplay = `${colors.C_I_THEME}${colors.icons.THEME} ${colors.C_RATE}${data.themeName}${RST}`;
  const line2 = `${makeChip(bgSes, sesContent, chipStyle, colors)}    ${themeDisplay}`;

  return `${line1}\n${line2}`;
}
