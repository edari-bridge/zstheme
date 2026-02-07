import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { getAllThemes, getCurrentTheme, sortThemes, getThemeDescription, filterThemesByCategory } from '../utils/themes.js';
import { saveThemeToShellConfig } from '../utils/shell.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';

const e = React.createElement;

// Constants
const GRID_COLS = 3;
const GRID_VISIBLE_ROWS = 6;
const PAGE_SIZE = GRID_COLS * GRID_VISIBLE_ROWS;
const TABS = ['All', 'Standard', 'Custom'];

export function ThemeSelector({ onBack, isLsdUnlocked = false }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns || 120;
  const rows = stdout?.rows || 40;

  // MainMenu/Dashboard와 동일한 크기 정책 사용
  const width = Math.max(80, columns - 4);
  const height = Math.max(28, rows - 4);
  const lsdBorderColor = useLsdBorderAnimation(isLsdUnlocked);

  // ThemeSelector 전용 색상: Magenta
  const baseBorderColor = 'magenta';
  const borderColor = isLsdUnlocked ? lsdBorderColor : baseBorderColor;

  const currentThemeName = getCurrentTheme();
  const allThemes = useMemo(() => {
    const themes = getAllThemes();
    return sortThemes(themes);
  }, []);

  const [activeTab, setActiveTab] = useState('All');

  // Input State
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [toast, setToast] = useState(null);

  // Filter Logic
  const filteredThemes = useMemo(() => filterThemesByCategory(allThemes, activeTab), [allThemes, activeTab]);

  const safeIndex = Math.min(selectedIndex, Math.max(0, filteredThemes.length - 1));
  const selectedTheme = filteredThemes[safeIndex];

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredThemes.length / PAGE_SIZE));
  const currentPage = Math.floor(safeIndex / PAGE_SIZE);
  const startIdx = currentPage * PAGE_SIZE;
  const currentThemesPage = filteredThemes.slice(startIdx, startIdx + PAGE_SIZE);

  // Grid Navigation Helper
  const moveCursor = (direction) => { // 'up', 'down', 'left', 'right'
    let newIndex = safeIndex;
    if (direction === 'right') newIndex += 1;
    if (direction === 'left') newIndex -= 1;
    if (direction === 'up') newIndex -= GRID_COLS;
    if (direction === 'down') newIndex += GRID_COLS;

    // Boundary checks
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= filteredThemes.length) newIndex = filteredThemes.length - 1;

    setSelectedIndex(newIndex);
  };

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
      return;
    }

    if (key.tab) {
      // Cycle Tabs
      const currTabIdx = TABS.indexOf(activeTab);
      const nextTab = TABS[(currTabIdx + 1) % TABS.length];
      setActiveTab(nextTab);
      setSelectedIndex(0);
      return;
    }

    if (key.leftArrow) moveCursor('left');
    if (key.rightArrow) moveCursor('right');
    if (key.upArrow) moveCursor('up');
    if (key.downArrow) moveCursor('down');

    if (key.return) {
      if (selectedTheme) {
        saveThemeToShellConfig(selectedTheme);
        setToast({ type: 'success', text: `Applied theme: ${selectedTheme}` });
        setTimeout(() => setToast(null), 2000);
      }
    }
  });

  // Render Helpers
  const renderTab = (name) => {
    const isActive = activeTab === name;
    return e(Text, {
      color: isActive ? 'black' : 'white',
      backgroundColor: isActive ? 'cyan' : undefined,
      bold: isActive
    }, isActive ? ` [ ${name} ] ` : `   ${name}   `);
  };

  const renderGridItem = (theme, idx) => {
    if (!theme) return e(Box, { width: '32%', height: 1 }); // Placeholder

    const isSelected = (startIdx + idx) === safeIndex;
    const isCurrent = theme === currentThemeName;

    return e(Box, {
      width: '32%',
      height: 1,
      marginBottom: 1,
    },
      e(Text, {
        color: isSelected ? 'black' : (isCurrent ? 'green' : 'white'),
        backgroundColor: isSelected ? 'cyan' : undefined,
        bold: isSelected || isCurrent
      },
        isSelected ? `> ${theme}` : (isCurrent ? `* ${theme}` : `  ${theme}`)
      )
    );
  };

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
      borderTop: false,
      borderLeft: false,
      borderRight: false,
      borderColor: borderColor,
      paddingBottom: 0,
      marginBottom: 1
    },
      e(Text, { bold: true, color: isLsdUnlocked ? 'magenta' : borderColor }, isLsdUnlocked ? ' ✨ EXPLORE THEMES ✨ ' : ' 🎨 EXPLORE THEMES 🎨 ')
    ),

    // Main Content
    e(Box, { flexDirection: 'column', flexGrow: 1, paddingX: 1, width: '100%' },

      // Tabs
      e(Box, { flexDirection: 'row', marginBottom: 1, justifyContent: 'center', gap: 1, width: '100%' },
        renderTab('All'),
        e(Text, { dimColor: true }, '|'),
        renderTab('Standard'),
        e(Text, { dimColor: true }, '|'),
        renderTab('Custom')
      ),

      // Grid Area
      e(Box, {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        borderStyle: 'single',
        borderColor: 'gray',
        padding: 1,
        height: height - 12, // Dynamic height calculation
        width: '100%'
      },
        currentThemesPage.map((theme, i) => renderGridItem(theme, i))
      ),

      // Info Area
      e(Box, { marginTop: 1, borderStyle: 'round', borderColor: 'gray', paddingX: 1, justifyContent: 'center', width: '100%' },
        e(Text, { dimColor: true }, selectedTheme ? getThemeDescription(selectedTheme) : 'Select a theme...')
      ),

      // Pagination Info
      e(Box, { justifyContent: 'center', marginTop: 0, width: '100%' },
        e(Text, { dimColor: true }, `Page ${currentPage + 1} / ${totalPages}  (${filteredThemes.length} themes)`)
      )
    ),

    // Footer
    e(Box, {
      borderStyle: 'single',
      borderBottom: false,
      borderLeft: false,
      borderRight: false,
      borderColor: 'gray',
      marginTop: 0,
      justifyContent: 'space-between',
      width: '100%'
    },
      e(Text, { dimColor: true }, isLsdUnlocked ? 'MODE: LSD ACTIVE' : 'MODE: STANDARD'),
      e(Box, {},
        e(Text, { color: 'green' }, 'ARROWS'), e(Text, { dimColor: true }, ' Navigate '),
        e(Text, { color: 'cyan' }, 'TAB'), e(Text, { dimColor: true }, ' Category '),
        e(Text, { color: 'magenta' }, 'ENTER'), e(Text, { dimColor: true }, ' Apply '),
        e(Text, { color: 'red' }, 'Q'), e(Text, { dimColor: true }, ' Back')
      )
    ),

    toast && e(Box, {
      position: 'absolute',
      bottom: 4,
      alignSelf: 'center',
      borderStyle: 'double',
      borderColor: 'green',
      paddingX: 2,
      backgroundColor: 'black'
    }, e(Text, { color: 'green', bold: true }, toast.text))
  );
}
