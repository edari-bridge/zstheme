import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { renderCustomPreview, renderLsdPreview } from '../utils/preview.js';
import {
  FG_DEFAULTS,
  BG_BADGES_DEFAULTS,
  BG_BARS_DEFAULTS,
  LAYOUTS_WITH_BG,
  loadCustomColors,
  saveCustomColors,
  resetToDefaults
} from '../utils/colors.js';
import { VERSION, LAYOUTS, ICONS, ANIMATION_INTERVAL } from '../constants.js';
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

  // Reset selectedIndex when layout or colorCategory changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [colorCategory, layout]);

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
  const bgDefaults = layout === 'bars' ? BG_BARS_DEFAULTS : BG_BADGES_DEFAULTS;

  // BG keys: bars uses bars keys, everything else uses badges keys (including non-BG layouts for display)
  const currentBgKeys = layout === 'bars' ? Object.keys(BG_BARS_DEFAULTS) : Object.keys(BG_BADGES_DEFAULTS);
  const currentKeys = colorCategory === 0 ? fgKeys : currentBgKeys;
  const currentColors = colorCategory === 0 ? fgColors : (layout === 'bars' ? bgBarsColors : bgBadgesColors);
  const setBgColors = layout === 'bars' ? setBgBarsColors : setBgBadgesColors;

  const safeIndex = Math.min(selectedIndex, Math.max(0, currentKeys.length - 1));
  const currentKey = currentKeys[safeIndex];

  const icons = ICONS[iconType];

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
        setSelectedIndex(prev => Math.min(currentKeys.length - 1, prev + 1));
      }

      const adjustValue = (delta) => {
        if (!currentKey) return;
        // Block adjustment for BG items on non-BG layouts
        if (colorCategory === 1 && !hasBgSupport) return;
        const setter = colorCategory === 0 ? setFgColors : setBgColors;
        setter(prev => {
          const newVal = ((prev[currentKey] + delta) % 256 + 256) % 256;
          return { ...prev, [currentKey]: newVal };
        });
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
  const activeBorderColor = 'yellow';
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
          e(Text, { color: styleIndex === 0 ? 'green' : 'white', bold: styleIndex === 0, dimColor: styleIndex !== 0 }, styleIndex === 0 ? '> Layout:' : '  Layout:'),
          e(Text, { color: styleIndex === 0 ? 'green' : 'white', bold: styleIndex === 0, dimColor: styleIndex !== 0 }, `  < ${layout} >`)
        ),
        e(Box, { height: 1 }),

        e(Box, { flexDirection: 'column' },
          e(Text, { color: styleIndex === 1 ? 'green' : 'white', bold: styleIndex === 1, dimColor: styleIndex !== 1 }, styleIndex === 1 ? '> Icon:' : '  Icon:'),
          e(Text, { color: styleIndex === 1 ? 'green' : 'white', bold: styleIndex === 1, dimColor: styleIndex !== 1 }, `  < ${iconType} >`)
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
            e(Text, colorCategory === 0 ? { color: 'green', bold: true } : { dimColor: true }, '[F]'),
            e(Text, { dimColor: true }, ' / '),
            e(Text, colorCategory === 1 ? { color: 'green', bold: true } : { dimColor: true }, '[B]')
          )
        ),

        // Color List - Fixed 7-row grid with dedicated arrow rows
        (() => {
          const TOTAL_ROWS = 7;
          const isNonBgLayout = colorCategory === 1 && !hasBgSupport;
          const needsScroll = currentKeys.length > TOTAL_ROWS;

          let showUp = false, showDown = false, visibleCount, scrollOff;

          if (!needsScroll) {
            visibleCount = currentKeys.length;
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
            } else if (off + midCount >= currentKeys.length) {
              // Near bottom: no ↓
              showUp = true;
              visibleCount = edgeCount;
              scrollOff = currentKeys.length - visibleCount;
            } else {
              // Middle: both arrows
              showUp = true;
              showDown = true;
              visibleCount = midCount;
              scrollOff = off;
            }
          }

          const visibleSlice = currentKeys.slice(scrollOff, scrollOff + visibleCount);
          const arrowRows = (showUp ? 1 : 0) + (showDown ? 1 : 0);
          const padCount = Math.max(0, TOTAL_ROWS - visibleCount - arrowRows);

          return e(Box, { flexDirection: 'column', flexGrow: 1 },
            // ↑ arrow (dedicated row)
            showUp ? e(Text, { key: 'arrow-up', dimColor: true }, '  ↑') : null,
            // Visible item rows
            ...visibleSlice.map((key, visIdx) => {
              const actualIdx = scrollOff + visIdx;
              const isSelected = actualIdx === selectedIndex;
              const val = currentColors[key];
              const prefix = isSelected ? '> ' : '  ';

              if (isLsdUnlocked) {
                const sym = LSD_SYMBOLS[(actualIdx + previewTick) % LSD_SYMBOLS.length];
                return e(Box, { key: key, flexDirection: 'row', justifyContent: 'space-between' },
                  e(Text, { color: isSelected ? 'green' : 'white', bold: isSelected }, `${prefix}${key}`),
                  e(Text, { color: lsdBorderColor, bold: true }, sym)
                );
              }

              if (isNonBgLayout) {
                return e(Box, { key: key, flexDirection: 'row', justifyContent: 'space-between' },
                  e(Text, { color: isSelected ? 'green' : 'white', bold: isSelected, dimColor: !isSelected }, `${prefix}${key}`),
                  e(Text, { dimColor: true }, '---')
                );
              }

              return e(Box, { key: key, flexDirection: 'row', justifyContent: 'space-between' },
                e(Text, { color: isSelected ? 'green' : 'white', bold: isSelected }, `${prefix}${key}`),
                e(Text, { color: isSelected ? 'green' : 'white' }, `${val}`)
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
