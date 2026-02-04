import React from 'react';
import { Box, Text } from 'ink';

const e = React.createElement;

export function HelpBar({ items, modified = false }) {
  return e(Box, { flexDirection: 'column', marginTop: 1 },
    e(Text, { dimColor: true }, '─────────────────────────────────────────────────────────────────────'),
    e(Box, null,
      e(Text, null, '  '),
      ...items.map((item, i) =>
        e(React.Fragment, { key: i },
          e(Text, { color: 'cyan' }, item.key),
          e(Text, null, ':' + item.action + '  ')
        )
      ),
      modified && e(Text, { color: 'yellow' }, '[Modified]')
    )
  );
}
