import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { getAllThemes, getCurrentTheme, getThemeDescription, sortThemes, parseThemeName } from '../utils/themes.js';
import { renderThemePreview, renderThemePreviewAsync } from '../utils/preview.js';
import { saveThemeToShellConfig } from '../utils/shell.js';
import { GRID_COLUMNS, GRID_VISIBLE_ROWS } from '../constants.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';

const e = React.createElement;

// User Requested Order: 1line, 2line, Badges, Bars, Card, Lab
const BASE_TABS = ['All', '1line', '2line', 'Badges', 'Bars', 'Card', 'Lab'];

export function ThemeSelector({ onBack, isLsdUnlocked = false }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const columns = stdout?.columns || 120;
  const rows = stdout?.rows || 40;
  const currentTheme = getCurrentTheme();

  // Dynamic sizing (with minimums)
  const width = Math.max(80, columns - 4);
  const height = Math.max(28, rows - 4);

  // 상태
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [preview, setPreview] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [savedTheme, setSavedTheme] = useState(null);
  const [backSelected, setBackSelected] = useState(false);

  // LSD Visuals
  const borderColor = useLsdBorderAnimation(isLsdUnlocked);

  // lsd unlocked 상태에 따라 테마 목록 다시 가져옴
  const allThemes = useMemo(() => sortThemes(getAllThemes(isLsdUnlocked), isLsdUnlocked), [isLsdUnlocked]);


  // Dynamic Tabs
  const TABS = useMemo(() => isLsdUnlocked ? [...BASE_TABS.filter(t => t !== 'LSD'), 'LSD'] : BASE_TABS, [isLsdUnlocked]);

  // 현재 탭에 맞는 테마 필터링
  const currentTabName = TABS[activeTab] || TABS[0];

  const filteredThemes = useMemo(() => {
    if (currentTabName === 'Lab') {
      return ['plasma-badges', 'neon-badges', 'noise-badges'];
    }
    if (activeTab === 0) return allThemes;
    const filterKey = currentTabName.toLowerCase();
    return allThemes.filter(theme => theme.includes(filterKey));
  }, [activeTab, allThemes, currentTabName]);

  const selectedTheme = filteredThemes[selectedIndex] || filteredThemes[0];
  const description = selectedTheme ? getThemeDescription(selectedTheme) : '';

  // Auto-Tab Sync (Visual only)
  // 'All' 탭일 때 스크롤 위치(선택된 테마)에 따라 상단 탭 하이라이트 변경
  const visualActiveTab = useMemo(() => {
    if (activeTab !== 0 || !selectedTheme) return activeTab;
    const { layout } = parseThemeName(selectedTheme);
    // TABS is now dynamic
    const tabIndex = TABS.findIndex(t => t.toLowerCase() === layout.toLowerCase());
    return tabIndex > -1 ? tabIndex : 0;
  }, [activeTab, selectedTheme]);


  // [Grid Data Construction]
  // Themes + Dividers를 포함한 "Visual Rows" 생성
  // Output: Array of { type: 'theme' | 'divider', items?: number[], label?: string }
  const gridRows = useMemo(() => {
    const rows = [];
    if (filteredThemes.length === 0) return rows;

    let currentRowItems = [];
    let lastLayout = '';

    filteredThemes.forEach((theme, index) => {
      const { layout } = parseThemeName(theme);

      // Divider Check (Only for 'All' tab)
      if (activeTab === 0 && layout !== lastLayout) {
        // Push remaining items in current row before adding divider
        if (currentRowItems.length > 0) {
          rows.push({ type: 'theme', items: currentRowItems });
          currentRowItems = [];
        }

        // Add Spacer (Empty Row) before Divider if it's not the first group
        if (lastLayout !== '') {
          rows.push({ type: 'spacer' });
        }

        // Add Divider
        // Capitalize layout name for display
        const label = layout.charAt(0).toUpperCase() + layout.slice(1);
        rows.push({ type: 'divider', label });
        lastLayout = layout;
      }

      // Add item to current row
      currentRowItems.push(index);

      // If row full, push it
      if (currentRowItems.length === GRID_COLUMNS) {
        rows.push({ type: 'theme', items: currentRowItems });
        currentRowItems = [];
      }
    });

    // Push remaining items
    if (currentRowItems.length > 0) {
      rows.push({ type: 'theme', items: currentRowItems });
    }

    return rows;
  }, [filteredThemes, activeTab]);


  // [Navigation & Scrolling]

  // Calculate current visual row index based on selectedIndex
  const currentVisualRowIndex = useMemo(() => {
    return gridRows.findIndex(row => row.type === 'theme' && row.items.includes(selectedIndex));
  }, [gridRows, selectedIndex]);

  // Scroll State
  const [startRow, setStartRow] = useState(0);

  useEffect(() => {
    // Keep selection in view
    if (currentVisualRowIndex < startRow) {
      setStartRow(currentVisualRowIndex);
    } else if (currentVisualRowIndex >= startRow + GRID_VISIBLE_ROWS) {
      setStartRow(currentVisualRowIndex - GRID_VISIBLE_ROWS + 1);
    }
  }, [currentVisualRowIndex, startRow]);


  // Preview update effect
  useEffect(() => {
    let isMounted = true;
    let timer = null;

    // Initial render (sync/fast)
    const initial = selectedTheme ? renderThemePreview(selectedTheme) : '';
    setPreview(initial);

    // Animation loop for Rainbow/LSD/Lab
    const isAnimated = selectedTheme && (
      selectedTheme.includes('rainbow') ||
      selectedTheme.includes('lsd') ||
      selectedTheme.includes('plasma') ||
      selectedTheme.includes('neon') ||
      selectedTheme.includes('noise')
    );

    if (isAnimated) {
      // 100ms interval for smooth animation
      timer = setInterval(() => {
        if (!isMounted) return;

        renderThemePreviewAsync(selectedTheme).then(result => {
          if (isMounted) setPreview(result);
        });
      }, 100);
    }

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [selectedTheme]);

  // 탭 변경 시 인덱스 리셋
  useEffect(() => {
    setSelectedIndex(0);
    setStartRow(0);
  }, [activeTab]);

  useInput((input, key) => {
    if (input === 'q' || input === 'Q' || input === 'b' || key.escape) {
      if (onBack) {
        onBack();
        return;
      }
      exit();
    }

    // Back 선택 상태에서 Enter
    if (key.return && backSelected) {
      if (onBack) {
        onBack();
        return;
      }
      exit();
    }

    // 탭 네비게이션 (Tab 키)
    if (key.tab) {
      if (key.shift) {
        // Shift+Tab: Previous Tab
        setActiveTab(prev => (prev > 0 ? prev - 1 : TABS.length - 1));
      } else {
        // Tab: Next Tab
        setActiveTab(prev => (prev < TABS.length - 1 ? prev + 1 : 0));
      }
      setBackSelected(false);
      return;
    }

    // 그리드 네비게이션 (Arrow Keys)
    if (key.leftArrow || input === 'h') {
      if (!backSelected) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredThemes.length - 1));
      }
    }
    if (key.rightArrow || input === 'l') {
      if (!backSelected) {
        setSelectedIndex(prev => (prev < filteredThemes.length - 1 ? prev + 1 : 0));
      }
    }

    if (key.upArrow || input === 'k') {
      // Back 선택 상태면 무시 (이미 맨 위)
      if (backSelected) return;

      if (currentVisualRowIndex === -1) return;

      const currentColumn = gridRows[currentVisualRowIndex].items.indexOf(selectedIndex);
      let targetRowIndex = currentVisualRowIndex - 1;

      // Skip dividers and spacers
      while (targetRowIndex >= 0 && (gridRows[targetRowIndex].type === 'divider' || gridRows[targetRowIndex].type === 'spacer')) {
        targetRowIndex--;
      }

      if (targetRowIndex >= 0) {
        const targetRow = gridRows[targetRowIndex];
        const targetItemIndex = Math.min(currentColumn, targetRow.items.length - 1);
        setSelectedIndex(targetRow.items[targetItemIndex]);
      } else {
        // 맨 위에서 Up → Back 선택
        setBackSelected(true);
      }
    }

    if (key.downArrow || input === 'j') {
      // Back 선택 상태에서 Down → 그리드로 복귀
      if (backSelected) {
        setBackSelected(false);
        return;
      }

      // Find next theme row
      if (currentVisualRowIndex === -1) return;

      const currentColumn = gridRows[currentVisualRowIndex].items.indexOf(selectedIndex);
      let targetRowIndex = currentVisualRowIndex + 1;

      // Skip dividers and spacers
      while (targetRowIndex < gridRows.length && (gridRows[targetRowIndex].type === 'divider' || gridRows[targetRowIndex].type === 'spacer')) {
        targetRowIndex++;
      }

      if (targetRowIndex < gridRows.length) {
        const targetRow = gridRows[targetRowIndex];
        const targetItemIndex = Math.min(currentColumn, targetRow.items.length - 1);
        setSelectedIndex(targetRow.items[targetItemIndex]);
      }
    }

    if (key.pageUp) {
      // Simple approach: move index back by (COL * ROWS)
      setSelectedIndex(prev => Math.max(0, prev - (GRID_COLUMNS * GRID_VISIBLE_ROWS)));
    }
    if (key.pageDown) {
      setSelectedIndex(prev => Math.min(filteredThemes.length - 1, prev + (GRID_COLUMNS * GRID_VISIBLE_ROWS)));
    }

    if (key.return) {
      if (!selectedTheme) return;

      saveThemeToShellConfig(selectedTheme);
      setSavedTheme(selectedTheme);
      setShowMessage(true);

      // 2초 후 메시지 숨기기
      setTimeout(() => {
        setShowMessage(false);
        setSavedTheme(null);
      }, 2000);
    }
  });

  // Grid Rendering Helper
  const renderGrid = () => {
    if (gridRows.length === 0) {
      return e(Box, { height: GRID_VISIBLE_ROWS + 2, justifyContent: 'center', alignItems: 'center' },
        e(Text, { color: 'gray', italic: true }, 'No themes found')
      );
    }

    const renderedRows = [];
    const visibleGridRows = gridRows.slice(startRow, startRow + GRID_VISIBLE_ROWS);

    // Padding for empty rows if filteredThemes is small logic is implicit via minHeight

    visibleGridRows.forEach((row, r) => {
      if (row.type === 'spacer') {
        renderedRows.push(
          e(Box, { key: `spacer-${startRow + r}`, width: '100%', height: 1 })
        );
      } else if (row.type === 'divider') {
        renderedRows.push(
          e(Box, { key: `div-${startRow + r}`, width: '100%', marginBottom: 0, paddingX: 1, borderStyle: 'single', borderLeft: false, borderRight: false, borderTop: false, borderColor: 'gray' },
            e(Text, { dimColor: true, italic: true }, ` ${row.label} `)
          )
        );
      } else {
        const rowItems = row.items.map((itemIndex, c) => {
          const theme = filteredThemes[itemIndex];
          const isSelected = itemIndex === selectedIndex;
          const isCurrent = theme === currentTheme;

          return e(Box, {
            key: `theme-${itemIndex}`,
            width: '33%',
            paddingX: 1
          },
            e(Text, {
              color: isSelected ? 'green' : (isCurrent ? 'cyan' : 'gray'),
              bold: isSelected,
              backgroundColor: isSelected ? '#333' : undefined,
              wrap: 'truncate-end'
            },
              (isSelected ? '❯ ' : '  ') + theme + (isCurrent ? ' *' : '')
            )
          );
        });

        // Fill empty columns if row is not full
        while (rowItems.length < GRID_COLUMNS) {
          rowItems.push(e(Box, { key: `empty-${rowItems.length}`, width: '33%', paddingX: 1 }));
        }

        renderedRows.push(
          e(Box, { key: `row-${startRow + r}`, flexDirection: 'row', marginBottom: 0 },
            ...rowItems
          )
        );
      }
    });

    return e(Box, { flexDirection: 'column', minHeight: 7 }, ...renderedRows);
  };

  return e(Box, {
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 1,
    borderStyle: 'round',
    borderColor: borderColor,
    width,
    height
  },
    // [Header Area]
    e(Box, { justifyContent: 'space-between', marginBottom: 1, paddingX: 1 },
      e(Box, null,
        e(Text, { color: backSelected ? 'green' : 'gray', bold: backSelected }, backSelected ? '❯ ← Back to Menu  ' : '  ← Back to Menu  '),
        e(Text, { color: isLsdUnlocked ? borderColor : 'magenta', bold: true }, isLsdUnlocked ? '✨ Explore Themes (LSD Active) ✨' : 'Explore Themes')
      ),
      e(Text, { dimColor: true }, `${selectedIndex + 1}/${filteredThemes.length} (Tab: Category)`)
    ),

    // [Toast Message - Theme Saved]
    showMessage && savedTheme ? e(Box, {
      justifyContent: 'center',
      marginBottom: 1
    },
      e(Box, {
        borderStyle: 'round',
        borderColor: 'green',
        paddingX: 2
      },
        e(Text, { color: 'green', bold: true },
          `✓ Theme '${savedTheme}' saved!`
        )
      )
    ) : null,

    // [Tabs]
    e(Box, { flexDirection: 'row', marginBottom: 1, borderStyle: 'single', borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: 'gray', paddingX: 1 },
      ...TABS.map((tab, i) => {
        const isActive = i === visualActiveTab; // Use visualActiveTab for highlighting
        // If it's a "Ghost" activation (activeTab != i but visualActiveTab == i), maybe use different style?
        // User asked for "Tracked", so just bold/yellow similar to active is fine.
        // Let's make "Real" active tab underlined, and "tracked" just colored.
        const isRealActive = i === activeTab;

        // If we are in 'All' tab, current 'All' tab is active, but we illuminate the sub-category.
        // Actually typical UX: The 'All' tab stays active, but the sub-category lights up too? Or the sub-category lights up INSTEAD?
        // Let's make 'All' always highlighted if selected, and sub-category highlighted if tracked.

        let color = 'gray';
        if (isRealActive) color = 'yellow';
        else if (isActive && activeTab === 0) color = 'cyan'; // Tracked category in All mode

        return e(Box, { key: tab, marginRight: 2, paddingBottom: 0 },
          e(Text, {
            color: color,
            bold: isActive || isRealActive,
            underline: isRealActive // Only the actually selected tab is underlined
          }, (isRealActive || isActive) ? `[ ${tab} ]` : `  ${tab}  `)
        );
      })
    ),

    // [Top: Theme Grid]
    e(Box, {
      flexDirection: 'column',
      marginBottom: 1,
      borderStyle: 'single',
      borderColor: 'gray',
      padding: 1,
      flexGrow: 1
    },
      renderGrid()
    ),

    // [Bottom: Info & Preview]
    // Theme Title & Desc
    selectedTheme ? e(Box, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0, paddingX: 1 },
      e(Text, { bold: true, color: 'yellow' }, selectedTheme),
      e(Text, { italic: true, color: 'white' }, description || '')
    ) : null,

    // Full Width Preview Card
    e(Box, {
      flexDirection: 'column',
      paddingY: 1,
      paddingX: 2,
      marginTop: 0,
      minHeight: 10,
      width: '100%'
    },
      e(Text, null, preview)
    ),

    // Footer
    e(Box, {
      marginTop: 1,
      paddingX: 1
    },
      e(Text, { dimColor: true },
        'Use ',
        e(Text, { color: 'yellow' }, 'Tab'),
        ' category, ',
        e(Text, { color: 'yellow' }, 'Arrow Keys'),
        ' navigate, ',
        e(Text, { color: 'yellow' }, 'Enter'),
        ' apply'
      )
    )
  );
}
