// Animation engine (ported from rainbow.sh)
import { RAINBOW_COLORS, LSD_COLORS, MONO_CYCLE } from './palette.js';

const ESC = '\x1b';

export function getTimestampDecis() {
  return Math.floor(Date.now() / 100);
}

export function computeOffsets(animationMode, colorMode) {
  const ts = getTimestampDecis();
  let colorOffset, bgOffset;

  if (animationMode === 'lsd') {
    colorOffset = (ts * 41) % 60;
    bgOffset = (ts * 37) % 60;
  } else if (animationMode === 'rainbow') {
    colorOffset = (ts * 5) % 60;
    bgOffset = (colorOffset + 30) % 60;
  } else {
    colorOffset = 0;
    bgOffset = 0;
  }

  return { colorOffset, bgOffset };
}

function getPalette(animationMode, colorMode) {
  if (colorMode === 'mono') return MONO_CYCLE;
  if (animationMode === 'lsd') return LSD_COLORS;
  return RAINBOW_COLORS;
}

// Per-character foreground coloring (colorize_text in rainbow.sh)
export function colorizeText(text, startIdx = 0, colorOffset = 0, animationMode = 'rainbow', colorMode = 'pastel') {
  const palette = getPalette(animationMode, colorMode);
  const chars = [...text];
  let result = '';

  for (let i = 0; i < chars.length; i++) {
    const idx = ((startIdx + i * 7 + colorOffset) % 60 + 60) % 60;
    const [r, g, b] = palette[idx];
    result += `${ESC}[1;38;2;${r};${g};${b}m${chars[i]}`;
  }

  return result + `${ESC}[22;39m`;
}

// Per-character background gradient (colorize_bg_lsd in rainbow.sh)
export function colorizeBgLsd(text, startIdx = 0, colorOffset = 0, colorMode = 'pastel', fgColor = `${ESC}[30m`) {
  const palette = colorMode === 'mono' ? MONO_CYCLE : RAINBOW_COLORS;
  const chars = [...text];
  let result = '';

  const stride = 5 + (startIdx % 7);
  const direction = ((startIdx % 20) >= 10) ? -1 : 1;

  for (let i = 0; i < chars.length; i++) {
    let idx = (startIdx + i * stride * direction + colorOffset) % 60;
    if (idx < 0) idx += 60;
    const [r, g, b] = palette[idx];
    result += `${ESC}[48;2;${r};${g};${b}m${fgColor}${chars[i]}`;
  }

  return result + `${ESC}[0m`;
}

// Animated foreground color for a single element (get_animated_color)
export function getAnimatedColor(idx, colorOffset, animationMode, colorMode) {
  const palette = getPalette(animationMode, colorMode);
  const actualIdx = ((idx + colorOffset) % 60 + 60) % 60;
  const [r, g, b] = palette[actualIdx];
  return `${ESC}[1;38;2;${r};${g};${b}m`;
}

// Animated background for bars layout (get_animated_bg)
export function getAnimatedBg(chipIdx, bgOffset, animationMode, colorMode) {
  const palette = getPalette(animationMode, colorMode);
  const actualIdx = ((chipIdx * 10 + bgOffset) % 60 + 60) % 60;
  const [r, g, b] = palette[actualIdx];
  return `${ESC}[48;2;${r};${g};${b}m`;
}

// Animated background for badges layout (get_animated_badge_bg)
export function getAnimatedBadgeBg(elementIdx, bgOffset, animationMode, colorMode) {
  const palette = getPalette(animationMode, colorMode);
  const actualIdx = ((elementIdx * 5 + bgOffset) % 60 + 60) % 60;
  const [r, g, b] = palette[actualIdx];
  return `${ESC}[48;2;${r};${g};${b}m`;
}

// Animated battery color for card layout (get_animated_battery_color)
export function getAnimatedBatteryColor(timestamp, animationMode, colorMode, batteryPct = 100) {
  // 2% flash probability
  if (Math.random() < 0.02) {
    return `${ESC}[48;2;255;255;255m`;
  }

  if (colorMode === 'mono') {
    const idx = timestamp % 8;
    return `${ESC}[48;5;${236 + idx}m`;
  }

  if (animationMode === 'lsd') {
    let startI = 40, range = 20;
    if (batteryPct <= 20) { startI = 5; range = 21; }
    else if (batteryPct <= 50) { startI = 0; range = 16; }
    const offset = ((timestamp * 3 + Math.floor(Math.random() * 10)) % range + range) % range;
    const finalIdx = (startI + offset) % 60;
    const [r, g, b] = LSD_COLORS[finalIdx];
    return `${ESC}[48;2;${r};${g};${b}m`;
  }

  // Rainbow: full spectrum cycle
  const idx = timestamp % 60;
  const [r, g, b] = RAINBOW_COLORS[idx];
  return `${ESC}[48;2;${r};${g};${b}m`;
}
