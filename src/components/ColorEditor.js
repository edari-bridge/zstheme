import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Header } from './common/Header.js';
import { HelpBar } from './common/HelpBar.js';
import { ColorBlock } from './common/ColorBlock.js';
import {
  FG_DEFAULTS,
  BG_BADGES_DEFAULTS,
  BG_BARS_DEFAULTS,
  ICONS,
  LAYOUTS,
  LAYOUTS_WITH_BG,
  loadCustomColors,
  saveCustomColors,
  resetToDefaults
} from '../utils/colors.js';

const e = React.createElement;

export function ColorEditor() {
  const { exit } = useApp();

  // 색상 데이터 초기화
  const initialColors = loadCustomColors();
  const [fgColors, setFgColors] = useState(initialColors.fg);
  const [bgBadgesColors, setBgBadgesColors] = useState(initialColors.bgBadges);
  const [bgBarsColors, setBgBarsColors] = useState(initialColors.bgBars);
  const [layout, setLayout] = useState(initialColors.layout);
  const [iconType, setIconType] = useState(initialColors.iconType);

  // 포커스 영역: 0=Layout, 1=Icon, 2=FG Colors, 3=BG Colors
  const [focusArea, setFocusArea] = useState(2);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modified, setModified] = useState(false);

  // 색상 키 배열
  const fgKeys = Object.keys(FG_DEFAULTS);
  const bgKeys = layout === 'bars' ? Object.keys(BG_BARS_DEFAULTS) : Object.keys(BG_BADGES_DEFAULTS);
  const bgDefaults = layout === 'bars' ? BG_BARS_DEFAULTS : BG_BADGES_DEFAULTS;
  const bgColors = layout === 'bars' ? bgBarsColors : bgBadgesColors;
  const setBgColors = layout === 'bars' ? setBgBarsColors : setBgBadgesColors;

  // 배경색 지원 여부
  const hasBgSupport = LAYOUTS_WITH_BG.includes(layout);

  // 현재 색상 카테고리 (focusArea 2=FG, 3=BG)
  const colorCategory = focusArea === 3 ? 1 : 0;

  const currentKeys = colorCategory === 0 ? fgKeys : bgKeys;
  const currentColors = colorCategory === 0 ? fgColors : bgColors;
  const currentDefaults = colorCategory === 0 ? FG_DEFAULTS : bgDefaults;

  // 인덱스 범위 보정
  const safeIndex = Math.min(selectedIndex, currentKeys.length - 1);
  const currentKey = currentKeys[safeIndex];
  const currentValue = currentColors[currentKey];

  // 아이콘 가져오기
  const icons = ICONS[iconType];

  // 입력 처리
  useInput((input, key) => {
    // 종료
    if (input === 'q' || input === 'Q') {
      if (modified) {
        console.log('\n\x1b[33mUnsaved changes discarded.\x1b[0m');
      }
      exit();
      return;
    }

    // 저장
    if (input === 's' || input === 'S') {
      const path = saveCustomColors(fgColors, bgBadgesColors, bgBarsColors);
      setModified(false);
      console.log(`\n\x1b[32mSaved to: ${path}\x1b[0m`);
      console.log(`\x1b[36mColors saved. Use with any layout:\x1b[0m`);
      console.log(`\x1b[36m  export CLAUDE_THEME="custom-<layout>[-nerd]"\x1b[0m`);
      console.log(`\x1b[90m  예: custom-2line, custom-badges-nerd, custom-bars\x1b[0m\n`);
      return;
    }

    // 리셋
    if (input === 'r' || input === 'R') {
      const defaults = resetToDefaults();
      setFgColors(defaults.fg);
      setBgBadgesColors(defaults.bgBadges);
      setBgBarsColors(defaults.bgBars);
      setLayout(defaults.layout);
      setIconType(defaults.iconType);
      setFocusArea(2);
      setSelectedIndex(0);
      setModified(true);
      return;
    }

    // Tab: 영역 순환 (Layout → Icon → FG → BG → Layout...)
    if (key.tab) {
      setFocusArea(prev => {
        let next = (prev + 1) % 4;
        // BG 미지원 레이아웃이면 BG 건너뛰기
        if (next === 3 && !hasBgSupport) {
          next = 0;
        }
        return next;
      });
      setSelectedIndex(0);
      return;
    }

    // Layout 영역 (focusArea === 0)
    if (focusArea === 0) {
      if (key.leftArrow || input === 'h') {
        const currentIdx = LAYOUTS.indexOf(layout);
        const nextIdx = (currentIdx - 1 + LAYOUTS.length) % LAYOUTS.length;
        setLayout(LAYOUTS[nextIdx]);
        setModified(true);
      } else if (key.rightArrow || input === 'l') {
        const currentIdx = LAYOUTS.indexOf(layout);
        const nextIdx = (currentIdx + 1) % LAYOUTS.length;
        setLayout(LAYOUTS[nextIdx]);
        setModified(true);
      }
      return;
    }

    // Icon 영역 (focusArea === 1)
    if (focusArea === 1) {
      if (key.leftArrow || key.rightArrow || input === 'h' || input === 'l') {
        setIconType(prev => prev === 'emoji' ? 'nerd' : 'emoji');
        setModified(true);
      }
      return;
    }

    // Colors 영역 (focusArea === 2 또는 3)
    // 위/아래 이동
    if (key.upArrow || input === 'k') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : currentKeys.length - 1));
      return;
    }
    if (key.downArrow || input === 'j') {
      setSelectedIndex(prev => (prev < currentKeys.length - 1 ? prev + 1 : 0));
      return;
    }

    // 값 조정
    const adjustValue = (delta) => {
      const setter = colorCategory === 0 ? setFgColors : setBgColors;
      setter(prev => {
        const newVal = ((prev[currentKey] + delta) % 256 + 256) % 256;
        return { ...prev, [currentKey]: newVal };
      });
      setModified(true);
    };

    if (key.leftArrow || input === 'h') {
      adjustValue(-1);
    } else if (key.rightArrow || input === 'l') {
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
    const isSelected = isCurrentCategory && i === safeIndex;
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

  // 프리뷰 렌더링 - 레이아웃별
  const renderPreview = () => {
    const fg = fgColors;
    const bgB = bgBadgesColors;
    const bgR = bgBarsColors;
    const ic = icons;

    switch (layout) {
      case '1line':
        return e(Box, { flexDirection: 'column' },
          e(Text, { dimColor: true }, `─ 1line-${iconType} ─`),
          e(Box, null,
            e(Text, null, `\x1b[38;5;${fg.C_BRANCH}m${ic.BRANCH}main\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_TREE}m${ic.TREE}project\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_DIR}m${ic.DIR}src\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_STATUS}m${ic.STATUS}+3 ~2 -0\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_SYNC}m${ic.SYNC}↑1 ↓0\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_MODEL}m${ic.MODEL}Opus\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_CTX}m${ic.CTX}35%\x1b[0m`)
          )
        );

      case '2line':
        return e(Box, { flexDirection: 'column' },
          e(Text, { dimColor: true }, `─ 2line-${iconType} ─`),
          e(Box, null,
            e(Text, null, `\x1b[38;5;${fg.C_BRANCH}m${ic.BRANCH}main\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_TREE}m${ic.TREE}project\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_DIR}m${ic.DIR}src\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_STATUS}m${ic.STATUS}+3 ~2 -0\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_SYNC}m${ic.SYNC}↑1 ↓0\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_CTX}m${ic.CTX}35%\x1b[0m`)
          ),
          e(Box, null,
            e(Text, null, `\x1b[38;5;${fg.C_MODEL}m${ic.MODEL}Opus 4.5\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_RATE}m${ic.TIME}2h·04:00 42%\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_TIME}m${ic.SESSION}42m\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_BURN}m${ic.COST}$4.76/h\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_RATE}m${ic.THEME}2line\x1b[0m`)
          )
        );

      case 'card':
        return e(Box, { flexDirection: 'column' },
          e(Text, { dimColor: true }, `─ card-${iconType} ─`),
          e(Text, null, `\x1b[38;5;240m╭────────────────────╮\x1b[0m`),
          e(Box, null,
            e(Text, null, `\x1b[38;5;240m│\x1b[0m `),
            e(Text, null, `\x1b[38;5;${fg.C_BRANCH}m${ic.BRANCH}main\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_TREE}m${ic.TREE}proj\x1b[0m`),
            e(Text, null, ` \x1b[38;5;240m│\x1b[0m`)
          ),
          e(Box, null,
            e(Text, null, `\x1b[38;5;240m│\x1b[0m `),
            e(Text, null, `\x1b[38;5;${fg.C_DIR}m${ic.DIR}src\x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_STATUS}m${ic.STATUS}+3\x1b[0m`),
            e(Text, null, `      \x1b[38;5;240m│\x1b[0m`)
          ),
          e(Text, null, `\x1b[38;5;240m╰────────────────────╯\x1b[0m`)
        );

      case 'bars':
        return e(Box, { flexDirection: 'column' },
          e(Text, { dimColor: true }, `─ bars-${iconType} ─`),
          e(Box, null,
            e(Text, null, `\x1b[48;5;${bgR.C_BG_LOC}m `),
            e(Text, null, `\x1b[38;5;${fg.C_BRANCH}m${ic.BRANCH}main\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_LOC}m  `),
            e(Text, null, `\x1b[38;5;${fg.C_TREE}m${ic.TREE}proj\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_LOC}m  `),
            e(Text, null, `\x1b[38;5;${fg.C_DIR}m${ic.DIR}src\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_LOC}m \x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_GIT}m `),
            e(Text, null, `\x1b[38;5;${fg.C_STATUS}m${ic.STATUS}+3\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_GIT}m  `),
            e(Text, null, `\x1b[38;5;${fg.C_SYNC}m${ic.SYNC}↑1\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_GIT}m \x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_CTX}m${ic.CTX}35%\x1b[0m`)
          ),
          e(Box, null,
            e(Text, null, `\x1b[48;5;${bgR.C_BG_SES}m `),
            e(Text, null, `\x1b[38;5;${fg.C_MODEL}m${ic.MODEL}Opus\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_SES}m  `),
            e(Text, null, `\x1b[38;5;${fg.C_RATE}m${ic.TIME}2h\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_SES}m  `),
            e(Text, null, `\x1b[38;5;${fg.C_TIME}m${ic.SESSION}42m\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_SES}m  `),
            e(Text, null, `\x1b[38;5;${fg.C_BURN}m${ic.COST}$4/h\x1b[0m`),
            e(Text, null, `\x1b[48;5;${bgR.C_BG_SES}m \x1b[0m`),
            e(Text, null, '  '),
            e(Text, null, `\x1b[38;5;${fg.C_RATE}m${ic.THEME}bars\x1b[0m`)
          )
        );

      case 'badges':
        return e(Box, { flexDirection: 'column' },
          e(Text, { dimColor: true }, `─ badges-${iconType} ─`),
          e(Box, null,
            e(Text, null, `\x1b[48;5;${bgB.C_BG_BRANCH}m\x1b[38;5;${fg.C_BRANCH}m ${ic.BRANCH}main \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[48;5;${bgB.C_BG_TREE}m\x1b[38;5;${fg.C_TREE}m ${ic.TREE}proj \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[48;5;${bgB.C_BG_DIR}m\x1b[38;5;${fg.C_DIR}m ${ic.DIR}src \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[48;5;${bgB.C_BG_STATUS}m\x1b[38;5;${fg.C_STATUS}m ${ic.STATUS}+3 \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[48;5;${bgB.C_BG_SYNC}m\x1b[38;5;${fg.C_SYNC}m ${ic.SYNC}↑1 \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[38;5;${fg.C_CTX}m${ic.CTX}35%\x1b[0m`)
          ),
          e(Box, null,
            e(Text, null, `\x1b[48;5;${bgB.C_BG_MODEL}m\x1b[38;5;${fg.C_MODEL}m ${ic.MODEL}Opus \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[48;5;${bgB.C_BG_RATE}m\x1b[38;5;${fg.C_RATE}m ${ic.TIME}2h 42% \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[48;5;${bgB.C_BG_TIME}m\x1b[38;5;${fg.C_TIME}m ${ic.SESSION}42m \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[48;5;${bgB.C_BG_BURN}m\x1b[38;5;${fg.C_BURN}m ${ic.COST}$4/h \x1b[0m`),
            e(Text, null, ' '),
            e(Text, null, `\x1b[38;5;${fg.C_RATE}m${ic.THEME}badges\x1b[0m`)
          )
        );

      default:
        return null;
    }
  };

  return e(Box, { flexDirection: 'column' },
    e(Header, { title: 'zstheme Color Editor', subtitle: '', version: '2.2' }),

    // 레이아웃/아이콘 선택 (프리뷰 전용)
    e(Box, { marginBottom: 1 },
      e(Text, { dimColor: true }, 'Preview:  '),
      e(Text, { color: focusArea === 0 ? 'green' : undefined, bold: focusArea === 0 },
        focusArea === 0 ? '▸ ' : '  '
      ),
      e(Text, { color: focusArea === 0 ? 'cyan' : undefined }, 'Layout '),
      e(Text, { color: 'cyan', bold: true }, `[${layout}]`),
      e(Text, null, '  '),
      e(Text, { color: focusArea === 1 ? 'green' : undefined, bold: focusArea === 1 },
        focusArea === 1 ? '▸ ' : '  '
      ),
      e(Text, { color: focusArea === 1 ? 'magenta' : undefined }, 'Icon '),
      e(Text, { color: 'magenta', bold: true }, `[${iconType}]`),
      e(Text, { dimColor: true }, '  (not saved)')
    ),

    e(Box, null,
      // 왼쪽: 색상 목록
      e(Box, { flexDirection: 'column', width: 42 },
        // Foreground Colors
        e(Text, { bold: focusArea === 2, color: focusArea === 2 ? 'cyan' : undefined },
          (focusArea === 2 ? '▼' : '►') + ' Foreground Colors'
        ),
        e(Text, { dimColor: true }, '────────────────────────'),

        ...fgKeys.map((key, i) => renderColorItem(key, i, fgColors, FG_DEFAULTS, focusArea === 2)),

        e(Text, null, ' '),

        // Background Colors (조건부 활성화)
        e(Text, {
          bold: focusArea === 3,
          color: focusArea === 3 ? 'cyan' : undefined,
          dimColor: !hasBgSupport
        },
          (focusArea === 3 ? '▼' : '►') + ' Background Colors' + (!hasBgSupport ? ' (N/A)' : '')
        ),
        e(Text, { dimColor: !hasBgSupport }, '────────────────────────'),

        ...(hasBgSupport
          ? bgKeys.map((key, i) => renderColorItem(key, i, bgColors, bgDefaults, focusArea === 3))
          : [e(Text, { key: 'na', dimColor: true }, `  ${layout} layout uses no background`)]
        )
      ),

      // 오른쪽: 프리뷰
      e(Box, { flexDirection: 'column', marginLeft: 4 },
        e(Text, { bold: true }, 'Preview'),
        e(Text, { dimColor: true }, '────────────────────────'),
        e(Text, null, ' '),

        renderPreview(),

        e(Text, null, ' '),
        e(Text, { dimColor: true }, '────────────────────────'),

        // Current value (색상 영역일 때만)
        focusArea >= 2 ? e(Box, null,
          e(Text, null, 'Current: '),
          e(Text, { bold: true }, currentDefaults[currentKey]?.name || currentKey),
          e(Text, null, ' = '),
          e(Text, { color: 'cyan' }, String(currentValue))
        ) : e(Box, null,
          e(Text, { dimColor: true }, 'Use ←→ to change value')
        ),

        // Nearby palette (색상 영역일 때만)
        focusArea >= 2 ? e(Box, null,
          e(Text, null, 'Nearby: '),
          ...nearbyPalette.map((item, i) =>
            e(Text, { key: i },
              item.isCurrent
                ? `\x1b[1;7;38;5;${item.code}m▓▓\x1b[0m`
                : `\x1b[38;5;${item.code}m▓▓\x1b[0m`
            )
          )
        ) : null
      )
    ),

    e(HelpBar, {
      items: [
        { key: 'Tab', action: 'Area' },
        { key: '↑↓', action: 'Select' },
        { key: '←→', action: 'Change' },
        { key: '+/-', action: '±10' },
        { key: 's', action: 'Save' },
        { key: 'r', action: 'Reset' },
        { key: 'q', action: 'Quit' },
      ],
      modified
    })
  );
}
