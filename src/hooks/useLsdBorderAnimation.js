import { useState, useEffect } from 'react';
import { LSD_COLORS, ANIMATION_INTERVAL } from '../constants.js';

export function useLsdBorderAnimation(isLsdUnlocked) {
  const [borderColor, setBorderColor] = useState('cyan');

  useEffect(() => {
    if (!isLsdUnlocked) {
      setBorderColor('cyan');
      return;
    }

    let colorIndex = 0;

    const timer = setInterval(() => {
      colorIndex = (colorIndex + 1) % LSD_COLORS.length;
      setBorderColor(LSD_COLORS[colorIndex]);
    }, ANIMATION_INTERVAL);

    return () => clearInterval(timer);
  }, [isLsdUnlocked]);

  return borderColor;
}
