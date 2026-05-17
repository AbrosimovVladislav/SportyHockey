'use client';

import { useEffect } from 'react';
import { backButton } from '@telegram-apps/sdk-react';

export function useBackButton(onBack: (() => void) | null): void {
  useEffect(() => {
    try {
      if (!onBack) {
        if (backButton.isMounted()) backButton.hide();
        return;
      }
      backButton.show();
      const off = backButton.onClick(onBack);
      return () => {
        off();
        backButton.hide();
      };
    } catch {
      // вне Telegram — нет смысла падать
    }
  }, [onBack]);
}
