'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/i18n/ru';

type Tab = { href: string; labelKey: TKey };

const TABS: Tab[] = [
  { href: '/', labelKey: 'tabs.home' },
  { href: '/events', labelKey: 'tabs.events' },
  { href: '/squad', labelKey: 'tabs.squad' },
  { href: '/money', labelKey: 'tabs.money' },
  { href: '/profile', labelKey: 'tabs.profile' },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function TabBar() {
  const pathname = usePathname();
  const t = useT();

  const bar: CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'space-around',
    background: colors.secondaryBg,
    borderTop: `1px solid ${colors.separator}`,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  };

  const tab = (active: boolean): CSSProperties => ({
    ...typography.small,
    flex: 1,
    minHeight: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: active ? colors.button : colors.hint,
    textAlign: 'center',
  });

  return (
    <nav style={bar} aria-label="Основная навигация">
      {TABS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link key={item.href} href={item.href} style={tab(active)}>
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

export const TAB_BAR_HEIGHT = 56;
