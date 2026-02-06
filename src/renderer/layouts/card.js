// Card layout (ported from card.sh)
import { colorizeText, getAnimatedBatteryColor, getTimestampDecis } from '../animation.js';
import { formatGitStatus, formatGitSync, isAnimated, stripAnsi } from '../helpers.js';
import { getRateColor } from '../colors.js';

function padTo(text, targetWidth) {
  const plain = stripAnsi(text);
  // Emoji width correction (emojis take 2 columns)
  const emojiRe = /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojiCount = (plain.match(emojiRe) || []).length;
  const actualWidth = [...plain].length + emojiCount;
  const pad = Math.max(0, targetWidth - actualWidth);
  return text + ' '.repeat(pad);
}

function batteryLine(row, contextPct, animationMode, colorMode, colors) {
  const remaining = 100 - contextPct;
  const RST = colors.RST;

  if (row === 3) {
    const str = `${contextPct}%`;
    const left = Math.floor((5 - str.length) / 2);
    const right = 5 - str.length - left;
    return `${' '.repeat(left)}${colors.C_CTX_TEXT}${str}${RST}${' '.repeat(right)}`;
  }

  const thresholds = { 1: 75, 2: 50, 4: 25, 5: 0 };
  const threshold = thresholds[row];

  let fillColor;
  if (isAnimated(animationMode)) {
    fillColor = getAnimatedBatteryColor(getTimestampDecis(), animationMode, colorMode, remaining);
  } else {
    fillColor = colors.C_BAT_FILL;
  }

  if (remaining > threshold) {
    return `${fillColor}     ${RST}`;
  }
  return `${colors.C_BAT_EMPTY}     ${RST}`;
}

export function render(ctx) {
  const { colors, data, git, animationMode, colorMode, colorOffset } = ctx;
  const RST = colors.RST;
  const V = `${colors.C_BOX}\u2502${RST}`;
  const W = 24;

  // Left card content
  let L1, L2, L3;
  if (isAnimated(animationMode)) {
    L1 = `${colors.C_I_BRANCH}${colors.icons.BRANCH}${RST} ${colorizeText(git.branch || 'branch', 0, colorOffset, animationMode, colorMode)}`;
    L2 = `${colors.C_I_TREE}${colors.icons.TREE}${RST} ${colorizeText(git.worktree || 'worktree', 3, colorOffset, animationMode, colorMode)}`;
    L3 = `${colors.C_I_DIR}${colors.icons.DIR}${RST} ${colorizeText(data.dirName, 6, colorOffset, animationMode, colorMode)}`;
  } else {
    L1 = `${colors.C_I_BRANCH}${colors.icons.BRANCH} ${colors.C_BRANCH}${git.branch || 'branch'}${RST}`;
    L2 = `${colors.C_I_TREE}${colors.icons.TREE} ${colors.C_TREE}${git.worktree || 'worktree'}${RST}`;
    L3 = `${colors.C_I_DIR}${colors.icons.DIR} ${colors.C_DIR}${data.dirName}${RST}`;
  }
  const L4 = formatGitStatus('  ', ctx);
  const L5 = formatGitSync('  ', ctx);

  // Right card content
  let R1, R2, R3, R4, R5;
  if (isAnimated(animationMode)) {
    R1 = `${colors.C_I_MODEL}${colors.icons.MODEL}${RST} ${colorizeText(data.model, 9, colorOffset, animationMode, colorMode)}`;
    if (data.rateTimeLeft && data.rateResetTime && data.rateLimitPct) {
      R2 = `${colors.C_I_RATE}${colors.icons.TIME}${RST} ${colorizeText(`${data.rateTimeLeft}\u00b7${data.rateResetTime} (${data.rateLimitPct}%)`, 12, colorOffset, animationMode, colorMode)}`;
    } else {
      R2 = '';
    }
    R3 = `${colors.C_I_TIME}${colors.icons.SESSION}${RST} ${colorizeText(`${data.sessionDurationMin}m`, 22, colorOffset, animationMode, colorMode)}`;
    R4 = data.burnRate ? `${colors.C_I_BURN}${colors.icons.COST}${RST} ${colorizeText(data.burnRate, 32, colorOffset, animationMode, colorMode)}` : '';
    R5 = `${colors.C_I_THEME}${colors.icons.THEME}${RST} ${colorizeText(data.themeName, 5, colorOffset, animationMode, colorMode)}`;
  } else {
    R1 = `${colors.C_I_MODEL}${colors.icons.MODEL} ${colors.C_MODEL}${data.model}${RST}`;
    if (data.rateTimeLeft && data.rateResetTime && data.rateLimitPct) {
      const rateColor = getRateColor(data.rateLimitPct, colorMode, colors);
      R2 = `${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}${data.rateTimeLeft}\u00b7${data.rateResetTime} ${rateColor}(${data.rateLimitPct}%)${RST}`;
    } else {
      R2 = '';
    }
    R3 = `${colors.C_I_TIME}${colors.icons.SESSION} ${colors.C_TIME}${data.sessionDurationMin}m${RST}`;
    R4 = data.burnRate ? `${colors.C_I_BURN}${colors.icons.COST} ${colors.C_BURN}${data.burnRate}${RST}` : '';
    R5 = `${colors.C_I_THEME}${colors.icons.THEME} ${colors.C_RATE}${data.themeName}${RST}`;
  }

  // Borders
  const TOP1 = `${colors.C_BOX}\u256D${'─'.repeat(26)}\u256E${RST}`;
  const BOT1 = `${colors.C_BOX}\u2570${'─'.repeat(26)}\u256F${RST}`;
  const BTOP = `${colors.C_BOX}\u256D${'─'.repeat(5)}\u256E${RST}`;
  const BBOT = `${colors.C_BOX}\u2570${'─'.repeat(5)}\u256F${RST}`;
  const BV = `${colors.C_BOX}\u2502${RST}`;

  const lines = [];
  lines.push(`${TOP1}  ${TOP1}  ${BTOP}`);
  lines.push(`${V} ${padTo(L1, W)} ${V}  ${V} ${padTo(R1, W)} ${V}  ${BV}${batteryLine(1, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L2, W)} ${V}  ${V} ${padTo(R2, W)} ${V}  ${BV}${batteryLine(2, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L3, W)} ${V}  ${V} ${padTo(R3, W)} ${V}  ${BV}${batteryLine(3, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L4, W)} ${V}  ${V} ${padTo(R4, W)} ${V}  ${BV}${batteryLine(4, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L5, W)} ${V}  ${V} ${padTo(R5, W)} ${V}  ${BV}${batteryLine(5, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${BOT1}  ${BOT1}  ${BBOT}`);

  return lines.join('\n');
}
