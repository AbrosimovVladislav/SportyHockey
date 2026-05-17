'use client';

import { useEffect } from 'react';
import { setMiniAppHeaderColor } from '@telegram-apps/sdk-react';

type HexColor = `#${string}`;

const DEFAULT_HEADER = '#FFFFFF' as const;

// Управляет цветом TG-chrome пока смонтирован компонент.
// На размонтировании возвращает белый.
export function useTgHeader(color: HexColor) {
  useEffect(() => {
    try {
      if (setMiniAppHeaderColor.isAvailable()) setMiniAppHeaderColor(color);
    } catch {
      // вне Telegram — игнор
    }
    return () => {
      try {
        if (setMiniAppHeaderColor.isAvailable()) setMiniAppHeaderColor(DEFAULT_HEADER);
      } catch {
        // вне Telegram — игнор
      }
    };
  }, [color]);
}
