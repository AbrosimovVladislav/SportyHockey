'use client';

import type { CSSProperties } from 'react';
import { Button } from '@/components/button';
import { IconCalendar } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

// Заглушка карточки «нет ближайшего события» — рисуется на месте
// `NextEventCard`, когда в активной команде нет предстоящих событий.
// CTA-кнопка зависит от роли: организатор создаёт событие, игрок идёт в
// календарь.

type Props = {
  title: string;
  ctaLabel: string;
  onCta: () => void;
};

export function NextEventEmpty({ title, ctaLabel, onCta }: Props) {
  const card: CSSProperties = {
    borderRadius: radius.lg,
    background: colors.bgWarm,
    padding: spacing['24'],
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['12'],
    minHeight: 200,
    textAlign: 'center',
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
        <IconCalendar size={24} color={colors.iconFg} />
      </span>
      <span style={{ ...typography.bodyBold, color: colors.text }}>{title}</span>
      <Button variant="primary" size="md" onClick={onCta}>
        {ctaLabel}
      </Button>
    </div>
  );
}
