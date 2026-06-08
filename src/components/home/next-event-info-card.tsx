'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@/components/button';
import {
  IconChevronRight,
  IconPeople,
  IconRuble,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { HomeNextEvent } from '@/types/api';

// Карточка ближайшего события в белом sheet (v0.6, передизайн от 2026-06-08).
// Стилистика как у `BalanceCard` на /money — белая «приподнятая» карточка
// с soft-shadow. Внутри: три метрики (явка / взнос / места) в одну строку
// и CTA-кнопка «Открыть событие» полной ширины.
//
// Шапка раздела (логотип + название + бейдж + дата + venue) — отдельно в
// `HomeHero` сверху. Здесь только actionable-часть для перехода в событие.

type Props = {
  event: HomeNextEvent;
  onOpen: () => void;
  labels: {
    cta: string;
    attendanceCaption: string;
    feeCaption: string;
    seatsCaption: string;
  };
};

export function NextEventInfoCard({ event, onOpen, labels }: Props) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['20'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };
  const metrics: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: spacing['8'],
  };

  return (
    <div style={card}>
      <div style={metrics}>
        <Metric
          icon={<IconPeople size={20} color={colors.iconFg} />}
          value={`${event.going_count} из ${event.team_size}`}
          caption={labels.attendanceCaption}
        />
        <Metric
          icon={<IconRuble size={20} color={colors.iconFg} />}
          value={event.cost_per_player != null ? formatFee(event.cost_per_player) : '—'}
          caption={labels.feeCaption}
        />
        <Metric
          icon={<IconSeat size={20} color={colors.iconFg} />}
          value={String(event.seats_left)}
          caption={labels.seatsCaption}
        />
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onOpen}>
        <span style={{ position: 'relative', width: '100%' }}>
          <span>{labels.cta}</span>
          <span
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <IconChevronRight size={16} color={colors.textInverse} />
          </span>
        </span>
      </Button>
    </div>
  );
}

function Metric({
  icon,
  value,
  caption,
}: {
  icon: ReactNode;
  value: string;
  caption: string;
}) {
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: spacing['4'],
    minWidth: 0,
  };
  const iconBox: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    background: colors.iconBg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const valueStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  };
  const captionStyle: CSSProperties = {
    ...typography.caption,
    color: colors.textSecondary,
  };
  return (
    <div style={wrap}>
      <span style={iconBox} aria-hidden>
        {icon}
      </span>
      <span style={valueStyle}>{value}</span>
      <span style={captionStyle}>{caption}</span>
    </div>
  );
}

function formatFee(value: number): string {
  const rounded = Number.isInteger(value) ? value : Math.round(value);
  return `${rounded.toLocaleString('ru-RU').replace(/,/g, ' ')} ₽`;
}

function IconSeat({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 4v10h12V4" />
      <path d="M4 14h16v3H4z" />
      <path d="M6 17v3M18 17v3" />
    </svg>
  );
}
