import React from 'react';
import { Text } from 'ink';

const e = React.createElement;

export function ColorBlock({ code, isForeground = true, width = 3 }) {
  const block = isForeground ? '███'.slice(0, width) : '   '.slice(0, width);

  // ANSI escape 직접 사용
  const escape = isForeground
    ? `\x1b[38;5;${code}m`
    : `\x1b[48;5;${code}m`;
  const reset = '\x1b[0m';

  return e(Text, null, escape + block + reset);
}

export function ColorPreview({ fgCode, bgCode }) {
  const escape = `\x1b[38;5;${fgCode}m\x1b[48;5;${bgCode}m`;
  const reset = '\x1b[0m';

  return e(Text, null, escape + ' Sample ' + reset);
}
