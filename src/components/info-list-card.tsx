'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Tone = 'neutral' | 'danger';

type Item = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
};

type Props = {
  title: string;
  items: Item[];
  tone?: Tone;
};

export function InfoListCard({ title, items, tone = 'neutral' }: Props) {
  const isDanger = tone === 'danger';
  const wrap: CSSProperties = {
    background: isDanger ? colors.errorBg : colors.bgMuted,
    borderRadius: radius.md,
    padding: spacing['12'],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: isDanger ? colors.errorText : colors.text,
    lineHeight: 1.2,
  };
  const itemRow: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing['10'],
  };
  const iconBox: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: isDanger ? 'rgba(211,47,47,0.12)' : colors.bg,
    color: isDanger ? colors.error : colors.iconFg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const itemTitle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.25,
  };
  const itemSubtitle: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 1.35,
  };

  return (
    <div style={wrap}>
      <div style={titleStyle}>{title}</div>
      {items.map((it, i) => (
        <div key={i} style={itemRow}>
          <span style={iconBox}>{it.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={itemTitle}>{it.title}</div>
            {it.subtitle ? <div style={itemSubtitle}>{it.subtitle}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
