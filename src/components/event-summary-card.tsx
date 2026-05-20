'use client';

import type { CSSProperties } from 'react';
import { IconCalendar } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatEventDateRange } from '@/lib/event-format';

type Props = {
  title: string;
  startsAt: string;
  endsAt?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
};

export function EventSummaryCard({ title, startsAt, endsAt, venueName, venueAddress }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: spacing['12'],
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };
  const iconBox: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    background: colors.iconBg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const titleStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.25,
  };
  const subtitleStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 1.3,
  };
  const venueText = [venueName, venueAddress].filter(Boolean).join(' · ');

  return (
    <div style={wrap}>
      <div style={iconBox}>
        <IconCalendar size={20} color={colors.iconFg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={titleStyle}>{title}</div>
        <div style={subtitleStyle}>{formatEventDateRange(startsAt, endsAt ?? undefined)}</div>
        {venueText ? <div style={subtitleStyle}>{venueText}</div> : null}
      </div>
    </div>
  );
}
