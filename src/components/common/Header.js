import React from 'react';
import { Box, Text } from 'ink';

const e = React.createElement;

export function Header({ title = 'zstheme', subtitle = 'Claude Code Statusline', version = '2.1' }) {
  return e(Box, { flexDirection: 'column', marginBottom: 1 },
    e(Text, { color: 'magenta', bold: true }, '  ╭──────────────────────────────────────╮'),
    e(Box, null,
      e(Text, { color: 'magenta', bold: true }, '  │'),
      e(Text, null, '  '),
      e(Text, { color: 'cyan' }, title),
      e(Text, null, ' - ' + subtitle + '   '),
      e(Text, { color: 'magenta', bold: true }, '│')
    ),
    e(Text, { color: 'magenta', bold: true }, '  ╰──────────────────────────────────────╯')
  );
}
