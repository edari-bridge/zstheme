import React, { useState } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { resetTheme, uninstallZstheme } from '../utils/shell.js';
import { uninstallAllSkills } from '../utils/skills.js';
import { LSD_COLORS, VERSION } from '../constants.js';
import { useLsdBorderAnimation } from '../hooks/useLsdBorderAnimation.js';

const e = React.createElement;

const MENU_ITEMS = [
  { id: 'reset-theme', label: 'Reset Theme' },
  { id: 'uninstall', label: 'Uninstall zstheme' },
  { id: 'back', label: 'Exit Reset', type: 'action' },
];

const CONFIRM_MESSAGES = {
  'reset-theme': 'Statusline will be restored to original.',
  'uninstall': 'All zstheme settings, skills, and configs will be removed.',
};

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
  const [confirming, setConfirming] = useState(null);

  // 실제 리셋 실행
  const executeReset = (id) => {
    let text = '';

    if (id === 'reset-theme') {
      const result = resetTheme();
      text = result.success
        ? '✓ Statusline restored to original'
        : '✗ No backup found — run install.sh first';
    } else if (id === 'uninstall') {
      uninstallAllSkills();
      const result = uninstallZstheme();
      text = result.success
        ? '✓ zstheme uninstalled — you can now remove the directory'
        : '✓ zstheme uninstalled (statusline backup not found)';
    }

    setConfirming(null);
    setMessage({ type: 'success', text });
    setTimeout(() => setMessage(null), 3000);
  };

  useInput((input, key) => {
    // 확인 대기 상태
    if (confirming) {
      if (input === 'y') {
        executeReset(confirming);
      } else if (input === 'n' || key.escape) {
        setConfirming(null);
      }
      return;
    }

    if (key.escape || input === 'q') {
      onBack();
      return;
    }

    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : MENU_ITEMS.length - 1));
      setMessage(null);
    }

    if (key.downArrow) {
      setSelectedIndex(prev => (prev < MENU_ITEMS.length - 1 ? prev + 1 : 0));
      setMessage(null);
    }

    if (key.return) {
      const selected = MENU_ITEMS[selectedIndex];

      if (selected.id === 'back') {
        onBack();
        return;
      }

      setConfirming(selected.id);
      setMessage(null);
    }
  });

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
      justifyContent: 'space-between',
      borderStyle: 'single',
      borderTop: false,
      borderLeft: false,
      borderRight: false,
      borderColor: 'gray',
      paddingBottom: 0,
      marginBottom: 1
    },
      isLsdUnlocked
        ? e(Text, null, ...[...' 💀 Reset Settings 💀 '].map((ch, i) =>
            e(Text, { key: i, color: LSD_COLORS[(i + LSD_COLORS.indexOf(lsdBorderColor)) % LSD_COLORS.length], bold: true }, ch)
          ))
        : e(Text, { bold: true, color: 'red' }, ' Reset Settings'),
      e(Text, { dimColor: true }, `v${VERSION}`)
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
        ...MENU_ITEMS.map((item, index) => {
          const isSelected = index === selectedIndex;

          if (item.type === 'action') {
            return e(Box, { key: item.id, marginTop: 1 },
              e(Text, { color: isSelected ? (isLsdUnlocked ? lsdBorderColor : 'red') : 'gray' },
                isSelected ? '▸ ' : '  '
              ),
              e(Text, {
                color: isSelected ? 'red' : 'gray',
                bold: isSelected
              }, item.label)
            );
          }
          return e(Box, { key: item.id, marginTop: index === 0 ? 1 : 0 },
            e(Text, { color: isSelected ? (isLsdUnlocked ? lsdBorderColor : 'red') : 'gray' },
              isSelected ? '▸ ' : '  '
            ),
            e(Text, {
              color: isSelected ? 'red' : 'white',
              bold: isSelected
            }, item.label)
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
        // Confirm Dialog
        confirming ? e(Box, {
          borderStyle: 'round',
          borderColor: 'red',
          padding: 1,
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 2,
          width: '100%'
        },
          e(Text, { color: 'red', bold: true }, '⚠️  ARE YOU SURE?  ⚠️'),
          e(Box, { height: 1 }),
          e(Text, { color: 'white' }, CONFIRM_MESSAGES[confirming]),
          e(Text, { color: 'white', dimColor: true }, 'This action cannot be undone.'),
          e(Box, { height: 1 }),
          e(Box, null,
            e(Text, { color: 'red', bold: true }, 'Y'),
            e(Text, { dimColor: true }, ' Yes  '),
            e(Text, { color: 'green', bold: true }, 'N'),
            e(Text, { dimColor: true }, ' No')
          )
        )
        // Default Warning Card
        : e(Box, {
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
          e(Text, { color: 'white', dimColor: true }, 'These actions may change your'),
          e(Text, { color: 'white', dimColor: true }, 'Claude Code configuration.')
        ),

        // Toast Message Area
        message && e(Box, {
          borderStyle: 'single',
          borderColor: 'green',
          paddingX: 2
        },
          e(Text, { color: 'green', bold: true }, message.text)
        )
      )
    ),

    // Footer - Mode label
    e(Box, { justifyContent: 'flex-end', width: '100%', paddingX: 1 },
      isLsdUnlocked
        ? e(Text, null, ...'🌈 LSD MODE ACTIVE 🌈'.split('').map((ch, i) =>
            e(Text, { key: i, color: LSD_COLORS[(i + LSD_COLORS.indexOf(lsdBorderColor)) % LSD_COLORS.length], bold: true }, ch)
          ))
        : e(Text, { dimColor: true }, 'MODE: STANDARD')
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
        e(Text, { color: 'magenta' }, 'ENTER'), e(Text, { dimColor: true }, ' Select '),
        e(Text, { color: 'red' }, 'ESC/Q'), e(Text, { dimColor: true }, ' Back')
      )
    )
  );
}
