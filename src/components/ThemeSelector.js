import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import path from 'path';
import { getAllThemes, getCurrentTheme, getThemeDescription } from '../utils/themes.js';
import { renderThemePreview } from '../utils/preview.js';
import { saveThemeToShellConfig } from '../utils/shell.js';

const e = React.createElement;

export function ThemeSelector({ onBack }) {
  const { exit } = useApp();
  const themes = getAllThemes();
  const currentTheme = getCurrentTheme();

  // 현재 테마 인덱스 찾기
  const initialIndex = themes.indexOf(currentTheme);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [preview, setPreview] = useState('');

  const selectedTheme = themes[selectedIndex];
  const description = getThemeDescription(selectedTheme);

  // 프리뷰 업데이트
  useEffect(() => {
    const p = renderThemePreview(selectedTheme);
    setPreview(p);
  }, [selectedTheme]);

  useInput((input, key) => {
    if (input === 'q' || input === 'Q' || input === 'b' || key.escape) {
      if (onBack) {
        onBack();
        return;
      }
      exit();
    }

    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : themes.length - 1));
    }

    if (key.downArrow) {
      setSelectedIndex(prev => (prev < themes.length - 1 ? prev + 1 : 0));
    }

    if (key.pageUp) {
      setSelectedIndex(prev => Math.max(0, prev - 5));
    }

    if (key.pageDown) {
      setSelectedIndex(prev => Math.min(themes.length - 1, prev + 5));
    }

    if (key.return) {
      // 선택 완료 - 자동 저장
      const configPath = saveThemeToShellConfig(selectedTheme);
      const configName = path.basename(configPath);

      // 간단한 토스트 메시지 대신 콘솔 로그는 유지하되, UI 상에서 피드백 줄 방법 고려
      // 현재는 기존 로직 유지를 위해 콘솔 출력 후 종료
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
  const visibleCount = 18; // 리스트 높이 늘림
  const halfVisible = Math.floor(visibleCount / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  let endIndex = Math.min(themes.length, startIndex + visibleCount);

  if (endIndex - startIndex < visibleCount) {
    startIndex = Math.max(0, endIndex - visibleCount);
  }

  const visibleThemes = themes.slice(startIndex, endIndex);

  return e(Box, { flexDirection: 'column', padding: 2, borderStyle: 'round', borderColor: 'cyan', width: 90 },
    // Header
    e(Box, { justifyContent: 'space-between', paddingBottom: 1 },
      e(Text, { color: 'magenta', bold: true }, 'Explore Themes'),
      e(Text, { dimColor: true }, `${selectedIndex + 1}/${themes.length}`)
    ),

    e(Box, { flexDirection: 'row' },
      // Left Column: List
      e(Box, { flexDirection: 'column', width: '35%', paddingRight: 2 },
        e(Box, { borderStyle: 'single', borderBottom: true, borderTop: false, borderLeft: false, borderRight: false, marginBottom: 1 },
          e(Text, { bold: true, color: 'cyan' }, 'Theme List')
        ),
        ...visibleThemes.map((theme, i) => {
          const actualIndex = startIndex + i;
          const isSelected = actualIndex === selectedIndex;
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
        e(Box, { flexDirection: 'column', marginBottom: 1 },
          e(Text, { bold: true, color: 'yellow', underline: true }, selectedTheme),
          e(Box, { height: 1 }),
          e(Text, { italic: true, color: 'white' }, description || 'No description available.')
        ),

        // Preview Box
        e(Box, {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          padding: 1,
          marginTop: 1
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
        e(Text, { color: 'yellow' }, '↑↓'),
        ' to navigate, ',
        e(Text, { color: 'yellow' }, 'Enter'),
        ' to apply, ',
        e(Text, { color: 'red' }, 'Back/Q'),
        ' to return'
      )
    )
  );
}
