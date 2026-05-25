'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Card } from '@/components/card';
import {
  IconCalendar,
  IconWallet,
  IconStats,
  IconCheck,
  IconClose,
  IconChevronRight,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { AttendanceStatus, PlayerOverview, PlayerStatLine } from '@/types/api';

type Props = { overview: PlayerOverview; t: (k: TKey) => string };

function formatRub(n: number): string {
  return Math.abs(n).toLocaleString('ru-RU');
}

export function PlayerOverviewTab({ overview, t }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
      <AttendanceCard attendance={overview.attendance} t={t} />
      <FinanceCard balance={overview.finance.balance} t={t} />
      <StatsCard stats={overview.stats} t={t} />
    </div>
  );
}

const cardTitle: CSSProperties = {
  ...typography.sm,
  color: colors.textSecondary,
  fontWeight: 600,
};

const bigValue: CSSProperties = {
  fontSize: 34,
  fontWeight: 800,
  color: colors.text,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
};

const caption: CSSProperties = {
  ...typography.sm,
  color: colors.textSecondary,
};

const linkRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: spacing['12'],
  paddingTop: spacing['12'],
  borderTop: `1px solid ${colors.divider}`,
  color: colors.primary,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

function RoundIcon({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: colors.iconBg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function CardHead({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <span style={cardTitle}>{title}</span>
      <RoundIcon>{icon}</RoundIcon>
    </div>
  );
}

function AttendanceCard({
  attendance,
  t,
}: {
  attendance: PlayerOverview['attendance'];
  t: (k: TKey) => string;
}) {
  return (
    <Card variant="surface">
      <CardHead
        title={t('player.attendance.title')}
        icon={<IconCalendar size={22} color={colors.iconFg} />}
      />
      <div style={{ marginTop: spacing['4'] }}>
        <div style={bigValue}>{attendance.rate == null ? '—' : `${attendance.rate}%`}</div>
        <div style={{ ...caption, marginTop: spacing['2'] }}>{t('player.attendance.subtitle')}</div>
      </div>
      <div style={linkRowStatic}>
        <span style={caption}>{t('player.attendance.last5')}</span>
        {attendance.last5.length === 0 ? (
          <span style={{ ...caption, color: colors.textTertiary }}>
            {t('player.attendance.empty')}
          </span>
        ) : (
          <div style={{ display: 'flex', gap: spacing['6'] }}>
            {attendance.last5.map((item, i) => (
              <Last5Dot key={item.event_id + i} status={item.status} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

const linkRowStatic: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: spacing['12'],
  paddingTop: spacing['12'],
  borderTop: `1px solid ${colors.divider}`,
};

function Last5Dot({ status }: { status: AttendanceStatus }) {
  const base: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
  };
  if (status === 'showed') {
    return (
      <span style={{ ...base, background: colors.successBg }}>
        <IconCheck size={15} color={colors.success} />
      </span>
    );
  }
  if (status === 'missed') {
    return (
      <span style={{ ...base, background: colors.errorBg }}>
        <IconClose size={15} color={colors.error} />
      </span>
    );
  }
  return <span style={{ ...base, background: colors.bgMuted, color: colors.textTertiary }}>?</span>;
}

function FinanceCard({ balance, t }: { balance: number; t: (k: TKey) => string }) {
  const label =
    balance > 0
      ? `${t('player.finance.debt')} ${formatRub(balance)} ₽`
      : balance < 0
        ? `${t('player.finance.credit')} ${formatRub(balance)} ₽`
        : t('player.finance.zero');
  return (
    <Card variant="surface">
      <CardHead
        title={t('player.finance.title')}
        icon={<IconWallet size={22} color={colors.iconFg} />}
      />
      <div style={{ marginTop: spacing['4'] }}>
        <div style={bigValue}>{label}</div>
        <div style={{ ...caption, marginTop: spacing['2'] }}>{t('player.finance.balance')}</div>
      </div>
      <div
        className="pressable"
        style={linkRow}
        onClick={() => alert(t('player.soon'))}
        role="button"
      >
        <span>{t('player.finance.open')}</span>
        <IconChevronRight size={16} color={colors.primary} />
      </div>
    </Card>
  );
}

function StatsCard({ stats, t }: { stats: PlayerOverview['stats']; t: (k: TKey) => string }) {
  return (
    <Card variant="surface">
      <CardHead
        title={t('player.stats.title')}
        icon={<IconStats size={22} color={colors.iconFg} />}
      />
      <StatRow label={t('player.stats.games')} line={stats.games} t={t} />
      <div style={{ height: 1, background: colors.divider, margin: `${spacing['12']}px 0` }} />
      <StatRow label={t('player.stats.trainings')} line={stats.trainings} t={t} />
      <div
        className="pressable"
        style={linkRow}
        onClick={() => alert(t('player.soon'))}
        role="button"
      >
        <span>{t('player.stats.open')}</span>
        <IconChevronRight size={16} color={colors.primary} />
      </div>
    </Card>
  );
}

function StatRow({
  label,
  line,
  t,
}: {
  label: string;
  line: PlayerStatLine;
  t: (k: TKey) => string;
}) {
  const cell = (cap: string, value: number) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...caption, marginBottom: spacing['2'] }}>{cap}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: colors.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: spacing['8'] }}>
      {cell(label, line.played)}
      {cell(t('player.stats.goals'), line.goals)}
      {cell(t('player.stats.assists'), line.assists)}
    </div>
  );
}
