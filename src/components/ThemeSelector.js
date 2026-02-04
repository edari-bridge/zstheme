import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Header } from './common/Header.js';
import { HelpBar } from './common/HelpBar.js';
import { getAllThemes, getCurrentTheme, getThemeDescription } from '../utils/themes.js';
import { renderThemePreview } from '../utils/preview.js';

const e = React.createElement;

export function ThemeSelector() {
  const { exit } = useApp();
  const themes = getAllThemes();
  const currentTheme = getCurrentTheme();

  // 현재 테마 인덱스 찾기
  const initialIndex = themes.indexOf(currentTheme);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [preview, setPreview] = useState('');

  const selectedTheme = themes[selectedIndex];

  // 프리뷰 업데이트
  useEffect(() => {
    const p = renderThemePreview(selectedTheme);
    setPreview(p);
  }, [selectedTheme]);

  useInput((input, key) => {
    if (input === 'q' || input === 'Q') {
      exit();
    }

    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : themes.length - 1));
    }

    if (key.downArrow) {
      setSelectedIndex(prev => (prev < themes.length - 1 ? prev + 1 : 0));
    }

    if (key.return) {
      // 선택 완료 - 적용 안내 출력
      console.log('');
      console.log(`\x1b[32mTheme '\x1b[1m${selectedTheme}\x1b[22m' selected!\x1b[0m`);
      console.log('');
      console.log('To apply, add this to your shell config (~/.zshrc or ~/.bashrc):');
      console.log('');
      console.log(`  \x1b[36mexport CLAUDE_THEME="${selectedTheme}"\x1b[0m`);
      console.log('');
      exit();
    }
  });

  // 보이는 범위 계산 (스크롤)
  const visibleCount = 15;
  const halfVisible = Math.floor(visibleCount / 2);
  let startIndex = Math.max(0, selectedIndex - halfVisible);
  let endIndex = Math.min(themes.length, startIndex + visibleCount);

  if (endIndex - startIndex < visibleCount) {
    startIndex = Math.max(0, endIndex - visibleCount);
  }

  const visibleThemes = themes.slice(startIndex, endIndex);

  return e(Box, { flexDirection: 'column' },
    e(Header, null),

    e(Box, { marginBottom: 1 },
      e(Text, { bold: true }, 'Select a theme: '),
      e(Text, { dimColor: true }, '(↑↓ to navigate, Enter to apply, q to quit)')
    ),

    // 테마 목록
    e(Box, { flexDirection: 'row' },
      // 왼쪽: 테마 목록
      e(Box, { flexDirection: 'column', width: 45 },
        ...visibleThemes.map((theme, i) => {
          const actualIndex = startIndex + i;
          const isSelected = actualIndex === selectedIndex;
          const isCurrent = theme === currentTheme;
          const desc = getThemeDescription(theme);

          return e(Box, { key: theme },
            e(Text, { color: isSelected ? 'green' : undefined },
              isSelected ? '▸ ' : '  '
            ),
            e(Text, { bold: isSelected, color: isCurrent ? 'green' : 'cyan' },
              theme
            ),
            e(Text, { dimColor: true }, '  - ' + desc)
          );
        }),

        // 스크롤 인디케이터
        e(Box, { marginTop: 1 },
          e(Text, { dimColor: true },
            `${selectedIndex + 1}/${themes.length}` +
            (startIndex > 0 ? ' ↑' : '') +
            (endIndex < themes.length ? ' ↓' : '')
          )
        )
      ),

      // 오른쪽: 프리뷰
      e(Box, { flexDirection: 'column', marginLeft: 4 },
        e(Text, { color: 'yellow' }, '━━━ Preview ━━━'),
        e(Box, { marginTop: 1 },
          e(Text, null, preview)
        )
      )
    ),

    e(HelpBar, {
      items: [
        { key: '↑↓', action: 'Navigate' },
        { key: 'Enter', action: 'Select' },
        { key: 'q', action: 'Quit' },
      ]
    })
  );
}
