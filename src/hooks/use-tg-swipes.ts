'use client';

import { useEffect } from 'react';
import { disableVerticalSwipes, enableVerticalSwipes } from '@telegram-apps/sdk-react';

// Отключает свайп-вниз для закрытия миниаппа на время монтирования компонента.
// Нужно на экранах с drag-and-drop, где жест «потянуть игрока вниз»
// иначе превращается в «свернуть миниапп».
export function useTgSwipes(disabled: boolean) {
  useEffect(() => {
    if (!disabled) return;
    try {
      if (disableVerticalSwipes.isAvailable()) disableVerticalSwipes();
    } catch {
      // вне Telegram — игнор
    }
    return () => {
      try {
        if (enableVerticalSwipes.isAvailable()) enableVerticalSwipes();
      } catch {
        // вне Telegram — игнор
      }
    };
  }, [disabled]);
}
