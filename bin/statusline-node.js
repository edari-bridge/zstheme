#!/usr/bin/env node
// Node.js statusline renderer for cross-platform support (Windows/macOS/Linux)
import { renderStatusline } from '../src/renderer/index.js';

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const output = renderStatusline(input);
    process.stdout.write(output);
  } catch (err) {
    // Fallback: minimal statusline
    process.stdout.write(`\u{1F9E0} Unknown  \u{1F50B} 0%`);
    if (process.env.ZSTHEME_DEBUG === '1') {
      process.stderr.write(`statusline-node error: ${err.message}\n${err.stack}\n`);
    }
  }
});
