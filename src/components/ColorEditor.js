import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { renderCustomPreview, renderLsdPreview } from '../utils/preview.js';
import {
  FG_DEFAULTS,
  LAYOUTS_WITH_BG,
  loadCustomColors,
  saveCustomColors,
  resetToDefaults
} from '../utils/colors.js';
import { LAYOUTS, ANIMATION_INTERVAL } from '../constants.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';

const e = React.createElement;

export function ColorEditor({ onBack, isLsdUnlocked = false }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns || 120;
  const rows = stdout?.rows || 40;

  // Layout Constants
  const width = Math.max(80, columns - 4);
  const height = Math.max(30, rows - 4);

  const lsdBorderColor = useLsdBorderAnimation(isLsdUnlocked);

  // --- State Initialization ---
  const initialColors = loadCustomColors();
  const [fgColors, setFgColors] = useState(initialColors.fg);
  const [bgBadgesColors, setBgBadgesColors] = useState(initialColors.bgBadges);
  const [bgBarsColors, setBgBarsColors] = useState(initialColors.bgBars);
  const [layout, setLayout] = useState(initialColors.layout);
  const [iconType, setIconType] = useState(initialColors.iconType);

  // Focus: 0=Settings(Left), 1=Colors(Right) — default to Colors
  const [focusArea, setFocusArea] = useState(1);

  // Style Navigation: 0=Layout, 1=Icon
  const [styleIndex, setStyleIndex] = useState(0);

  // Colors Navigation
  const [colorCategory, setColorCategory] = useState(0); // 0=FG, 1=BG
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [modified, setModified] = useState(false);
  const [message, setMessage] = useState(null);

  // Reset selectedIndex when layout changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [layout]);

  // LSD animation ticker
  const [previewTick, setPreviewTick] = useState(0);
  useEffect(() => {
    if (!isLsdUnlocked) return;
    const timer = setInterval(() => setPreviewTick(t => t + 1), ANIMATION_INTERVAL);
    return () => clearInterval(timer);
  }, [isLsdUnlocked]);

  // --- Derived Data ---
  const fgKeys = Object.keys(FG_DEFAULTS);
  const hasBgSupport = LAYOUTS_WITH_BG.includes(layout);

  // 1line은 C_TIME, C_BURN 미포함
  const LAYOUT_EXCLUDED_KEYS = { '1line': ['C_TIME', 'C_BURN'] };
  const excludedKeys = LAYOUT_EXCLUDED_KEYS[layout] || [];

  // FG → BG 매핑: badges는 1:1, bars는 그룹 매핑
  const fgToBgBadges = (fgKey) => fgKey.replace('C_', 'C_BG_');
  const FG_TO_BG_BARS = {
    C_BRANCH: 'C_BG_LOC', C_TREE: 'C_BG_LOC', C_DIR: 'C_BG_LOC',
    C_STATUS: 'C_BG_GIT', C_SYNC: 'C_BG_GIT',
    C_MODEL: 'C_BG_SES', C_RATE: 'C_BG_SES', C_TIME: 'C_BG_SES', C_BURN: 'C_BG_SES',
  };

  const getBgInfo = (fgKey) => {
    if (!hasBgSupport) return { bgKey: null, bgVal: null };
    if (layout === 'bars') {
      const bgKey = FG_TO_BG_BARS[fgKey];
      return { bgKey, bgVal: bgBarsColors[bgKey] };
    }
    const bgKey = fgToBgBadges(fgKey);
    return { bgKey, bgVal: bgBadgesColors[bgKey] };
  };

  const safeIndex = Math.min(selectedIndex, Math.max(0, fgKeys.length - 1));

  // LSD mode: symbols cycle per tick
  const LSD_SYMBOLS = ['✦', '◈', '◇', '△', '○', '◎'];

  // --- Input Handling ---
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      if (onBack) onBack();
      else exit();
      return;
    }

    if (key.tab) {
      setFocusArea(prev => prev === 0 ? 1 : 0);
      return;
    }

    if (focusArea === 0) { // Style
      if (key.upArrow || input === 'k') {
        setStyleIndex(prev => Math.max(0, prev - 1));
      }
      if (key.downArrow || input === 'j') {
        setStyleIndex(prev => Math.min(1, prev + 1));
      }
      if (key.leftArrow || input === 'h') {
        if (styleIndex === 0) {
          const idx = LAYOUTS.indexOf(layout);
          setLayout(LAYOUTS[(idx - 1 + LAYOUTS.length) % LAYOUTS.length]);
        } else {
          setIconType(prev => prev === 'emoji' ? 'nerd' : 'emoji');
        }
        setModified(true);
      }
      if (key.rightArrow || input === 'l') {
        if (styleIndex === 0) {
          const idx = LAYOUTS.indexOf(layout);
          setLayout(LAYOUTS[(idx + 1) % LAYOUTS.length]);
        } else {
          setIconType(prev => prev === 'emoji' ? 'nerd' : 'emoji');
        }
        setModified(true);
      }
    }

    if (focusArea === 1) { // Colors
      if (input === 'f') setColorCategory(0);
      if (input === 'b') {
        setColorCategory(1);
      }

      if (key.upArrow || input === 'k') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      }
      if (key.downArrow || input === 'j') {
        setSelectedIndex(prev => Math.min(fgKeys.length - 1, prev + 1));
      }

      const adjustValue = (delta) => {
        const fgKey = fgKeys[safeIndex];
        if (!fgKey || excludedKeys.includes(fgKey)) return;

        if (colorCategory === 0) {
          setFgColors(prev => {
            const newVal = ((prev[fgKey] + delta) % 256 + 256) % 256;
            return { ...prev, [fgKey]: newVal };
          });
        } else {
          if (!hasBgSupport) return;
          const { bgKey } = getBgInfo(fgKey);
          if (!bgKey) return;
          const setter = layout === 'bars' ? setBgBarsColors : setBgBadgesColors;
          setter(prev => {
            const newVal = ((prev[bgKey] + delta) % 256 + 256) % 256;
            return { ...prev, [bgKey]: newVal };
          });
        }
        setModified(true);
      };

      if (key.leftArrow) adjustValue(-1);
      if (key.rightArrow) adjustValue(1);
      if (input === '+' || input === '=') adjustValue(10);
      if (input === '-' || input === '_') adjustValue(-10);
    }

    if (input === 's') {
      saveCustomColors(fgColors, bgBadgesColors, bgBarsColors);
      setModified(false);
      setMessage({ type: 'success', text: 'Settings Saved!' });
      setTimeout(() => setMessage(null), 2000);
    }
    if (input === 'r') {
      const defaults = resetToDefaults();
      setFgColors(defaults.fg);
      setBgBadgesColors(defaults.bgBadges);
      setBgBarsColors(defaults.bgBars);
      setLayout(defaults.layout);
      setIconType(defaults.iconType);
      setModified(true);
      setMessage({ type: 'info', text: 'Reset to Defaults' });
      setTimeout(() => setMessage(null), 2000);
    }
  });

  // --- Render Helpers ---

  const preview = useMemo(() => {
    try {
      if (isLsdUnlocked) {
        return renderLsdPreview(layout, iconType);
      }
      let result = renderCustomPreview(layout, iconType, fgColors, bgBadgesColors, bgBarsColors);
      if (layout === '1line') result = result.replace(/    /g, '  ');
      return result;
    } catch { return ''; }
  }, [isLsdUnlocked, layout, iconType, fgColors, bgBadgesColors, bgBarsColors, previewTick]);

  /* 
     사용자 요청: 외곽 박스 포커싱(노란색 변경) 기능 해제
     const baseBorderColor = modified ? 'yellow' : 'cyan'; 
  */
  const baseBorderColor = 'cyan';
  const borderColor = isLsdUnlocked ? lsdBorderColor : baseBorderColor;

  // 포커스된 탭은 항상 yellow로 조작 가능 상태 표시
  const activeBorderColor = 'green';
  const titleColor = isLsdUnlocked ? lsdBorderColor : 'cyan';

  return e(Box, {
    flexDirection: 'column',
    width,
    height,
    borderStyle: 'double',
    borderColor: borderColor,
    paddingX: 1
  },
    // Header
    e(Box, {
      justifyContent: 'center',
      borderStyle: 'single',
      borderTop: false, borderLeft: false, borderRight: false,
      borderColor: borderColor,
      paddingBottom: 0,
      marginBottom: 1,
      width: '100%'
    },
      e(Text, { bold: true, color: borderColor }, ' 🎨 COLOR EDITOR 🎨 ')
    ),

    // Top Preview (Real Renderer)
    e(Box, { flexDirection: 'column', width: '100%', height: 11, paddingX: 2, marginBottom: 1, alignItems: 'center' },
      e(Text, { dimColor: true, underline: true }, isLsdUnlocked ? 'PREVIEW (lsd style)' : `PREVIEW (${layout} style)`),
      preview ? e(Box, { marginTop: 1 }, e(Text, {}, (layout !== 'card' ? '\n' : '') + preview)) : null
    ),

    // Bottom Controls (Split)
    e(Box, { flexDirection: 'row', width: '100%', gap: 1 },

      // LEFT: Settings
      e(Box, {
        flexDirection: 'column',
        width: '35%',
        borderStyle: focusArea === 0 ? 'round' : 'single',
        borderColor: focusArea === 0 ? activeBorderColor : 'gray',
        padding: 1
      },
        e(Text, { color: titleColor, bold: true, underline: true }, 'STYLE'),
        e(Box, { height: 1 }),

        e(Box, { flexDirection: 'column' },
          e(Text, { color: focusArea === 0 && styleIndex === 0 ? 'green' : 'white', bold: focusArea === 0 && styleIndex === 0 }, focusArea === 0 && styleIndex === 0 ? '> Layout:' : '  Layout:'),
          e(Text, { color: focusArea === 0 && styleIndex === 0 ? 'green' : 'white', bold: focusArea === 0 && styleIndex === 0 }, `  < ${layout} >`)
        ),
        e(Box, { height: 1 }),

        e(Box, { flexDirection: 'column' },
          e(Text, { color: focusArea === 0 && styleIndex === 1 ? 'green' : 'white', bold: focusArea === 0 && styleIndex === 1 }, focusArea === 0 && styleIndex === 1 ? '> Icon:' : '  Icon:'),
          e(Text, { color: focusArea === 0 && styleIndex === 1 ? 'green' : 'white', bold: focusArea === 0 && styleIndex === 1 }, `  < ${iconType} >`)
        ),

      ),

      // RIGHT: Colors
      e(Box, {
        flexDirection: 'column',
        width: '65%',
        borderStyle: focusArea === 1 ? 'round' : 'single',
        borderColor: focusArea === 1 ? activeBorderColor : 'gray',
        padding: 1
      },
        e(Box, { justifyContent: 'space-between', marginBottom: 1 },
          e(Text, { color: titleColor, bold: true, underline: true }, 'COLORS'),
          e(Box, {},
            e(Text, { color: focusArea === 1 && colorCategory === 0 ? 'green' : 'white', bold: focusArea === 1 && colorCategory === 0 }, '[F]'),
            e(Text, { color: 'white' }, ' / '),
            e(Text, { color: focusArea === 1 && colorCategory === 1 && hasBgSupport ? 'green' : 'white', bold: focusArea === 1 && colorCategory === 1 && hasBgSupport, dimColor: !hasBgSupport }, '[B]')
          )
        ),

        // Color List - Fixed 7-row grid with dedicated arrow rows
        (() => {
          const TOTAL_ROWS = 7;
          const needsScroll = fgKeys.length > TOTAL_ROWS;

          let showUp = false, showDown = false, visibleCount, scrollOff;

          if (!needsScroll) {
            visibleCount = fgKeys.length;
            scrollOff = 0;
          } else {
            const midCount = TOTAL_ROWS - 2; // 5 items when both arrows
            const edgeCount = TOTAL_ROWS - 1; // 6 items when one arrow
            let off = selectedIndex - Math.floor(midCount / 2);

            if (off <= 0) {
              // Near top: no ↑
              scrollOff = 0;
              showDown = true;
              visibleCount = edgeCount;
            } else if (off + midCount >= fgKeys.length) {
              // Near bottom: no ↓
              showUp = true;
              visibleCount = edgeCount;
              scrollOff = fgKeys.length - visibleCount;
            } else {
              // Middle: both arrows
              showUp = true;
              showDown = true;
              visibleCount = midCount;
              scrollOff = off;
            }
          }

          const visibleSlice = fgKeys.slice(scrollOff, scrollOff + visibleCount);
          const arrowRows = (showUp ? 1 : 0) + (showDown ? 1 : 0);
          const padCount = Math.max(0, TOTAL_ROWS - visibleCount - arrowRows);

          return e(Box, { flexDirection: 'column', flexGrow: 1 },
            // ↑ arrow (dedicated row)
            showUp ? e(Text, { key: 'arrow-up', dimColor: true }, '  ↑') : null,
            // Visible item rows
            ...visibleSlice.map((fgKey, visIdx) => {
              const actualIdx = scrollOff + visIdx;
              const isFocused = focusArea === 1;
              const isSelected = isFocused && actualIdx === selectedIndex;
              const prefix = isSelected ? '> ' : '  ';

              if (isLsdUnlocked) {
                const sym = LSD_SYMBOLS[(actualIdx + previewTick) % LSD_SYMBOLS.length];
                return e(Box, { key: fgKey, flexDirection: 'row', justifyContent: 'space-between' },
                  e(Text, { color: isSelected ? 'green' : 'white', bold: isSelected }, `${prefix}${fgKey}`),
                  e(Text, { color: lsdBorderColor, bold: true }, sym)
                );
              }

              const isExcluded = excludedKeys.includes(fgKey);
              const fgVal = fgColors[fgKey];
              const { bgVal } = getBgInfo(fgKey);
              const fgActive = isFocused && colorCategory === 0 && isSelected && !isExcluded;
              const bgActive = isFocused && colorCategory === 1 && isSelected && !isExcluded;

              return e(Box, { key: fgKey, flexDirection: 'row', justifyContent: 'space-between' },
                e(Text, { color: isSelected ? 'green' : 'white', bold: isSelected, dimColor: isFocused && isExcluded && !isSelected }, `${prefix}${FG_DEFAULTS[fgKey].name}`),
                e(Box, { flexDirection: 'row', gap: 2 },
                  e(Text, { color: fgActive ? 'green' : 'white', bold: fgActive, dimColor: isFocused && (isExcluded || colorCategory !== 0) },
                    isExcluded ? '---' : `${fgVal}`
                  ),
                  e(Text, { color: bgActive ? 'green' : 'white', bold: bgActive, dimColor: !hasBgSupport || (isFocused && (isExcluded || colorCategory !== 1)) },
                    (!hasBgSupport || isExcluded) ? '---' : `${bgVal}`
                  )
                )
              );
            }),
            // ↓ arrow (dedicated row)
            showDown ? e(Text, { key: 'arrow-down', dimColor: true }, '  ↓') : null,
            // Padding to fill TOTAL_ROWS
            ...Array.from({ length: padCount }, (_, i) =>
              e(Box, { key: `pad-${i}` }, e(Text, {}, ' '))
            )
          );
        })()
      )
    ),

    // Help text (outside grid boxes, vertically centered in remaining space)
    e(Box, { flexDirection: 'row', flexGrow: 1, width: '100%', gap: 1, paddingX: 1, alignItems: 'center' },
      e(Box, { width: '50%' },
        e(Text, {}, 'S Save  R Reset  Esc/Q Quit  Tab Switch')
      ),
      e(Box, { width: '50%' },
        e(Text, {}, '↑↓ Select  ←→ Adjust  +/- ±10  F/B FG·BG')
      )
    ),

    // Toast
    message && e(Box, {
      position: 'absolute', bottom: 2, alignSelf: 'center',
      borderStyle: 'double', borderColor: message.type === 'success' ? 'green' : 'white',
      backgroundColor: 'black', paddingX: 2
    }, e(Text, { color: message.type === 'success' ? 'green' : 'white' }, message.text))
  );
}
