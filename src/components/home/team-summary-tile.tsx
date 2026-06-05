'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  IconCalendar,
  IconDumbbell,
  IconTrophy,
  IconStick,
  IconShield,
  IconRuble,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatMoney } from '@/lib/format-money';
import type { DashboardTeamSummary } from '@/types/api';

// Таб «Команда» (v0.6, итерация 64.6): шесть плиток с агрегатами по команде.
// Метрики: матчей сыграно / тренировок / побед / шайб / пропущено / финансовый
// баланс. На скрине дизайнера было «Средняя явка» и «Сбор денег» — заменены
// на «Финансовый баланс» по запросу пользователя; «Средняя явка» убрана.
// Цвет числа балансовой плитки зависит от знака (зелёный/красный/нейтр.).

type Props = {
  summary: DashboardTeamSummary;
  labels: {
    games: string;
    trainings: string;
    wins: string;
    goalsFor: string;
    goalsAgainst: string;
    balance: string;
  };
};

export function TeamSummaryTile({ summary, labels }: Props) {
  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['8'],
    padding: spacing['8'],
  };

  const balanceColor =
    summary.balance > 0
      ? colors.successDark
      : summary.balance < 0
        ? colors.errorDark
        : colors.text;

  return (
    <div style={grid}>
      <Stat
        icon={<IconCalendar size={18} color={colors.iconFg} />}
        label={labels.games}
        value={String(summary.games_played)}
      />
      <Stat
        icon={<IconTrophy size={18} color={colors.iconFg} />}
        label={labels.wins}
        value={String(summary.wins)}
      />
      <Stat
        icon={<IconStick size={18} color={colors.iconFg} />}
        label={labels.goalsFor}
        value={String(summary.goals_for)}
      />
      <Stat
        icon={<IconShield size={18} color={colors.iconFg} />}
        label={labels.goalsAgainst}
        value={String(summary.goals_against)}
      />
      <Stat
        icon={<IconDumbbell size={18} color={colors.iconFg} />}
        label={labels.trainings}
        value={String(summary.trainings_played)}
      />
      <Stat
        icon={<IconRuble size={18} color={colors.iconFg} />}
        label={labels.balance}
        value={formatMoney(summary.balance)}
        valueColor={balanceColor}
      />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  const card: CSSProperties = {
    background: colors.bgWarm,
    borderRadius: radius.md,
    padding: spacing['12'],
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    minHeight: 60,
  };
  const iconBox: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    background: colors.iconBg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const col: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 };
  const labelStyle: CSSProperties = {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 1.15,
  };
  const valueStyle: CSSProperties = {
    fontSize: 18,
    fontWeight: 800,
    color: valueColor ?? colors.text,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  return (
    <div style={card}>
      <span style={iconBox} aria-hidden>
        {icon}
      </span>
      <div style={col}>
        <span style={labelStyle}>{label}</span>
        <span style={valueStyle}>{value}</span>
      </div>
    </div>
  );
}
