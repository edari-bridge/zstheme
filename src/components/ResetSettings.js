import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { resetTheme } from '../utils/shell.js';
import { uninstallAllSkills } from '../utils/skills.js';

const e = React.createElement;

const MENU_ITEMS = [
  { id: 'back', label: '← Back to Menu' },
  { id: 'theme', label: 'Reset Theme' },
  { id: 'skills', label: 'Reset Skills' },
  { id: 'all', label: 'Reset All' },
];

export function ResetSettings({ onBack }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState(null);

  useInput((input, key) => {
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

      setMessage({ type: 'success', text: `✓ ${results.join(' & ')} reset!` });

      setTimeout(() => setMessage(null), 2000);
    }
  });

  return e(Box, { flexDirection: 'column', padding: 1 },
    // Header
    e(Box, { marginBottom: 1 },
      e(Text, { bold: true, color: 'red' }, '🔄 Reset Settings')
    ),

    // Warning
    e(Box, { borderStyle: 'round', borderColor: 'yellow', padding: 1, marginBottom: 1 },
      e(Text, { color: 'yellow' }, '⚠️  This will remove your current settings.')
    ),

    // Menu
    e(Box, { flexDirection: 'column', borderStyle: 'round', borderColor: 'gray', padding: 1 },
      ...MENU_ITEMS.map((item, index) => {
        const isSelected = index === selectedIndex;
        return e(Box, { key: item.id },
          e(Text, { color: isSelected ? 'green' : 'gray' }, isSelected ? '❯ ' : '  '),
          e(Text, {
            color: isSelected ? 'white' : 'gray',
            bold: isSelected,
          }, item.label),
        );
      }),
    ),

    // Toast Message
    message && e(Box, { marginTop: 1, justifyContent: 'center' },
      e(Box, {
        borderStyle: 'round',
        borderColor: message.type === 'success' ? 'green' : 'red',
        paddingX: 2
      },
        e(Text, { color: message.type === 'success' ? 'green' : 'red', bold: true },
          message.text
        )
      )
    ),

    // Footer
    e(Box, { marginTop: 1 },
      e(Text, { dimColor: true },
        'Use ',
        e(Text, { color: 'yellow' }, '↑↓'),
        ' to navigate, ',
        e(Text, { color: 'yellow' }, 'Enter'),
        ' to reset, ',
        e(Text, { color: 'red' }, 'q/Esc'),
        ' to go back'
      )
    )
  );
}
