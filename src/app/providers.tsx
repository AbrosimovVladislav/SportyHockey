'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  init,
  expandViewport,
  mountMiniApp,
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
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[tma] init skipped — not in Telegram:', e);
    }
  }
}
