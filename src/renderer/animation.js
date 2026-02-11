// Animation engine (ported from rainbow.sh)
import { RAINBOW_COLORS, LSD_COLORS, MONO_CYCLE } from './palette.js';

const ESC = '\x1b';

// Animation constants
const PALETTE_SIZE = 60;
const CHAR_STRIDE = 7;
const BAR_BG_STRIDE = 10;
const BADGE_BG_STRIDE = 5;
const FLASH_PROBABILITY = 0.02;
const SPARKLE_PROBABILITY = 0.03;
const JITTER_RANGE = 8;
const MONO_GRAYSCALE_RANGE = 8;
const LSD_SPEED_MULTIPLIER = 3;
const LSD_RANDOM_PERTURBATION = 10;

export function getTimestampDecis() {
  return Math.floor(Date.now() / 100);
}

export function computeOffsets(animationMode, colorMode) {
  const ts = getTimestampDecis();
  let colorOffset, bgOffset;

  if (animationMode === 'lsd') {
    colorOffset = (ts * 41) % PALETTE_SIZE;
    bgOffset = (ts * 37) % PALETTE_SIZE;
  } else if (animationMode === 'rainbow' || animationMode === 'p.lsd') {
    colorOffset = (ts * 41) % PALETTE_SIZE;
    bgOffset = (colorOffset + 30) % PALETTE_SIZE;
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
    const idx = ((startIdx + i * CHAR_STRIDE + colorOffset) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE;
    const [r, g, b] = palette[idx];
    result += `${ESC}[1;38;2;${r};${g};${b}m${chars[i]}`;
  }

  return result + `${ESC}[22;39m`;
}

// Dark Rainbow: 어두운 톤 빠른 글자 색상 순환 (p.lsd/lsd 공용)
// 단색 배경 위에서 사용 (bg는 호출 측에서 설정)
const DARK_STRIDE = 11;

export function colorizeTextDark(text, startIdx = 0, colorOffset = 0, animationMode = 'rainbow', colorMode = 'pastel') {
  const palette = getPalette(animationMode, colorMode);
  const chars = [...text];
  let result = '';

  for (let i = 0; i < chars.length; i++) {
    const idx = ((startIdx + i * DARK_STRIDE + colorOffset) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE;
    const [r, g, b] = palette[idx];
    const dr = Math.floor(r * 0.4);
    const dg = Math.floor(g * 0.4);
    const db = Math.floor(b * 0.4);
    result += `${ESC}[38;2;${dr};${dg};${db}m${chars[i]}`;
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
    let idx = (startIdx + i * stride * direction + colorOffset) % PALETTE_SIZE;
    if (idx < 0) idx += PALETTE_SIZE;
    const [r, g, b] = palette[idx];
    result += `${ESC}[48;2;${r};${g};${b}m${fgColor}${chars[i]}`;
  }

  return result + `${ESC}[0m`;
}

// Animated foreground color for a single element (get_animated_color)
export function getAnimatedColor(idx, colorOffset, animationMode, colorMode) {
  const palette = getPalette(animationMode, colorMode);
  const actualIdx = ((idx + colorOffset) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE;
  const [r, g, b] = palette[actualIdx];
  return `${ESC}[1;38;2;${r};${g};${b}m`;
}

// Animated background for bars layout (get_animated_bg)
export function getAnimatedBg(chipIdx, bgOffset, animationMode, colorMode) {
  const palette = getPalette(animationMode, colorMode);
  const actualIdx = ((chipIdx * BAR_BG_STRIDE + bgOffset) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE;
  const [r, g, b] = palette[actualIdx];
  return `${ESC}[48;2;${r};${g};${b}m`;
}

// Animated background for badges layout (get_animated_badge_bg)
export function getAnimatedBadgeBg(elementIdx, bgOffset, animationMode, colorMode) {
  const palette = getPalette(animationMode, colorMode);
  const actualIdx = ((elementIdx * BADGE_BG_STRIDE + bgOffset) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE;
  const [r, g, b] = palette[actualIdx];
  return `${ESC}[48;2;${r};${g};${b}m`;
}

// Animated battery color for card layout (get_animated_battery_color)
// batteryPct = remaining = 100 - contextPct (higher = healthier)
// Thresholds match static mode: contextPct>=70 → critical, >=50 → warning
// In remaining terms: <=30 → critical, <=50 → warning
export function getAnimatedBatteryColor(timestamp, animationMode, colorMode, batteryPct = 100) {
  // Intentional: 2% white flash for sparkle visual effect
  if (Math.random() < FLASH_PROBABILITY) {
    return `${ESC}[48;2;255;255;255m`;
  }

  if (colorMode === 'mono') {
    const idx = timestamp % MONO_GRAYSCALE_RANGE;
    return `${ESC}[48;5;${236 + idx}m`;
  }

  if (animationMode === 'lsd') {
    // LSD: fast cycle(3x) + random perturbation within context-aware range
    let startI = 40, range = 20;
    if (batteryPct <= 30) { startI = 5; range = 21; }
    else if (batteryPct <= 50) { startI = 0; range = 16; }
    const offset = ((timestamp * LSD_SPEED_MULTIPLIER + Math.floor(Math.random() * LSD_RANDOM_PERTURBATION)) % range + range) % range;
    const finalIdx = (startI + offset) % PALETTE_SIZE;
    const [r, g, b] = LSD_COLORS[finalIdx];
    return `${ESC}[48;2;${r};${g};${b}m`;
  }

  // Rainbow: context-aware pastel cycle
  // Normal(>50%): Green/Cyan    indices 44-56 (range 13)
  // Warn(30-50%): Yellow/Orange indices 7-16  (range 10)
  // Crit(<=30%):  Salmon/Rose   indices 18-27 (range 10)
  let startI = 44, range = 13;
  if (batteryPct <= 30) { startI = 18; range = 10; }
  else if (batteryPct <= 50) { startI = 7; range = 10; }
  const offset = ((timestamp % range) + range) % range;
  const finalIdx = (startI + offset) % PALETTE_SIZE;
  const [r, g, b] = RAINBOW_COLORS[finalIdx];
  return `${ESC}[48;2;${r};${g};${b}m`;
}

// Sparkle foreground: solid LSD color per element with random shimmer + flash (for card/twoline/oneline)
export function colorizeFgSparkle(text, elementIdx = 0, bgOffset = 0, colorMode = 'pastel') {
  // Intentional: 3% bright white flash for sparkle effect
  if (Math.random() < SPARKLE_PROBABILITY) {
    return `${ESC}[1;38;2;255;255;255m${text}${ESC}[22;39m`;
  }

  const palette = colorMode === 'mono' ? MONO_CYCLE : LSD_COLORS;
  // Random jitter for per-element shimmer each render
  const jitter = Math.floor(Math.random() * JITTER_RANGE);
  const idx = ((elementIdx + bgOffset + jitter) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE;
  const [r, g, b] = palette[idx];
  return `${ESC}[1;38;2;${r};${g};${b}m${text}${ESC}[22;39m`;
}

// Sparkle background: solid LSD color per badge with random shimmer + flash
export function colorizeBgSparkle(text, elementIdx = 0, bgOffset = 0, colorMode = 'pastel', fgColor = `${ESC}[30m`) {
  // Intentional: 3% bright white flash for sparkle effect
  if (Math.random() < SPARKLE_PROBABILITY) {
    return `${ESC}[48;2;255;255;255m${fgColor}${text}${ESC}[0m`;
  }

  const palette = colorMode === 'mono' ? MONO_CYCLE : LSD_COLORS;
  // Random jitter for per-badge shimmer each render
  const jitter = Math.floor(Math.random() * JITTER_RANGE);
  const idx = ((elementIdx + bgOffset + jitter) % PALETTE_SIZE + PALETTE_SIZE) % PALETTE_SIZE;
  const [r, g, b] = palette[idx];
  return `${ESC}[48;2;${r};${g};${b}m${fgColor}${text}${ESC}[0m`;
}
