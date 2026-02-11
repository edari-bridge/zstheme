// Card layout (ported from card.sh)
import { colorizeText, colorizeFgSparkle, getAnimatedBatteryColor, getTimestampDecis } from '../animation.js';
import { applyAnimation, formatGitStatus, formatGitSync, isAnimated, visibleWidth } from '../helpers.js';
import { getRateColor } from '../colors.js';

function padTo(text, targetWidth) {
  const actualWidth = visibleWidth(text);
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
  const { colors, data, git, animationMode, colorMode, colorOffset, bgOffset } = ctx;
  const RST = colors.RST;
  const V = `${colors.C_BOX}\u2502${RST}`;
  const W = 24;

  // Left card content
  const L1 = applyAnimation(ctx, { type: 'text', text: git.branch || 'branch', offset: 0, iconColor: colors.C_I_BRANCH, icon: colors.icons.BRANCH, bgColor: '', textColor: colors.C_BRANCH });
  const L2 = applyAnimation(ctx, { type: 'text', text: git.worktree || 'worktree', offset: 3, iconColor: colors.C_I_TREE, icon: colors.icons.TREE, bgColor: '', textColor: colors.C_TREE });
  const L3 = applyAnimation(ctx, { type: 'text', text: data.dirName, offset: 6, iconColor: colors.C_I_DIR, icon: colors.icons.DIR, bgColor: '', textColor: colors.C_DIR });
  const L4 = formatGitStatus('  ', ctx);
  const L5 = formatGitSync('  ', ctx);

  // Right card content
  const R1 = applyAnimation(ctx, { type: 'text', text: data.model, offset: 9, iconColor: colors.C_I_MODEL, icon: colors.icons.MODEL, bgColor: '', textColor: colors.C_MODEL });
  let R2;
  if (data.rateTimeLeft && data.rateResetTime && (data.rateLimitPct || data.rateLimitPct === 0)) {
    if (isAnimated(animationMode)) {
      R2 = applyAnimation(ctx, { type: 'text', text: `${data.rateTimeLeft}\u00b7${data.rateResetTime} (${data.rateLimitPct}%)`, offset: 12, iconColor: colors.C_I_RATE, icon: colors.icons.TIME, bgColor: '', textColor: '' });
    } else {
      const rateColor = getRateColor(data.rateLimitPct, colorMode, colors);
      R2 = `${colors.C_I_RATE}${colors.icons.TIME} ${colors.C_RATE}${data.rateTimeLeft}\u00b7${data.rateResetTime} ${rateColor}(${data.rateLimitPct}%)${RST}`;
    }
  } else {
    R2 = `${colors.C_DIM_STATUS}${colors.icons.TIME} ---${RST}`;
  }
  const R3 = applyAnimation(ctx, { type: 'text', text: `${data.sessionDurationMin}m`, offset: 22, iconColor: colors.C_I_TIME, icon: colors.icons.SESSION, bgColor: '', textColor: colors.C_TIME });
  const R4 = data.burnRate ? applyAnimation(ctx, { type: 'text', text: data.burnRate, offset: 32, iconColor: colors.C_I_BURN, icon: colors.icons.COST, bgColor: '', textColor: colors.C_BURN }) : `${colors.C_DIM_STATUS}${colors.icons.COST} ---${RST}`;
  const R5 = applyAnimation(ctx, { type: 'text', text: data.themeName, offset: 5, iconColor: colors.C_I_THEME, icon: colors.icons.THEME, bgColor: '', textColor: colors.C_I_THEME });

  // Right card width: dynamic based on longest content (theme name can be long)
  const WR = Math.max(W, ...[R1, R2, R3, R4, R5].filter(Boolean).map(visibleWidth));

  // Borders
  const TOP1 = `${colors.C_BOX}\u256D${'─'.repeat(W + 2)}\u256E${RST}`;
  const BOT1 = `${colors.C_BOX}\u2570${'─'.repeat(W + 2)}\u256F${RST}`;
  const TOP2 = `${colors.C_BOX}\u256D${'─'.repeat(WR + 2)}\u256E${RST}`;
  const BOT2 = `${colors.C_BOX}\u2570${'─'.repeat(WR + 2)}\u256F${RST}`;
  const BTOP = `${colors.C_BOX}\u256D${'─'.repeat(5)}\u256E${RST}`;
  const BBOT = `${colors.C_BOX}\u2570${'─'.repeat(5)}\u256F${RST}`;
  const BV = `${colors.C_BOX}\u2502${RST}`;

  const lines = [];
  lines.push(`${TOP1}  ${TOP2}  ${BTOP}`);
  lines.push(`${V} ${padTo(L1, W)} ${V}  ${V} ${padTo(R1, WR)} ${V}  ${BV}${batteryLine(1, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L2, W)} ${V}  ${V} ${padTo(R2, WR)} ${V}  ${BV}${batteryLine(2, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L3, W)} ${V}  ${V} ${padTo(R3, WR)} ${V}  ${BV}${batteryLine(3, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L4, W)} ${V}  ${V} ${padTo(R4, WR)} ${V}  ${BV}${batteryLine(4, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${V} ${padTo(L5, W)} ${V}  ${V} ${padTo(R5, WR)} ${V}  ${BV}${batteryLine(5, data.contextPct, animationMode, colorMode, colors)}${BV}`);
  lines.push(`${BOT1}  ${BOT2}  ${BBOT}`);

  return lines.join('\n');
}
