import React from 'react';
import { render } from 'ink';
import { ColorEditor } from '../components/ColorEditor.js';

export function cmdEdit() {
  render(React.createElement(ColorEditor));
}
