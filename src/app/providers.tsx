'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  init,
  expandViewport,
  mountMiniApp,
  mountViewport,
  requestFullscreen,
  isFullscreen,
  mountSwipeBehavior,
  setMiniAppHeaderColor,
  setMiniAppBackgroundColor,
  backButton,
} from '@telegram-apps/sdk-react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
        },
      }),
  );

  useEffect(() => {
    void bootstrapTelegram();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

async function bootstrapTelegram(): Promise<void> {
  try {
    init();
    expandViewport();
    await mountMiniApp();
    if (setMiniAppHeaderColor.isAvailable()) setMiniAppHeaderColor('#FFFFFF');
    if (setMiniAppBackgroundColor.isAvailable()) setMiniAppBackgroundColor('#FFFFFF');
    if (backButton.mount.isAvailable()) backButton.mount();
    if (mountSwipeBehavior.isAvailable()) mountSwipeBehavior();
    await enterFullscreen();
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[tma] init skipped — not in Telegram:', e);
    }
  }
}

// Просим полноэкранный режим на старте, чтобы приложение всегда открывалось
// во весь экран независимо от точки запуска: кнопка-меню бота игнорирует
// BotFather-режим Fullscreen, а рантайм-вызов работает везде (меню, «Открыть»,
// ярлык с домашнего экрана). Вёрстка под safe-area — отдельным шагом.
// Изолируем в свой try/catch: сбой fullscreen не должен ломать остальной bootstrap.
async function enterFullscreen(): Promise<void> {
  try {
    if (mountViewport.isAvailable()) await mountViewport();
    if (requestFullscreen.isAvailable() && !isFullscreen()) {
      await requestFullscreen();
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[tma] fullscreen skipped:', e);
    }
  }
}
