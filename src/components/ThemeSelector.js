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

  // 현재 탭에 맞는 테마 필터링
  const currentTabName = TABS[activeTab];

  // Memoized filtered themes to avoid recalculation on every render
  const filteredThemes = useMemo(() => {
    if (activeTab === 0) return allThemes; // All

    const filterKey = currentTabName.toLowerCase();
    return allThemes.filter(theme => {
      // "2line", "1line" 등은 테마명에 포함되어 있음
      // 예: "rainbow-2line-nerd" -> includes "2line"
      return theme.includes(filterKey);
    });
  }, [activeTab, allThemes, currentTabName]);

  // 초기 진입 시 현재 테마가 있는 탭과 인덱스로 이동 (Optional enhancement)
  // 현재는 단순하게 탭 변경시 인덱스 0으로 리셋하는 로직 사용

  const selectedTheme = filteredThemes[selectedIndex] || filteredThemes[0];
  const description = selectedTheme ? getThemeDescription(selectedTheme) : '';

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
  }, [activeTab]);

  useInput((input, key) => {
    if (input === 'q' || input === 'Q' || input === 'b' || key.escape) {
      if (onBack) {
        onBack();
        return;
      }
      exit();
    }

    // 탭 네비게이션
    if (key.leftArrow || input === 'h') {
      setActiveTab(prev => (prev > 0 ? prev - 1 : TABS.length - 1));
      return; // 탭 변경 시 리스트 이동 방지
    }
    if (key.rightArrow || input === 'l' || key.tab) {
      setActiveTab(prev => (prev < TABS.length - 1 ? prev + 1 : 0));
      return;
    }

    // 리스트 네비게이션
    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredThemes.length - 1));
    }

    if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => (prev < filteredThemes.length - 1 ? prev + 1 : 0));
    }

    if (key.pageUp) {
      setSelectedIndex(prev => Math.max(0, prev - 5));
    }

    if (key.pageDown) {
      setSelectedIndex(prev => Math.min(filteredThemes.length - 1, prev + 5));
    }

    if (key.return) {
      if (!selectedTheme) return;

      // 선택 완료 - 자동 저장
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

  // 보이는 범위 계산 (스크롤)
  const visibleCount = 18;
  const halfVisible = Math.floor(visibleCount / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  let endIndex = Math.min(filteredThemes.length, startIndex + visibleCount);

  if (endIndex - startIndex < visibleCount) {
    startIndex = Math.max(0, endIndex - visibleCount);
  }

  // 범위 보정 (필터링된 개수가 visibleCount보다 적을 때)
  if (filteredThemes.length <= visibleCount) {
    startIndex = 0;
    endIndex = filteredThemes.length;
  }

  const visibleList = filteredThemes.slice(startIndex, endIndex);

  return e(Box, { flexDirection: 'column', padding: 2, borderStyle: 'round', borderColor: 'cyan', width: 90 },
    // Header
    e(Box, { justifyContent: 'space-between', marginBottom: 1 },
      e(Text, { color: 'magenta', bold: true }, 'Explore Themes'),
      e(Text, { dimColor: true }, `${selectedIndex + 1}/${filteredThemes.length}`)
    ),

    // Tabs
    e(Box, { flexDirection: 'row', marginBottom: 1, borderStyle: 'single', borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, borderColor: 'gray' },
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

    e(Box, { flexDirection: 'row' },
      // Left Column: List
      e(Box, { flexDirection: 'column', width: '35%', paddingRight: 2 },
        // Empty list handling
        visibleList.length === 0 ?
          e(Text, { color: 'gray', italic: true }, 'No themes found') :
          visibleList.map((theme, i) => {
            const actualIndex = startIndex + i; // 원래 인덱스 (현재 필터링된 배열 기준)
            // const actualIndex = i; // visibleList 내부 인덱스
            // 위 로직에서 map의 i는 visibleList의 인덱스이므로,
            // 전체 리스트(filteredThemes)에서의 인덱스와 비교하려면 startIndex를 더해야 함.

            const isSelected = (startIndex + i) === selectedIndex;
            const isCurrent = theme === currentTheme;

            return e(Box, { key: theme },
              e(Text, { color: isSelected ? 'green' : 'gray' },
                isSelected ? '❯ ' : '  '
              ),
              e(Text, {
                color: isSelected ? 'white' : (isCurrent ? 'green' : 'gray'),
                bold: isSelected,
                backgroundColor: isSelected ? '#333' : undefined
              },
                theme + (isCurrent ? ' *' : '')
              )
            );
          })
      ),

      // Right Column: Detail & Preview
      e(Box, { flexDirection: 'column', width: '65%', paddingLeft: 1 },
        // Theme Info Card
        selectedTheme ? e(Box, { flexDirection: 'column', marginBottom: 1 },
          e(Text, { bold: true, color: 'yellow', underline: true }, selectedTheme),
          e(Box, { height: 1 }),
          e(Text, { italic: true, color: 'white' }, description || 'No description available.')
        ) : e(Text, null, ''),

        // Preview Box
        e(Box, {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          padding: 1,
          marginTop: 1,
          minHeight: 10
        },
          e(Text, { dimColor: true, marginBottom: 1 }, 'Terminal Preview'),
          e(Text, null, preview)
        )
      )
    ),

    // Footer
    e(Box, {
      marginTop: 1,
      paddingTop: 1,
      borderStyle: 'single',
      borderTop: true,
      borderBottom: false,
      borderLeft: false,
      borderRight: false,
      borderColor: 'gray'
    },
      e(Text, { dimColor: true },
        'Use ',
        e(Text, { color: 'yellow' }, '←→'),
        ' tabs, ',
        e(Text, { color: 'yellow' }, '↑↓'),
        ' navigate, ',
        e(Text, { color: 'yellow' }, 'Enter'),
        ' apply'
      )
    )
  );
}
