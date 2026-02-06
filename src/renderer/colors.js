// Color initialization (ported from pastel.sh / mono.sh / custom.sh)
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const ESC = '\x1b';
const RST = `${ESC}[0m`;
const fg = (code) => `${ESC}[38;5;${code}m`;
const bg = (code) => `${ESC}[48;5;${code}m`;
const fgBold = (code) => `${ESC}[1;38;5;${code}m`;

// Emoji icons
const EMOJI_ICONS = {
  BRANCH: '\u{1F531}',   // 🔱
  TREE: '\u{1F33F}',     // 🌿
  DIR: '\u{1F4C2}',      // 📂
  GIT_STATUS: '\u{1F4BE}', // 💾
  SYNC: '\u{1F52E}',     // 🔮
  MODEL: '\u{1F9E0}',    // 🧠
  TIME: '\u23F3',        // ⏳
  SESSION: '\u{1F4AC}',  // 💬
  COST: '\u{1F4B0}',     // 💰
  THEME: '\u{1F3A8}',    // 🎨
  CTX_NORM: '\u{1F50B}', // 🔋
  CTX_WARN: '\u{1FAB3}', // 🪫
  CTX_CRIT: '\u{1F525}', // 🔥
};

// Nerd font icons
const NERD_ICONS = {
  BRANCH: '\u{F062C} ',   // 󰘬
  TREE: '\u{F0645} ',     // 󰙅
  DIR: '\u{F0770} ',      // 󰝰
  GIT_STATUS: '\u{F02A4} ', // 󰊤
  SYNC: '\u{F04E6} ',     // 󰓦
  MODEL: '\u{F06A9} ',    // 󰚩
  TIME: '\u{F0150} ',     // 󰅐
  SESSION: '\u{F0B7B} ',  // 󰭻
  COST: '\u{F01BC} ',     // 󰆼
  THEME: '\u{F027C} ',    // 󰉼
  CTX_NORM: '\u{F0079} ', // 󰁹
  CTX_WARN: '\u{F007B} ', // 󰁻
  CTX_CRIT: '\u{F0238} ', // 󰈸
};

function loadCustomColorCodes() {
  const customFile = join(homedir(), '.config', 'zstheme', 'custom-color.sh');
  const codes = {};
  if (!existsSync(customFile)) return codes;
  try {
    const content = readFileSync(customFile, 'utf-8');
    const re = /^(\w+)_CODE=(\d+)/gm;
    let m;
    while ((m = re.exec(content)) !== null) {
      codes[m[1]] = parseInt(m[2], 10);
    }
  } catch { /* empty */ }
  return codes;
}

export function initColors(colorMode, iconMode, contextPct, animationMode) {
  const icons = iconMode === 'nerd' ? NERD_ICONS : EMOJI_ICONS;

  // Determine context icon
  let ctxIcon, ctxText, iCtx, batFill;
  if (contextPct >= 70) {
    ctxIcon = icons.CTX_CRIT;
    ctxText = `${ESC}[1;91m`;
    iCtx = `${ESC}[1;91m`;
    batFill = bg(52);
  } else if (contextPct >= 50) {
    ctxIcon = icons.CTX_WARN;
    ctxText = fgBold(208);
    iCtx = fgBold(208);
    batFill = bg(94);
  } else {
    ctxIcon = icons.CTX_NORM;
    ctxText = colorMode === 'mono' ? fg(250) : RST;
    iCtx = fg(92);
    batFill = colorMode === 'mono' ? bg(237) : bg(23);
  }

  if (colorMode === 'mono') {
    return initMonoColors(contextPct, icons, iconMode, ctxIcon, ctxText, iCtx, batFill);
  }

  if (colorMode === 'custom') {
    return initCustomColors(contextPct, icons, iconMode, ctxIcon, ctxText, iCtx, batFill);
  }

  return initPastelColors(contextPct, icons, iconMode, ctxIcon, ctxText, iCtx, batFill);
}

function initPastelColors(contextPct, icons, iconMode, ctxIcon, ctxText, iCtx, batFill) {
  let cBranch, cTree, cDir, cModel, cStatus, cSync;

  if (contextPct >= 70) {
    cBranch = `${ESC}[1;93m`; cTree = `${ESC}[1;92m`; cDir = `${ESC}[1;96m`;
    cModel = `${ESC}[1;95m`; cStatus = fgBold(153); cSync = fgBold(183);
  } else if (contextPct >= 50) {
    cBranch = `${ESC}[1;33m`; cTree = `${ESC}[1;32m`; cDir = `${ESC}[1;36m`;
    cModel = `${ESC}[1;35m`; cStatus = fgBold(117); cSync = fgBold(147);
  } else {
    cBranch = `${ESC}[93m`; cTree = `${ESC}[92m`; cDir = `${ESC}[96m`;
    cModel = `${ESC}[95m`; cStatus = fg(111); cSync = fg(141);
  }

  return {
    RST,
    // Foreground
    C_BRANCH: cBranch, C_TREE: cTree, C_DIR: cDir, C_MODEL: cModel,
    C_STATUS: cStatus, C_SYNC: cSync,
    C_DIM_STATUS: fg(111), C_BRIGHT_STATUS: fgBold(153),
    C_DIM_SYNC: fg(141), C_BRIGHT_SYNC: fgBold(183),
    C_RATE: fg(229), C_BURN: fg(216), C_TIME: fg(75),
    // Icon colors
    C_I_BRANCH: `${ESC}[93m`, C_I_TREE: `${ESC}[92m`, C_I_DIR: `${ESC}[96m`,
    C_I_MODEL: `${ESC}[95m`, C_I_STATUS: fg(111), C_I_SYNC: fg(141),
    C_I_CTX: iCtx, C_I_RATE: fg(229), C_I_BURN: fg(216), C_I_TIME: fg(75),
    C_I_THEME: fg(229),
    // Context
    CTX_ICON: ctxIcon, C_CTX_TEXT: ctxText,
    // Background (badges)
    C_BG_BRANCH: bg(58), C_BG_TREE: bg(22), C_BG_DIR: bg(23),
    C_BG_STATUS: bg(24), C_BG_SYNC: bg(53), C_BG_MODEL: bg(53),
    C_BG_RATE: bg(58), C_BG_TIME: bg(24), C_BG_BURN: bg(94),
    C_BG_CTX: bg(22), C_BG_CTX_WARN: bg(94), C_BG_CTX_CRIT: bg(52),
    // Background (bars)
    C_BG_LOC: bg(23), C_BG_GIT: bg(24), C_BG_SES: bg(53),
    // Box/chip
    C_BOX: fg(240), C_CHIP: fg(245),
    // Battery
    C_BAT_EMPTY: bg(236), C_BAT_FILL: batFill,
    // Icons
    icons,
    iconMode,
  };
}

function initMonoColors(contextPct, icons, iconMode, ctxIcon, ctxText, iCtx, batFill) {
  const BASE = fg(250);
  let cBranch, cTree, cDir, cModel;

  if (contextPct >= 70) {
    cBranch = fg(255); cTree = fg(255); cDir = fg(255); cModel = fg(255);
  } else if (contextPct >= 50) {
    cBranch = fg(250); cTree = fg(250); cDir = fg(250); cModel = fg(250);
  } else {
    cBranch = BASE; cTree = BASE; cDir = BASE; cModel = BASE;
  }

  return {
    RST,
    C_BRANCH: cBranch, C_TREE: cTree, C_DIR: cDir, C_MODEL: cModel,
    C_STATUS: BASE, C_SYNC: BASE,
    C_DIM_STATUS: BASE, C_BRIGHT_STATUS: fgBold(252),
    C_DIM_SYNC: BASE, C_BRIGHT_SYNC: fgBold(250),
    C_RATE: BASE, C_BURN: BASE, C_TIME: BASE,
    C_I_BRANCH: `${ESC}[93m`, C_I_TREE: `${ESC}[92m`, C_I_DIR: `${ESC}[96m`,
    C_I_MODEL: `${ESC}[95m`, C_I_STATUS: fg(111), C_I_SYNC: fg(141),
    C_I_CTX: iCtx, C_I_RATE: fg(229), C_I_BURN: fg(216), C_I_TIME: fg(75),
    C_I_THEME: fg(229),
    CTX_ICON: ctxIcon, C_CTX_TEXT: ctxText,
    C_BG_BRANCH: bg(236), C_BG_TREE: bg(241), C_BG_DIR: bg(234),
    C_BG_STATUS: bg(239), C_BG_SYNC: bg(235), C_BG_MODEL: bg(240),
    C_BG_RATE: bg(237), C_BG_TIME: bg(242), C_BG_BURN: bg(235),
    C_BG_CTX: bg(236), C_BG_CTX_WARN: bg(240), C_BG_CTX_CRIT: bg(244),
    C_BG_LOC: bg(239), C_BG_GIT: bg(237), C_BG_SES: bg(233),
    C_BOX: fg(240), C_CHIP: fg(242),
    C_BAT_EMPTY: bg(236), C_BAT_FILL: batFill,
    icons,
    iconMode,
  };
}

function initCustomColors(contextPct, icons, iconMode, ctxIcon, ctxText, iCtx, batFill) {
  const cc = loadCustomColorCodes();
  const g = (key, def) => cc[key] ?? def;

  const branchCode = g('C_BRANCH', 93);
  const treeCode = g('C_TREE', 92);
  const dirCode = g('C_DIR', 96);
  const modelCode = g('C_MODEL', 95);
  const statusCode = g('C_STATUS', 111);
  const syncCode = g('C_SYNC', 141);
  const rateCode = g('C_RATE', 229);
  const burnCode = g('C_BURN', 216);
  const timeCode = g('C_TIME', 75);

  const bold = contextPct >= 50;
  const mkFg = bold ? fgBold : fg;

  return {
    RST,
    C_BRANCH: mkFg(branchCode), C_TREE: mkFg(treeCode), C_DIR: mkFg(dirCode),
    C_MODEL: mkFg(modelCode), C_STATUS: mkFg(statusCode), C_SYNC: mkFg(syncCode),
    C_DIM_STATUS: fg(statusCode), C_BRIGHT_STATUS: fgBold(statusCode),
    C_DIM_SYNC: fg(syncCode), C_BRIGHT_SYNC: fgBold(syncCode),
    C_RATE: fg(rateCode), C_BURN: fg(burnCode), C_TIME: fg(timeCode),
    C_I_BRANCH: fg(branchCode), C_I_TREE: fg(treeCode), C_I_DIR: fg(dirCode),
    C_I_MODEL: fg(modelCode), C_I_STATUS: fg(statusCode), C_I_SYNC: fg(syncCode),
    C_I_CTX: iCtx, C_I_RATE: fg(rateCode), C_I_BURN: fg(burnCode), C_I_TIME: fg(timeCode),
    C_I_THEME: fg(229),
    CTX_ICON: ctxIcon, C_CTX_TEXT: ctxText,
    C_BG_BRANCH: bg(g('C_BG_BRANCH', 58)), C_BG_TREE: bg(g('C_BG_TREE', 22)),
    C_BG_DIR: bg(g('C_BG_DIR', 23)), C_BG_STATUS: bg(g('C_BG_STATUS', 24)),
    C_BG_SYNC: bg(g('C_BG_SYNC', 53)), C_BG_MODEL: bg(g('C_BG_MODEL', 53)),
    C_BG_RATE: bg(58), C_BG_TIME: bg(24), C_BG_BURN: bg(94),
    C_BG_CTX: bg(22), C_BG_CTX_WARN: bg(94), C_BG_CTX_CRIT: bg(52),
    C_BG_LOC: bg(g('C_BG_LOC', 23)), C_BG_GIT: bg(g('C_BG_GIT', 24)),
    C_BG_SES: bg(g('C_BG_SES', 53)),
    C_BOX: fg(240), C_CHIP: fg(245),
    C_BAT_EMPTY: bg(236), C_BAT_FILL: batFill,
    icons,
    iconMode,
  };
}

export function getRateColor(rateLimitPct, colorMode, colors) {
  if (colorMode === 'mono') {
    if (rateLimitPct >= 80) return fgBold(255);
    if (rateLimitPct >= 50) return fgBold(250);
    return fg(245);
  }
  if (rateLimitPct >= 80) return `${ESC}[1;91m`;
  if (rateLimitPct >= 50) return fgBold(208);
  if (colors?.C_RATE) return colors.C_RATE;
  return fg(229);
}
