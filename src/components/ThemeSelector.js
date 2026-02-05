import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import path from 'path';
import { getAllThemes, getCurrentTheme, getThemeDescription } from '../utils/themes.js';
import { renderThemePreview } from '../utils/preview.js';
import { saveThemeToShellConfig } from '../utils/shell.js';

const e = React.createElement;

const TABS = ['All', '2line', '1line', 'Card', 'Bars', 'Badges'];

export function ThemeSelector({ onBack }) {
  const { exit } = useApp();
  const allThemes = getAllThemes();
  const currentTheme = getCurrentTheme();

  // 상태
  const [activeTab, setActiveTab] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [preview, setPreview] = useState('');

  // Grid 설정
  const COLUMNS = 3;
  const ROWS = 6; // 한 화면에 보여줄 줄 수
  const PAGE_SIZE = COLUMNS * ROWS;

  // 현재 탭에 맞는 테마 필터링
  const currentTabName = TABS[activeTab];

  const filteredThemes = useMemo(() => {
    if (activeTab === 0) return allThemes;
    const filterKey = currentTabName.toLowerCase();
    return allThemes.filter(theme => theme.includes(filterKey));
  }, [activeTab, allThemes, currentTabName]);

  const selectedTheme = filteredThemes[selectedIndex] || filteredThemes[0];
  const description = selectedTheme ? getThemeDescription(selectedTheme) : '';

  // Scroll offset calculation
  // selectedIndex가 현재 페이지 범위를 벗어나면 startOffset을 조정
  const currentRow = Math.floor(selectedIndex / COLUMNS);
  const [startRow, setStartRow] = useState(0);

  useEffect(() => {
    if (currentRow < startRow) {
      setStartRow(currentRow);
    } else if (currentRow >= startRow + ROWS) {
      setStartRow(currentRow - ROWS + 1);
    }
  }, [currentRow, startRow]);

  // 프리뷰 업데이트
  useEffect(() => {
    if (selectedTheme) {
      const p = renderThemePreview(selectedTheme);
      setPreview(p);
    } else {
      setPreview('');
    }
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

    // 탭 네비게이션 (Tab 키)
    if (key.tab) {
      setActiveTab(prev => (prev < TABS.length - 1 ? prev + 1 : 0));
      return;
    }

    // 그리드 네비게이션 (Arrow Keys)
    if (key.leftArrow || input === 'h') {
      const prevIndex = selectedIndex - 1;
      // 같은 행에서 왼쪽으로 이동하거나, 이전 행의 마지막으로 이동
      // 단, 단순 인덱스 감소가 그리드 이동 로직에 부합
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredThemes.length - 1));
    }
    if (key.rightArrow || input === 'l') {
      setSelectedIndex(prev => (prev < filteredThemes.length - 1 ? prev + 1 : 0));
    }
    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => {
        const next = prev - COLUMNS;
        return next >= 0 ? next : prev;
      });
    }
    if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => {
        const next = prev + COLUMNS;
        return next < filteredThemes.length ? next : prev;
      });
    }

    if (key.pageUp) {
      setSelectedIndex(prev => Math.max(0, prev - PAGE_SIZE));
    }
    if (key.pageDown) {
      setSelectedIndex(prev => Math.min(filteredThemes.length - 1, prev + PAGE_SIZE));
    }

    if (key.return) {
      if (!selectedTheme) return;

      const configPath = saveThemeToShellConfig(selectedTheme);
      const configName = path.basename(configPath);

      console.log('');
      console.log(`\x1b[32mTheme '\x1b[1m${selectedTheme}\x1b[22m' saved to ~/${configName}\x1b[0m`);
      console.log('');
      console.log('To apply now, run:');
      console.log(`  \x1b[36msource ~/${configName}\x1b[0m`);
      console.log('');
      exit();
    }
  });

  // Grid Rendering Helper
  const renderGrid = () => {
    if (filteredThemes.length === 0) {
      return e(Box, { height: ROWS + 2, justifyContent: 'center', alignItems: 'center' },
        e(Text, { color: 'gray', italic: true }, 'No themes found')
      );
    }

    const gridRows = [];
    for (let r = 0; r < ROWS; r++) {
      const rowIndex = startRow + r;
      const rowItems = [];

      for (let c = 0; c < COLUMNS; c++) {
        const itemIndex = rowIndex * COLUMNS + c;
        // 범위를 벗어나면 빈 박스만 채움 (레이아웃 유지)
        if (itemIndex >= filteredThemes.length && filteredThemes.length > 0) {
          rowItems.push(e(Box, { key: `${r}-${c}`, width: '33%', paddingX: 1 }));
          continue;
        }
        if (filteredThemes.length === 0) break;


        const theme = filteredThemes[itemIndex];
        const isSelected = itemIndex === selectedIndex;
        const isCurrent = theme === currentTheme;

        rowItems.push(
          e(Box, {
            key: `${r}-${c}`,
            width: '33%', // 3 columns fixed width for alignment
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
          )
        );
      }

      gridRows.push(
        e(Box, { key: `row-${r}`, flexDirection: 'row', marginBottom: 0 },
          ...rowItems
        )
      );
    }

    // minHeight ensures consistent layout even if fewer rows
    return e(Box, { flexDirection: 'column', minHeight: 7 }, ...gridRows);
  };

  return e(Box, { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan', width: 110 },
    // [Header Area]
    e(Box, { justifyContent: 'space-between', marginBottom: 1, paddingX: 1 },
      e(Text, { color: 'magenta', bold: true }, 'Explore Themes'),
      e(Text, { dimColor: true }, `${selectedIndex + 1}/${filteredThemes.length} (Tab: Category)`)
    ),

    // [Tabs]
    e(Box, { flexDirection: 'row', marginBottom: 1, borderStyle: 'single', borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: 'gray', paddingX: 1 },
      ...TABS.map((tab, i) => {
        const isActive = i === activeTab;
        return e(Box, { key: tab, marginRight: 2, paddingBottom: 0 },
          e(Text, {
            color: isActive ? 'yellow' : 'gray',
            bold: isActive,
            underline: isActive
          }, isActive ? `[ ${tab} ]` : `  ${tab}  `)
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
      flexGrow: 1 // Ensure container takes full width
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
      // borderStyle: 'single',
      // borderColor: 'white',
      paddingY: 1,
      paddingX: 2, // Indent content slightly to match border look
      marginTop: 0,
      minHeight: 10
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
