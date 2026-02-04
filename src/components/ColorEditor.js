import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Header } from './common/Header.js';
import { HelpBar } from './common/HelpBar.js';
import { ColorBlock } from './common/ColorBlock.js';
import { FG_DEFAULTS, BG_DEFAULTS, loadCustomColors, saveCustomColors, resetToDefaults } from '../utils/colors.js';

const e = React.createElement;

export function ColorEditor({ onBack }) {
  const { exit } = useApp();

  // 색상 데이터 초기화
  const initialColors = loadCustomColors();
  const [fgColors, setFgColors] = useState(initialColors.fg);
  const [bgColors, setBgColors] = useState(initialColors.bg);

  // 선택 상태
  const [category, setCategory] = useState(0); // 0: FG, 1: BG
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modified, setModified] = useState(false);

  // 색상 키 배열
  const fgKeys = Object.keys(FG_DEFAULTS);
  const bgKeys = Object.keys(BG_DEFAULTS);

  const currentKeys = category === 0 ? fgKeys : bgKeys;
  const currentColors = category === 0 ? fgColors : bgColors;
  const currentDefaults = category === 0 ? FG_DEFAULTS : BG_DEFAULTS;
  const currentKey = currentKeys[selectedIndex];
  const currentValue = currentColors[currentKey];

  // 입력 처리
  useInput((input, key) => {
    // 종료
    if (input === 'q' || input === 'Q') {
      if (modified) {
        console.log('\n\x1b[33mUnsaved changes discarded.\x1b[0m');
      }
      if (onBack) {
        onBack();
        return;
      }
      exit();
      return;
    }

    // 저장
    if (input === 's' || input === 'S') {
      const path = saveCustomColors(fgColors, bgColors);
      setModified(false);
      console.log(`\n\x1b[32mSaved to: ${path}\x1b[0m`);
      console.log('\x1b[36mUse theme: export CLAUDE_THEME="custom-<layout>"\x1b[0m\n');
      return;
    }

    // 리셋
    if (input === 'r' || input === 'R') {
      const defaults = resetToDefaults();
      setFgColors(defaults.fg);
      setBgColors(defaults.bg);
      setModified(true);
      return;
    }

    // 카테고리 전환 (Tab)
    if (key.tab) {
      setCategory(prev => (prev + 1) % 2);
      setSelectedIndex(0);
      return;
    }

    // 위/아래 이동
    if (key.upArrow || input === 'k' || input === 'K') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : currentKeys.length - 1));
      return;
    }
    if (key.downArrow || input === 'j' || input === 'J') {
      setSelectedIndex(prev => (prev < currentKeys.length - 1 ? prev + 1 : 0));
      return;
    }

    // 값 조정
    const adjustValue = (delta) => {
      const setter = category === 0 ? setFgColors : setBgColors;
      setter(prev => {
        const newVal = ((prev[currentKey] + delta) % 256 + 256) % 256;
        return { ...prev, [currentKey]: newVal };
      });
      setModified(true);
    };

    if (key.leftArrow || input === 'h' || input === 'H') {
      adjustValue(-1);
    } else if (key.rightArrow || input === 'l' || input === 'L') {
      adjustValue(1);
    } else if (input === '-' || input === '_') {
      adjustValue(-10);
    } else if (input === '+' || input === '=') {
      adjustValue(10);
    } else if (input === '[') {
      adjustValue(-10);
    } else if (input === ']') {
      adjustValue(10);
    }
  });

  // Nearby 팔레트 생성
  const nearbyPalette = useMemo(() => {
    const items = [];
    for (let offset = -5; offset <= 5; offset++) {
      const c = ((currentValue + offset) % 256 + 256) % 256;
      items.push({ code: c, isCurrent: offset === 0 });
    }
    return items;
  }, [currentValue]);

  // 색상 항목 렌더링 함수
  const renderColorItem = (key, i, colors, defaults, isCurrentCategory) => {
    const isSelected = isCurrentCategory && i === selectedIndex;
    const value = colors[key];
    const name = defaults[key].name;
    const isFg = defaults === FG_DEFAULTS;

    return e(Box, { key },
      e(Text, { color: isSelected ? 'green' : undefined },
        isSelected ? '▸ ' : '  '
      ),
      e(Text, { bold: isSelected },
        name.padEnd(12)
      ),
      e(Text, null, ' ['),
      e(ColorBlock, { code: value, isForeground: isFg }),
      e(Text, null, '] ' + String(value).padStart(3, '0'))
    );
  };

  return e(Box, { flexDirection: 'column' },
    e(Header, { title: 'zstheme Color Editor', subtitle: '', version: '2.1' }),

    e(Box, null,
      // 왼쪽: 색상 목록
      e(Box, { flexDirection: 'column', width: 42 },
        // Foreground Colors
        e(Text, { bold: category === 0, color: category === 0 ? 'cyan' : undefined },
          (category === 0 ? '▼' : '►') + ' Foreground Colors'
        ),
        e(Text, { dimColor: true }, '────────────────────────'),

        ...fgKeys.map((key, i) => renderColorItem(key, i, fgColors, FG_DEFAULTS, category === 0)),

        e(Text, null, ' '),

        // Background Colors
        e(Text, { bold: category === 1, color: category === 1 ? 'cyan' : undefined },
          (category === 1 ? '▼' : '►') + ' Background Colors'
        ),
        e(Text, { dimColor: true }, '────────────────────────'),

        ...bgKeys.map((key, i) => renderColorItem(key, i, bgColors, BG_DEFAULTS, category === 1))
      ),

      // 오른쪽: 프리뷰
      e(Box, { flexDirection: 'column', marginLeft: 4 },
        e(Text, { bold: true }, 'Preview'),
        e(Text, { dimColor: true }, '────────────────────────'),
        e(Text, null, ' '),

        // 2line Preview (full)
        e(Text, { dimColor: true }, '─ 2line ─'),
        e(Box, null,
          e(Text, null, `\x1b[38;5;${fgColors.C_BRANCH}m🌿 main\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_TREE}m🌳 project\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_DIR}m📂 src\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_STATUS}m💾 +3  ~2  -0\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_SYNC}m🔮 ↑ 1  ↓ 0\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_CTX}m🔋 35%\x1b[0m`)
        ),
        e(Box, null,
          e(Text, null, `\x1b[38;5;${fgColors.C_MODEL}m🧠 Claude Opus 4.5\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_RATE}m⏳ 2h 30m · 04:00 (42%)\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_TIME}m💬 42m\x1b[0m`),
          e(Text, null, '  '),
          e(Text, null, `\x1b[38;5;${fgColors.C_BURN}m💰 $4.76/h\x1b[0m`)
        ),
        e(Text, null, ' '),

        // badges Preview (full)
        e(Text, { dimColor: true }, '─ badges ─'),
        e(Box, null,
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_BRANCH}m\x1b[38;5;${fgColors.C_BRANCH}m 🌿 main \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_TREE}m\x1b[38;5;${fgColors.C_TREE}m 🌳 project \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_DIR}m\x1b[38;5;${fgColors.C_DIR}m 📂 src \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_STATUS}m\x1b[38;5;${fgColors.C_STATUS}m 💾 +3 ~2 -0 \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_SYNC}m\x1b[38;5;${fgColors.C_SYNC}m 🔮 ↑ 1  ↓ 0 \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[38;5;${fgColors.C_CTX}m🔋 35%\x1b[0m`)
        ),
        e(Box, null,
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_MODEL}m\x1b[38;5;${fgColors.C_MODEL}m 🧠 Opus 4.5 \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_RATE}m\x1b[38;5;${fgColors.C_RATE}m ⏳ 2h·04:00 42% \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_TIME}m\x1b[38;5;${fgColors.C_TIME}m 💬 42m \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[48;5;${bgColors.C_BG_BURN}m\x1b[38;5;${fgColors.C_BURN}m 💰 $4.76/h \x1b[0m`),
          e(Text, null, ' '),
          e(Text, null, `\x1b[38;5;${fgColors.C_RATE}m🎨 badges\x1b[0m`)
        ),
        e(Text, null, ' '),

        e(Text, { dimColor: true }, '────────────────────────'),

        // Current value
        e(Box, null,
          e(Text, null, 'Current: '),
          e(Text, { bold: true }, currentDefaults[currentKey]?.name || currentKey),
          e(Text, null, ' = '),
          e(Text, { color: 'cyan' }, String(currentValue))
        ),

        // Nearby palette
        e(Box, null,
          e(Text, null, 'Nearby: '),
          ...nearbyPalette.map((item, i) =>
            e(Text, { key: i },
              item.isCurrent
                ? `\x1b[1;7;38;5;${item.code}m▓▓\x1b[0m`
                : `\x1b[38;5;${item.code}m▓▓\x1b[0m`
            )
          )
        )
      )
    ),

    e(HelpBar, {
      items: [
        { key: '↑↓', action: 'Select' },
        { key: '←→', action: '±1' },
        { key: '+/-', action: '±10' },
        { key: 'Tab', action: 'Category' },
        { key: 's', action: 'Save' },
        { key: 'r', action: 'Reset' },
        { key: 'q', action: 'Quit' },
      ],
      modified
    })
  );
}
