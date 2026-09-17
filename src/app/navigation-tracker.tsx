'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { markPopState, trackNavigation } from '@/lib/nav-history';

// Ведёт стек экранов сессии для корректной кнопки «Назад» (см. lib/nav-history.ts).
export function NavigationTracker() {
  const pathname = usePathname();

  useEffect(() => {
    window.addEventListener('popstate', markPopState);
    return () => window.removeEventListener('popstate', markPopState);
  }, []);

  useEffect(() => {
    trackNavigation(pathname);
  }, [pathname]);

  return null;
}
