// Common formatting helpers (ported from helpers.sh / common.sh)
import { colorizeText } from './animation.js';

export function isAnimated(animationMode) {
  return animationMode === 'lsd' || animationMode === 'rainbow';
}

export function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export function renderText(iconColor, icon, text, colorVar, offset, ctx) {
  if (isAnimated(ctx.animationMode)) {
    return `${iconColor}${icon}${ctx.colors.RST} ${colorizeText(text, offset, ctx.colorOffset, ctx.animationMode, ctx.colorMode)}`;
  }
  return `${iconColor}${icon} ${colorVar}${text}${ctx.colors.RST}`;
}

export function formatGitStatus(separator, ctx) {
  const { colors, animationMode, colorMode, colorOffset, git } = ctx;
  let add, mod, del;

  if (isAnimated(animationMode)) {
    const addText = git.added > 0 ? `+${git.added}` : '+0';
    const modText = git.modified > 0 ? `~${git.modified}` : '~0';
    const delText = git.deleted > 0 ? `-${git.deleted}` : '-0';
    add = colorizeText(addText, 3, colorOffset, animationMode, colorMode);
    mod = colorizeText(modText, 5, colorOffset, animationMode, colorMode);
    del = colorizeText(delText, 7, colorOffset, animationMode, colorMode);
  } else {
    add = git.added > 0 ? `${colors.C_BRIGHT_STATUS}+${git.added}${colors.RST}` : `${colors.C_DIM_STATUS}+0${colors.RST}`;
    mod = git.modified > 0 ? `${colors.C_BRIGHT_STATUS}~${git.modified}${colors.RST}` : `${colors.C_DIM_STATUS}~0${colors.RST}`;
    del = git.deleted > 0 ? `${colors.C_BRIGHT_STATUS}-${git.deleted}${colors.RST}` : `${colors.C_DIM_STATUS}-0${colors.RST}`;
  }

  return `${colors.C_I_STATUS}${colors.icons.GIT_STATUS}${colors.RST} ${add}${separator}${mod}${separator}${del}`;
}

export function formatGitSync(separator, ctx) {
  const { colors, animationMode, colorMode, colorOffset, git } = ctx;
  let ahead, behind;

  if (isAnimated(animationMode)) {
    const aheadText = git.ahead > 0 ? `\u2191 ${git.ahead}` : '\u2191 0';
    const behindText = git.behind > 0 ? `\u2193 ${git.behind}` : '\u2193 0';
    ahead = colorizeText(aheadText, 0, colorOffset, animationMode, colorMode);
    behind = colorizeText(behindText, 4, colorOffset, animationMode, colorMode);
  } else {
    ahead = git.ahead > 0 ? `${colors.C_BRIGHT_SYNC}\u2191 ${git.ahead}${colors.RST}` : `${colors.C_DIM_SYNC}\u2191 0${colors.RST}`;
    behind = git.behind > 0 ? `${colors.C_BRIGHT_SYNC}\u2193 ${git.behind}${colors.RST}` : `${colors.C_DIM_SYNC}\u2193 0${colors.RST}`;
  }

  return `${colors.C_I_SYNC}${colors.icons.SYNC}${colors.RST} ${ahead}${separator}${behind}`;
}

export function makeChip(bg, content, chipStyle, colors) {
  if (chipStyle === 'pipe') {
    return `${colors.C_CHIP}\u2503${colors.RST}${bg} ${content} ${colors.RST}${colors.C_CHIP}\u2503${colors.RST}`;
  }
  return `${bg} ${content} ${colors.RST}`;
}

export function formatContext(ctx) {
  const { colors } = ctx;
  if (ctx.iconMode === 'nerd') {
    return `${colors.C_I_CTX}${colors.CTX_ICON}${colors.RST} ${colors.C_CTX_TEXT}${ctx.data.contextPct}%${colors.RST}`;
  }
  return `${colors.CTX_ICON} ${colors.C_CTX_TEXT}${ctx.data.contextPct}%${colors.RST}`;
}
