import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { ColorBlock } from './common/ColorBlock.js';
import {
  FG_DEFAULTS,
  BG_BADGES_DEFAULTS,
  BG_BARS_DEFAULTS,
  LAYOUTS_WITH_BG,
  loadCustomColors,
  saveCustomColors,
  resetToDefaults
} from '../utils/colors.js';
import { VERSION, LAYOUTS, ICONS } from '../constants.js';
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

  // Focus: 0=Settings(Left), 1=Colors(Right)
  const [focusArea, setFocusArea] = useState(1);

  // Colors Navigation
  const [colorCategory, setColorCategory] = useState(0); // 0=FG, 1=BG
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [modified, setModified] = useState(false);
  const [message, setMessage] = useState(null);

  // --- Derived Data ---
  const fgKeys = Object.keys(FG_DEFAULTS);
  const hasBgSupport = LAYOUTS_WITH_BG.includes(layout);
  const bgDefaults = layout === 'bars' ? BG_BARS_DEFAULTS : BG_BADGES_DEFAULTS;
  const bgKeys = layout === 'bars' ? Object.keys(BG_BARS_DEFAULTS) : Object.keys(BG_BADGES_DEFAULTS);

  const currentKeys = colorCategory === 0 ? fgKeys : (hasBgSupport ? bgKeys : []);
  const currentDefaults = colorCategory === 0 ? FG_DEFAULTS : bgDefaults;
  const currentColors = colorCategory === 0 ? fgColors : (layout === 'bars' ? bgBarsColors : bgBadgesColors);
  const setBgColors = layout === 'bars' ? setBgBarsColors : setBgBadgesColors;

  const safeIndex = Math.min(selectedIndex, Math.max(0, currentKeys.length - 1));
  const currentKey = currentKeys[safeIndex];

  const icons = ICONS[iconType];

  // --- Input Handling ---
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      if (onBack) onBack();
      return;
    }

    if (key.tab) {
      setFocusArea(prev => prev === 0 ? 1 : 0);
      return;
    }

    if (focusArea === 0) { // Settings
      if (key.leftArrow || input === 'h') {
        const idx = LAYOUTS.indexOf(layout);
        const next = (idx - 1 + LAYOUTS.length) % LAYOUTS.length;
        setLayout(LAYOUTS[next]);
        setModified(true);
      }
      if (key.rightArrow || input === 'l') {
        const idx = LAYOUTS.indexOf(layout);
        const next = (idx + 1) % LAYOUTS.length;
        setLayout(LAYOUTS[next]);
        setModified(true);
      }
      if (key.upArrow || key.downArrow) {
        setIconType(prev => prev === 'emoji' ? 'nerd' : 'emoji');
        setModified(true);
      }
    }

    if (focusArea === 1) { // Colors
      if (input === 'f') setColorCategory(0);
      if (input === 'b' && hasBgSupport) {
        setColorCategory(1);
        setSelectedIndex(0);
      }

      if (key.upArrow || input === 'k') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
      }
      if (key.downArrow || input === 'j') {
        setSelectedIndex(prev => Math.min(currentKeys.length - 1, prev + 1));
      }

      const adjustValue = (delta) => {
        if (!currentKey) return;
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

  // NOTE: Ink doesn't support raw ANSI strings well inside Text components if they modify layout.
  // We will build a safer preview using standard Text components with RGB colors.
  const renderTopPreview = () => {
    const fg = fgColors;

    // Preview Content Construction
    const Part = ({ icon, label, colorKey }) => {
      // colorKey is from fgColors, which stores ANSI 256 color code (0-255).
      // Ink doesn't support 'ansi256' prop directly on Text, but supports 'color' which can be hex/rgb/keyword.
      // Since we are dealing with 0-255, we can't easily map to RGB without a library.
      // BUT, for the sake of UI stability, let's just show the TEXT intent.
      // Ideally we would map 256 -> hex, but for now let's use a safe fallback or just show the structure.

      // *Correction*: Actually, Ink usually handles 256 colors if the environment supports it, but standard Text color prop expects recognized format.
      // Let's rely on a visual approximation: Green for Branch, Blue for Dir, etc. 
      // Or if we want to be accurate, we'd need a helper.
      // For this "Creative" UI, let's keep it clean and just use safe colors or basic mapping if possible.
      // Users are editing 256 codes, so the number matters more than precise pixel color in this TUI editor if we can't render it perfectly.

      // HOWEVER, to fix the layout crash, we MUST avoid raw \x1b strings.

      return e(Box, {
        borderStyle: 'single', // Use box to simulate prompt block
        borderColor: 'white',
        paddingX: 1,
        marginRight: 1
      },
        e(Text, { color: 'white' }, `${icon} ${label}`)
      );
    };

    return e(Box, {
      flexDirection: 'column',
      width: '100%',
      // height: 8, // Let auto-height handle it to avoid overflow
      borderStyle: 'single',
      borderColor: 'white',
      paddingX: 2,
      paddingY: 1,
      marginBottom: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
      e(Text, { dimColor: true, underline: true, marginBottom: 1 }, `PREVIEW (${layout} style)`),

      // Safe Preview Layout
      e(Box, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
        e(Part, { icon: icons.DIR, label: '~/project', colorKey: 'C_DIR' }),
        e(Part, { icon: icons.BRANCH, label: 'main', colorKey: 'C_BRANCH' }),
        e(Part, { icon: icons.STATUS, label: '+2', colorKey: 'C_STATUS' })
      ),

      e(Box, { marginTop: 1 },
        e(Text, { dimColor: true }, 'Values: '),
        e(Text, { color: 'cyan' }, `Dir:${fg.C_DIR} `),
        e(Text, { color: 'green' }, `Git:${fg.C_BRANCH} `),
        e(Text, { color: 'yellow' }, `Status:${fg.C_STATUS}`)
      )
    );
  };

  /* 
     사용자 요청: 외곽 박스 포커싱(노란색 변경) 기능 해제
     const baseBorderColor = modified ? 'yellow' : 'cyan'; 
  */
  const baseBorderColor = 'cyan';
  const borderColor = isLsdUnlocked ? lsdBorderColor : baseBorderColor;

  /* 
     사용자 요청: 내부 탭 영역 포커싱 강화
     - 외곽 박스는 변하지 않지만, 내부 활성 박스는 modified 상태일 때 노란색으로 강조
  */
  const activeBorderColor = modified ? 'yellow' : 'cyan';

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

    // Top Preview (Safe)
    renderTopPreview(),

    // Bottom Controls (Split)
    e(Box, { flexDirection: 'row', flexGrow: 1, width: '100%', gap: 1 },

      // LEFT: Settings
      e(Box, {
        flexDirection: 'column',
        width: '35%',
        borderStyle: focusArea === 0 ? 'round' : 'single',
        borderColor: focusArea === 0 ? activeBorderColor : 'gray',
        padding: 1
      },
        e(Text, { color: activeBorderColor, bold: true, underline: true }, 'SETTINGS (Tab)'),
        e(Box, { height: 1 }),

        e(Box, { flexDirection: 'column' },
          e(Text, { dimColor: true }, 'Layout Style:'),
          e(Text, { bold: true }, `< ${layout} >`)
        ),
        e(Box, { height: 1 }),

        e(Box, { flexDirection: 'column' },
          e(Text, { dimColor: true }, 'Icon Set:'),
          e(Text, { bold: true }, `< ${iconType} >`)
        ),

        e(Box, { flexGrow: 1 }),
        e(Text, { dimColor: true }, 'S: Save / R: Reset')
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
          e(Text, { color: activeBorderColor, bold: true, underline: true }, `COLORS (${colorCategory === 0 ? 'Fg' : 'Bg'})`),
          hasBgSupport && e(Text, { dimColor: true }, `[F] / [B]`)
        ),

        // Color List
        e(Box, { flexDirection: 'column', flexGrow: 1 },
          currentKeys.map((key, idx) => {
            if (idx < selectedIndex - 5 || idx > selectedIndex + 5) return null;
            const isSelected = idx === selectedIndex;
            const val = currentColors[key];
            return e(Box, { key: key, flexDirection: 'row', justifyContent: 'space-between' },
              e(Text, { color: isSelected ? 'green' : 'white', bold: isSelected },
                isSelected ? `> ${key}` : `  ${key}`
              ),
              e(Text, { color: isSelected ? 'green' : 'white' }, `${val}`)
            );
          })
        ),

        e(Box, { marginTop: 1, borderStyle: 'single', borderLeft: false, borderRight: false, borderBottom: false, borderColor: 'gray' },
          e(Text, { dimColor: true }, `Adj: ← → / +/-`)
        )
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
