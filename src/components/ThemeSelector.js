import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { getAllThemes, getCurrentTheme, sortThemes, parseThemeName, filterThemesByTab, getAvailableTabs } from '../utils/themes.js';
import { renderThemePreview } from '../utils/preview.js';
import { saveThemeToShellConfig } from '../utils/shell.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';
import { ANIMATION_INTERVAL, LSD_COLORS } from '../constants.js';

const e = React.createElement;

// Constants
const GRID_COLS = 3;
const GRID_VISIBLE_ROWS = 3;
const PAGE_SIZE = GRID_COLS * GRID_VISIBLE_ROWS;
const SEP_PREFIX = '__sep_';

function isThemeItem(item) {
  return item && !item.startsWith?.(SEP_PREFIX);
}

function isSep(item) {
  return item && typeof item === 'string' && item.startsWith(SEP_PREFIX);
}

// All / LSD 탭: 레이아웃 그룹 사이에 padding + separator row 삽입
function buildDisplayList(themes, activeTab) {
  if (activeTab !== 'All' && activeTab !== 'LSD') return themes;

  const result = [];
  let lastLayout = null;

  for (const theme of themes) {
    const layout = parseThemeName(theme).layout;
    if (layout !== lastLayout) {
      while (result.length % GRID_COLS !== 0) result.push(null);
      result.push(`${SEP_PREFIX}L_${layout}`);
      result.push(`${SEP_PREFIX}C_${layout}`);
      result.push(`${SEP_PREFIX}R_${layout}`);
    }
    result.push(theme);
    lastLayout = layout;
  }

  return result;
}

// 가장 가까운 테마 아이템으로 스냅
function snapToTheme(list, idx, direction = 1) {
  let i = idx;
  while (i >= 0 && i < list.length && !isThemeItem(list[i])) i += direction;
  if (i >= 0 && i < list.length && isThemeItem(list[i])) return i;
  // 반대 방향 시도
  i = idx;
  while (i >= 0 && i < list.length && !isThemeItem(list[i])) i -= direction;
  if (i >= 0 && i < list.length && isThemeItem(list[i])) return i;
  return 0;
}

export function ThemeSelector({ onBack, isLsdUnlocked = false }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns || 120;
  const rows = stdout?.rows || 40;

  const width = Math.max(80, columns - 4);
  const height = Math.max(28, rows - 4);
  const lsdBorderColor = useLsdBorderAnimation(isLsdUnlocked);

  const baseBorderColor = 'magenta';
  const borderColor = isLsdUnlocked ? lsdBorderColor : baseBorderColor;

  const currentThemeName = getCurrentTheme();
  const allThemes = useMemo(() => {
    const themes = getAllThemes(isLsdUnlocked);
    return sortThemes(themes);
  }, [isLsdUnlocked]);

  const tabs = useMemo(() => getAvailableTabs(isLsdUnlocked), [isLsdUnlocked]);

  const [activeTab, setActiveTab] = useState(isLsdUnlocked ? 'LSD' : 'All');

  // LSD 해금 해제 시 탭 리셋
  useEffect(() => {
    if (!isLsdUnlocked && activeTab === 'LSD') {
      setActiveTab('All');
    }
  }, [isLsdUnlocked, activeTab]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollRow, setScrollRow] = useState(0);
  const [toast, setToast] = useState(null);

  // Filter + display list (All 탭: separator 포함)
  const filteredThemes = useMemo(() => {
    const filtered = filterThemesByTab(allThemes, activeTab, isLsdUnlocked);
    return activeTab === 'LSD' ? sortThemes(filtered, true) : filtered;
  }, [allThemes, activeTab, isLsdUnlocked]);
  const displayList = useMemo(() => buildDisplayList(filteredThemes, activeTab), [filteredThemes, activeTab]);

  const safeIndex = useMemo(() => {
    let idx = Math.min(selectedIndex, Math.max(0, displayList.length - 1));
    if (!isThemeItem(displayList[idx])) {
      idx = snapToTheme(displayList, idx, 1);
    }
    return idx;
  }, [selectedIndex, displayList]);

  const selectedTheme = isThemeItem(displayList[safeIndex]) ? displayList[safeIndex] : null;

  // Animated preview: tick counter for rainbow/lsd themes
  const isAnimatedTheme = useMemo(() => {
    if (!selectedTheme) return false;
    const parsed = parseThemeName(selectedTheme);
    return parsed.animation !== 'static';
  }, [selectedTheme]);

  const [previewTick, setPreviewTick] = useState(0);

  useEffect(() => {
    if (!isAnimatedTheme) return;
    const timer = setInterval(() => {
      setPreviewTick(t => t + 1);
    }, ANIMATION_INTERVAL);
    return () => clearInterval(timer);
  }, [isAnimatedTheme]);

  const preview = useMemo(() => {
    if (!selectedTheme) return '';
    try {
      let result = renderThemePreview(selectedTheme);
      if (parseThemeName(selectedTheme).layout === '1line') {
        result = result.replace(/    /g, '   ');
      }
      return result;
    } catch {
      return '';
    }
  }, [selectedTheme, previewTick]);

  // Row-based scrolling: 선택된 행이 보이도록 scrollRow 조정
  const selectedRow = Math.floor(safeIndex / GRID_COLS);
  const totalRows = Math.ceil(displayList.length / GRID_COLS);
  const maxScrollRow = Math.max(0, totalRows - GRID_VISIBLE_ROWS);

  useEffect(() => {
    setScrollRow(prev => {
      if (selectedRow < prev) return selectedRow;
      if (selectedRow >= prev + GRID_VISIBLE_ROWS) return selectedRow - GRID_VISIBLE_ROWS + 1;
      return prev;
    });
  }, [selectedRow]);

  const startIdx = scrollRow * GRID_COLS;
  const rawPage = displayList.slice(startIdx, startIdx + PAGE_SIZE);
  const currentThemesPage = [...rawPage];
  while (currentThemesPage.length % GRID_COLS !== 0) currentThemesPage.push(null);

  // Grid Navigation (separator/null 건너뛰기)
  const moveCursor = (direction) => {
    let newIndex = safeIndex;
    if (direction === 'right') newIndex += 1;
    if (direction === 'left') newIndex -= 1;
    if (direction === 'up') newIndex -= GRID_COLS;
    if (direction === 'down') newIndex += GRID_COLS;

    newIndex = Math.max(0, Math.min(newIndex, displayList.length - 1));

    if (!isThemeItem(displayList[newIndex])) {
      const dir = (direction === 'left' || direction === 'up') ? -1 : 1;
      const snapped = snapToTheme(displayList, newIndex, dir);
      newIndex = snapped;
    }

    setSelectedIndex(newIndex);
  };

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
      return;
    }

    if (key.tab) {
      const currTabIdx = tabs.indexOf(activeTab);
      let nextIdx;
      if (key.shift) {
        // Shift+Tab: previous tab
        nextIdx = (currTabIdx - 1 + tabs.length) % tabs.length;
      } else {
        // Tab: next tab
        nextIdx = (currTabIdx + 1) % tabs.length;
      }
      setActiveTab(tabs[nextIdx]);
      setSelectedIndex(0);
      setScrollRow(0);
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
    const isLsdTab = name === 'LSD';
    let color, bgColor;

    if (isActive) {
      color = 'black';
      bgColor = isLsdTab ? lsdBorderColor : 'cyan';
    } else {
      color = isLsdTab ? lsdBorderColor : 'white';
      bgColor = undefined;
    }

    return e(Text, {
      color,
      backgroundColor: bgColor,
      bold: isActive
    }, isActive ? ` [ ${name} ] ` : `   ${name}   `);
  };

  const renderGridItem = (theme, idx) => {
    if (isSep(theme)) {
      const pos = theme[SEP_PREFIX.length]; // L, C, R
      const layoutName = theme.slice(SEP_PREFIX.length + 2);
      let content;
      if (pos === 'L') {
        content = e(Text, { dimColor: true }, `  ____`, e(Text, { italic: true }, layoutName), `____`);
      } else {
        content = null;
      }
      return e(Box, { key: `sep-${idx}`, width: '32%', height: 1, marginBottom: 1 }, content);
    }
    if (!theme) return e(Box, { key: `empty-${idx}`, width: '32%', height: 1, marginBottom: 1 });

    const isSelected = (startIdx + idx) === safeIndex;
    const isCurrent = theme === currentThemeName;

    return e(Box, {
      key: theme,
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

  // Grid height: 2 rows × (1 line + 1 marginBottom) + padding 2 + border 2
  const gridHeight = GRID_VISIBLE_ROWS * 2 + 4;

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
      borderColor: 'gray',
      paddingBottom: 0,
      marginBottom: 1
    },
      isLsdUnlocked
        ? e(Text, null, ...[...' ✨ Theme Explorer'].map((ch, i) =>
            e(Text, { key: i, color: LSD_COLORS[(i + LSD_COLORS.indexOf(lsdBorderColor)) % LSD_COLORS.length], bold: true }, ch)
          ))
        : e(Text, { bold: true, color: 'cyan' }, ' 🎨 Theme Explorer')
    ),

    // Main Content
    e(Box, { flexDirection: 'column', flexGrow: 1, paddingX: 1, width: '100%' },

      // Tabs
      e(Box, { flexDirection: 'row', marginBottom: 1, justifyContent: 'center', gap: 1, width: '100%' },
        ...tabs.map((tab, i) => [
          i > 0 && e(Text, { key: `sep-${i}`, dimColor: true }, '|'),
          e(React.Fragment, { key: tab }, renderTab(tab))
        ]).flat().filter(Boolean)
      ),

      // Grid Area
      e(Box, {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        borderStyle: 'single',
        borderColor: 'gray',
        padding: 1,
        height: gridHeight,
        width: '100%'
      },
        currentThemesPage.map((theme, i) => renderGridItem(theme, i))
      ),

      // Preview Area
      e(Box, { flexDirection: 'column', marginTop: 1 },
        preview ? e(Text, {}, (selectedTheme && parseThemeName(selectedTheme).layout !== 'card' ? '\n' : '') + preview) : null
      ),

      // Pagination Info
      e(Box, { justifyContent: 'center', marginTop: 1, width: '100%' },
        e(Text, { dimColor: true }, `${Math.min(scrollRow + GRID_VISIBLE_ROWS, totalRows)} / ${totalRows} rows  (${filteredThemes.length} themes)`)
      )
    ),

    // Footer - MODE label
    e(Box, { justifyContent: 'flex-end', width: '100%', paddingX: 1 },
      isLsdUnlocked
        ? e(Text, null, ...'🌈 LSD MODE ACTIVE 🌈'.split('').map((ch, i) =>
            e(Text, { key: i, color: LSD_COLORS[(i + LSD_COLORS.indexOf(borderColor)) % LSD_COLORS.length], bold: true }, ch)
          ))
        : e(Text, { dimColor: true }, 'MODE: STANDARD')
    ),

    // Footer - Keybindings
    e(Box, {
      borderStyle: 'single',
      borderBottom: false,
      borderLeft: false,
      borderRight: false,
      borderColor: 'gray',
      justifyContent: 'space-between',
      width: '100%'
    },
      e(Box, {},
        e(Text, { color: 'green' }, 'ARROWS'), e(Text, { dimColor: true }, ' Navigate '),
        e(Text, { color: 'cyan' }, 'TAB/S-TAB'), e(Text, { dimColor: true }, ' Category')
      ),
      e(Box, {},
        e(Text, { color: 'magenta' }, 'ENTER'), e(Text, { dimColor: true }, ' Apply '),
        e(Text, { color: 'red' }, 'ESC/Q'), e(Text, { dimColor: true }, ' Back')
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
