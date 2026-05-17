'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ComponentType } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { useT } from '@/hooks/use-t';
import type { TKey } from '@/i18n/ru';
import {
  IconHome,
  IconCalendar,
  IconRuble,
  IconPeople,
  IconMore,
} from './icons';

type IconCmp = ComponentType<{ size?: number; color?: string }>;

type Tab = { href: string; labelKey: TKey; Icon: IconCmp };

const TABS: Tab[] = [
  { href: '/', labelKey: 'tabs.home', Icon: IconHome },
  { href: '/events', labelKey: 'tabs.events', Icon: IconCalendar },
  { href: '/money', labelKey: 'tabs.money', Icon: IconRuble },
  { href: '/squad', labelKey: 'tabs.squad', Icon: IconPeople },
  { href: '/profile', labelKey: 'tabs.profile', Icon: IconMore },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const bar: CSSProperties = {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    background: colors.bg,
    borderTop: `1px solid ${colors.line}`,
    paddingTop: spacing['8'],
    paddingBottom: `calc(${spacing['12']}px + env(safe-area-inset-bottom, 0px))`,
    zIndex: 10,
  };

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    color: active ? colors.headerAccent : colors.navInactive,
    fontSize: 10,
    fontWeight: active ? 600 : 400,
    textAlign: 'center',
    padding: `${spacing['2']}px ${spacing['4']}px`,
  });

  return (
    <nav style={bar} aria-label="Основная навигация">
      {TABS.map(({ href, labelKey, Icon }) => {
        const active = isActive(pathname, href);
        const color = active ? colors.headerAccent : colors.navInactive;
        return (
          <Link key={href} href={href} style={tabStyle(active)} className="pressable">
            <Icon size={24} color={color} />
            <span>{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export const BOTTOM_NAV_HEIGHT = 64;
