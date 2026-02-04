import React from 'react';
import { render } from 'ink';
import { MainMenu } from '../components/MainMenu.js';

export function cmdInteractive() {
  render(React.createElement(MainMenu));
}
