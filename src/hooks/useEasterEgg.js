import { useState } from 'react';
import { EASTER_EGG_TRIGGER_COUNT } from '../constants.js';

export function useEasterEgg() {
  const [rightPressCount, setRightPressCount] = useState(0);
  const [leftPressCount, setLeftPressCount] = useState(0);
  const [isLsdUnlocked, setIsLsdUnlocked] = useState(false);

  const resetCounts = () => {
    setRightPressCount(0);
    setLeftPressCount(0);
  };

  const handleArrowKey = (direction) => {
    if (direction === 'right') {
      setLeftPressCount(0);
      setRightPressCount(prev => {
        const newCount = prev + 1;
        if (newCount >= EASTER_EGG_TRIGGER_COUNT) {
          setIsLsdUnlocked(true);
          return 0;
        }
        return newCount;
      });
    } else if (direction === 'left') {
      setRightPressCount(0);
      setLeftPressCount(prev => {
        const newCount = prev + 1;
        if (newCount >= EASTER_EGG_TRIGGER_COUNT) {
          setIsLsdUnlocked(false);
          return 0;
        }
        return newCount;
      });
    }
  };

  return { isLsdUnlocked, handleArrowKey, resetCounts };
}
