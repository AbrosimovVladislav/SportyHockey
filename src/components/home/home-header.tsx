'use client';

import type { CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { IconBell } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// Шапка главной (v0.6, итерация 62): логотип команды + название слева,
// иконка-колокольчик справа (заглушка под эпик уведомлений). В отличие от
// `LightHeader`, без back-кнопки — главная всегда корень навигации.
//
// Колокольчик пока без действия — кликабельный, но никуда не ведёт;
// эпик уведомлений отдельный, а текущий MVP с ним не пересекается.
type Props = {
  teamName: string;
  teamLogoUrl: string | null;
  onBellClick?: () => void;
};

export function HomeHeader({ teamName, teamLogoUrl, onBellClick }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    paddingTop: `calc(${spacing['12']}px + var(--app-safe-top))`,
    paddingBottom: spacing['12'],
    paddingLeft: spacing['16'],
    paddingRight: spacing['16'],
    background: colors.bg,
    position: 'sticky',
    top: 0,
    zIndex: 5,
    minHeight: 64,
  };

  const title: CSSProperties = {
    fontSize: 18,
    fontWeight: 800,
    color: colors.text,
    letterSpacing: '-0.3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  };

  const bellBtn: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: colors.bgMuted,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onBellClick ? 'pointer' : 'default',
    flexShrink: 0,
  };

  return (
    <header style={wrap}>
      <Avatar src={teamLogoUrl} name={teamName} size={44} />
      <h1 style={title}>{teamName}</h1>
      <button
        type="button"
        className="pressable"
        onClick={onBellClick}
        style={bellBtn}
        aria-label="Уведомления"
      >
        <IconBell size={22} color={colors.text} />
      </button>
    </header>
  );
}
