import React from 'react';
import { render } from 'ink';
import { ThemeSelector } from '../components/ThemeSelector.js';

export function cmdInteractive() {
  render(React.createElement(ThemeSelector));
}
