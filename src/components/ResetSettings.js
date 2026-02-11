import React, { useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { resetTheme } from '../utils/shell.js';
import { uninstallAllSkills } from '../utils/skills.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';

const e = React.createElement;

const MENU_ITEMS = [
  { id: 'header_reset', label: 'RESET OPTIONS', type: 'header' },
  { id: 'theme', label: 'Reset Theme Only' },
  { id: 'skills', label: 'Uninstall All Skills' },
  { id: 'all', label: 'Factory Reset (All Settings)' },
  { id: 'header_nav', label: 'NAVIGATION', type: 'header' },
  { id: 'back', label: 'Cancel & Return', type: 'action' },
];

export function ResetSettings({ onBack, isLsdUnlocked = false }) {
  const { stdout } = useStdout();
  const columns = stdout?.columns || 120;
  const rows = stdout?.rows || 40;

  // MainMenu/ThemeSelector와 동일한 크기 정책 사용
  const width = Math.max(80, columns - 4);
  const height = Math.max(28, rows - 4);

  const lsdBorderColor = useLsdBorderAnimation(isLsdUnlocked);
  const baseBorderColor = 'red';
  const borderColor = isLsdUnlocked ? lsdBorderColor : baseBorderColor;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState(null);

  // 헤더 제외한 네비게이션 가능 아이템 필터링
  const navigableItems = MENU_ITEMS.filter(item => item.type !== 'header');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onBack();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : navigableItems.length - 1));
      setMessage(null);
    }

    if (key.downArrow) {
      setSelectedIndex(prev => (prev < navigableItems.length - 1 ? prev + 1 : 0));
      setMessage(null);
    }

    if (key.return) {
      const selected = navigableItems[selectedIndex];

      if (selected.id === 'back') {
        onBack();
        return;
      }

      let results = [];

      if (selected.id === 'theme' || selected.id === 'all') {
        resetTheme();
        results.push('Theme');
      }

      if (selected.id === 'skills' || selected.id === 'all') {
        const skillResult = uninstallAllSkills();
        if (skillResult.count > 0) {
          results.push(`Skills (${skillResult.count})`);
        } else {
          results.push('Skills');
        }
      }

      setMessage({ type: 'success', text: `✓ ${results.join(' & ')} reset successfully!` });
      setTimeout(() => setMessage(null), 2000);
    }
  });

  return e(Box, {
    flexDirection: 'column',
    width,
    height,
    borderStyle: 'double',
    borderColor: borderColor, // 위험 색상 혹은 LSD
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
      e(Text, { bold: true, color: borderColor }, ' 🔄 FACTORY RESET SETTINGS 🔄 ')
    ),

    // Main Content
    e(Box, { flexDirection: 'row', flexGrow: 1, width: '100%' },

      // Left: Menu
      e(Box, {
        flexDirection: 'column',
        width: '40%',
        paddingRight: 2,
        borderStyle: 'single',
        borderTop: false,
        borderBottom: false,
        borderLeft: false,
        borderColor: 'gray'
      },
        ...MENU_ITEMS.map((item) => {
          // 헤더 처리
          if (item.type === 'header') {
            return e(Box, { key: item.id, marginTop: 1, marginBottom: 0 },
              e(Text, { dimColor: true, underline: true }, item.label)
            );
          }

          const navIndex = navigableItems.indexOf(item);
          const isSelected = navIndex === selectedIndex;

          // 실제 메뉴 아이템
          return e(Box, { key: item.id },
            e(Text, {
              // 선택 시 배경 빨강(경고), 글자 검정
              color: isSelected ? 'black' : (item.type === 'action' ? 'white' : 'red'),
              backgroundColor: isSelected ? 'red' : undefined,
              bold: isSelected
            }, isSelected ? ` > ${item.label} ` : `   ${item.label} `)
          );
        })
      ),

      // Right: Warning & Status
      e(Box, {
        flexDirection: 'column',
        width: '60%',
        paddingLeft: 2,
        justifyContent: 'center',
        alignItems: 'center'
      },
        // Warning Card
        e(Box, {
          borderStyle: 'round',
          borderColor: 'yellow',
          padding: 1,
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 2,
          width: '100%'
        },
          e(Text, { color: 'yellow', bold: true }, '⚠️  WARNING  ⚠️'),
          e(Box, { height: 1 }),
          e(Text, { color: 'white', dimColor: true }, 'This action cannot be undone.'),
          e(Text, { color: 'white', dimColor: true }, 'Your custom themes and skills'),
          e(Text, { color: 'white', dimColor: true }, 'will be permanently deleted.')
        ),

        // Toast Message Area
        message && e(Box, {
          borderStyle: 'single',
          borderColor: message.type === 'success' ? 'green' : 'red',
          paddingX: 2
        },
          e(Text, { color: message.type === 'success' ? 'green' : 'red', bold: true },
            message.text
          )
        )
      )
    ),

    // Footer - Mode label
    e(Box, { justifyContent: 'flex-end', width: '100%', paddingX: 1 },
      e(Text, { color: 'red', dimColor: true }, 'MODE: DESTRUCTIVE')
    ),

    // Footer - Keybindings
    e(Box, {
      borderStyle: 'single',
      borderBottom: false, borderLeft: false, borderRight: false,
      borderColor: 'gray',
      justifyContent: 'space-between',
      width: '100%'
    },
      e(Box, {},
        e(Text, { color: 'green' }, '↑↓'), e(Text, { dimColor: true }, ' Navigate')
      ),
      e(Box, {},
        e(Text, { color: 'red', bold: true }, 'ENTER'), e(Text, { dimColor: true }, ' Confirm '),
        e(Text, { color: 'red' }, 'ESC/Q'), e(Text, { dimColor: true }, ' Cancel')
      )
    )
  );
}
