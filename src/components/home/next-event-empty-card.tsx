'use client';

import type { CSSProperties } from 'react';
import { Button } from '@/components/button';
import { IconCalendar } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// Карточка-заглушка в белом sheet, если у активной команды нет ближайших
// событий (v0.6, передизайн от 2026-06-08). По стилю — как `BalanceCard`
// на /money, чтобы layout не прыгал при пустом состоянии.

type Props = {
  title: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
};

export function NextEventEmptyCard({ title, body, ctaLabel, onCta }: Props) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['24']}px ${spacing['20']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing['12'],
  };
  const iconWrap: CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    background: colors.iconBg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <div style={card}>
      <span style={iconWrap}>
        <IconCalendar size={22} color={colors.iconFg} />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['4'] }}>
        <span style={{ ...typography.bodyBold, color: colors.text }}>{title}</span>
        <span style={{ ...typography.sm, color: colors.textSecondary }}>{body}</span>
      </div>
      <Button variant="primary" size="md" onClick={onCta}>
        {ctaLabel}
      </Button>
    </div>
  );
}
