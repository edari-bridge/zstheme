// Common formatting helpers (ported from helpers.sh / common.sh)
import { colorizeText, colorizeTextDark, colorizeFgSparkle } from './animation.js';

export function isAnimated(animationMode) {
  return animationMode === 'lsd' || animationMode === 'rainbow' || animationMode === 'p.lsd';
}

export function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

const emojiRe = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{231A}\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

export function visibleWidth(text) {
  const plain = stripAnsi(text);
  const emojiCount = (plain.match(emojiRe) || []).length;
  return [...plain].length + emojiCount;
}

export function alignTwoLines(line1Parts, line2Parts, minSep = 2) {
  const measure = (parts) =>
    parts.reduce((s, p) => s + visibleWidth(p), 0) + (parts.length - 1) * minSep;
  const targetWidth = Math.max(measure(line1Parts), measure(line2Parts));

  const joinAligned = (parts) => {
    if (parts.length <= 1) return parts.join('');
    const contentWidth = parts.reduce((sum, p) => sum + visibleWidth(p), 0);
    const totalSep = Math.max(targetWidth - contentWidth, (parts.length - 1) * minSep);
    const sepCount = parts.length - 1;
    const baseSep = Math.floor(totalSep / sepCount);
    const extra = totalSep % sepCount;
    return parts.map((p, i) => {
      if (i === sepCount) return p;
      return p + ' '.repeat(baseSep + (i < extra ? 1 : 0));
    }).join('');
  };

  return { line1: joinAligned(line1Parts), line2: joinAligned(line2Parts) };
}

export function renderText(iconColor, icon, text, colorVar, offset, ctx) {
  if (ctx.animationMode === 'lsd') {
    return `${iconColor}${icon}${ctx.colors.RST} ${colorizeFgSparkle(text, offset, ctx.bgOffset, ctx.colorMode)}`;
  }
  if (isAnimated(ctx.animationMode)) {
    return `${iconColor}${icon}${ctx.colors.RST} ${colorizeText(text, offset, ctx.colorOffset, ctx.animationMode, ctx.colorMode)}`;
  }
  return `${iconColor}${icon} ${colorVar}${text}${ctx.colors.RST}`;
}

export function formatGitStatus(separator, ctx) {
  const { colors, animationMode, colorMode, colorOffset, bgOffset, git } = ctx;
  let add, mod, del;

  if (animationMode === 'lsd') {
    const addText = git.added > 0 ? `+${git.added}` : '+0';
    const modText = git.modified > 0 ? `~${git.modified}` : '~0';
    const delText = git.deleted > 0 ? `-${git.deleted}` : '-0';
    const combined = `${addText}${separator}${modText}${separator}${delText}`;
    return `${colors.C_I_STATUS}${colors.icons.GIT_STATUS}${colors.RST} ${colorizeFgSparkle(combined, 30, bgOffset, colorMode)}`;
  } else if (isAnimated(animationMode)) {
    const addText = git.added > 0 ? `+${git.added}` : '+0';
    const modText = git.modified > 0 ? `~${git.modified}` : '~0';
    const delText = git.deleted > 0 ? `-${git.deleted}` : '-0';
    const combined = `${addText}${separator}${modText}${separator}${delText}`;
    return `${colors.C_I_STATUS}${colors.icons.GIT_STATUS}${colors.RST} ${colorizeText(combined, 30, colorOffset, animationMode, colorMode)}`;
  } else {
    add = git.added > 0 ? `${colors.C_BRIGHT_STATUS}+${git.added}${colors.RST}` : `${colors.C_DIM_STATUS}+0${colors.RST}`;
    mod = git.modified > 0 ? `${colors.C_BRIGHT_STATUS}~${git.modified}${colors.RST}` : `${colors.C_DIM_STATUS}~0${colors.RST}`;
    del = git.deleted > 0 ? `${colors.C_BRIGHT_STATUS}-${git.deleted}${colors.RST}` : `${colors.C_DIM_STATUS}-0${colors.RST}`;
  }

  return `${colors.C_I_STATUS}${colors.icons.GIT_STATUS}${colors.RST} ${add}${separator}${mod}${separator}${del}`;
}

export function formatGitSync(separator, ctx) {
  const { colors, animationMode, colorMode, colorOffset, bgOffset, git } = ctx;
  let ahead, behind;

  if (animationMode === 'lsd') {
    const aheadText = git.ahead > 0 ? `\u2191 ${git.ahead}` : '\u2191 0';
    const behindText = git.behind > 0 ? `\u2193 ${git.behind}` : '\u2193 0';
    const combined = `${aheadText}${separator}${behindText}`;
    return `${colors.C_I_SYNC}${colors.icons.SYNC}${colors.RST} ${colorizeFgSparkle(combined, 40, bgOffset, colorMode)}`;
  } else if (isAnimated(animationMode)) {
    const aheadText = git.ahead > 0 ? `\u2191 ${git.ahead}` : '\u2191 0';
    const behindText = git.behind > 0 ? `\u2193 ${git.behind}` : '\u2193 0';
    const combined = `${aheadText}${separator}${behindText}`;
    return `${colors.C_I_SYNC}${colors.icons.SYNC}${colors.RST} ${colorizeText(combined, 40, colorOffset, animationMode, colorMode)}`;
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

// Unified animation content generator (lsd/rainbow/static)
// type: "text" (icon + animated text), "chip" (make_chip wrapping), "bg_chip" (lsd: bg sparkle, else: chip)
export function applyAnimation(ctx, { type, text, offset, iconColor, icon, bgColor, textColor }) {
  const { animationMode, colorMode, colorOffset, bgOffset, colors } = ctx;
  const chipStyle = process.env.CHIP_STYLE || 'badge';

  if (animationMode === 'lsd') {
    if (type === 'bg_chip' || type === 'chip') {
      return makeChip(bgColor, colorizeTextDark(`${icon} ${text}`, offset, colorOffset, animationMode, colorMode), chipStyle, colors);
    }
    // text
    return `${iconColor}${icon}${colors.RST} ${colorizeFgSparkle(text, offset, bgOffset, colorMode)}`;
  }

  if (animationMode === 'p.lsd') {
    if (type === 'bg_chip' || type === 'chip') {
      return makeChip(bgColor, colorizeTextDark(`${icon} ${text}`, offset, colorOffset, animationMode, colorMode), chipStyle, colors);
    }
    // text (theme 등): rainbow 텍스트 유지
    return `${iconColor}${icon}${colors.RST} ${colorizeText(text, offset, colorOffset, animationMode, colorMode)}`;
  }

  if (isAnimated(animationMode)) {
    if (type === 'bg_chip' || type === 'chip') {
      return makeChip(bgColor, `${iconColor}${icon} ${colorizeText(text, offset, colorOffset, animationMode, colorMode)}`, chipStyle, colors);
    }
    // text
    return `${iconColor}${icon}${colors.RST} ${colorizeText(text, offset, colorOffset, animationMode, colorMode)}`;
  }

  // Static
  if (type === 'bg_chip' || type === 'chip') {
    return makeChip(bgColor, `${iconColor}${icon} ${textColor}${text}`, chipStyle, colors);
  }
  return `${iconColor}${icon} ${textColor}${text}${colors.RST}`;
}

export function formatContext(ctx) {
  const { colors } = ctx;
  if (ctx.iconMode === 'nerd') {
    return `${colors.C_I_CTX}${colors.CTX_ICON}${colors.RST} ${colors.C_CTX_TEXT}${ctx.data.contextPct}%${colors.RST}`;
  }
  return `${colors.CTX_ICON} ${colors.C_CTX_TEXT}${ctx.data.contextPct}%${colors.RST}`;
}
