'use client';

import { type CSSProperties } from 'react';
import {
  IconCheck,
  IconAlertTriangle,
  IconTrendUp,
  IconTrendDown,
  IconChart,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMoney } from '@/lib/format-money';
import type { FinanceAnalyticsTrends, FinanceForecast } from '@/types/api';

// «Финансовое состояние» — карточка с большой суммой и status-чипом + 3 mini-chip.
// Логика статусов:
//   • «Финансы стабильны»  — total > 0 и forecast.net ≥ 0
//   • «Под контролем»      — total > 0 и forecast.net < 0 ИЛИ total = 0
//   • «Внимание»           — total < 0 ИЛИ has_funds = false
//
// 3 mini-chip считаются из trends и forecast: баланс/долги/прогноз.

type Props = {
  total: number;
  trends: FinanceAnalyticsTrends;
  forecast: FinanceForecast;
  // Длина периода (в месяцах) — для надписи «за N месяцев» в mini-chip'е.
  periodMonths: number;
};

type Status = 'stable' | 'control' | 'attention';

export function StateCard({ total, trends, forecast, periodMonths }: Props) {
  const status: Status =
    total < 0 || !forecast.has_funds
      ? 'attention'
      : total === 0 || forecast.net < 0
        ? 'control'
        : 'stable';

  const wrap: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    borderRadius: radius.lg,
    padding: spacing['16'],
  };

  const topRow: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing['8'],
    marginBottom: spacing['12'],
  };

  return (
    <div style={wrap}>
      <div style={topRow}>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
          Финансовое состояние
        </div>
        <StatusChip status={status} />
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: total >= 0 ? colors.success : colors.error,
          marginBottom: spacing['4'],
        }}
      >
        {total >= 0 ? '+' : '−'}
        {formatMoney(Math.abs(total))}
      </div>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing['12'] }}>
        текущий расчётный баланс
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['8'] }}>
        <MiniChip
          tone={trends.balance_change >= 0 ? 'positive' : 'negative'}
          icon={
            trends.balance_change >= 0 ? (
              <IconTrendUp size={14} color={colors.success} />
            ) : (
              <IconTrendDown size={14} color={colors.error} />
            )
          }
          title={trends.balance_change >= 0 ? 'Баланс вырос' : 'Баланс снизился'}
          hint={`за ${periodMonths} мес.`}
        />
        <MiniChip
          tone={trends.debts_change <= 0 ? 'positive' : 'negative'}
          icon={
            trends.debts_change <= 0 ? (
              <IconTrendDown size={14} color={colors.success} />
            ) : (
              <IconTrendUp size={14} color={colors.error} />
            )
          }
          title="Долги игроков"
          hint={trends.debts_change <= 0 ? 'снижаются' : 'растут'}
        />
        <MiniChip
          tone={forecast.net >= 0 ? 'positive' : 'negative'}
          icon={<IconChart size={14} color={forecast.net >= 0 ? colors.success : colors.error} />}
          title="Прогноз"
          hint={forecast.net >= 0 ? 'положительный' : 'отрицательный'}
        />
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  const map = {
    stable: { bg: colors.successBg, fg: colors.success, label: 'Финансы стабильны' },
    control: { bg: colors.warningBg, fg: colors.warning, label: 'Под контролем' },
    attention: { bg: colors.errorBg, fg: colors.error, label: 'Внимание' },
  } as const;
  const c = map[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing['4'],
        padding: `${spacing['4']}px ${spacing['10']}px`,
        background: c.bg,
        color: c.fg,
        borderRadius: radius.pill,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {status === 'attention' ? (
        <IconAlertTriangle size={12} color={c.fg} />
      ) : (
        <IconCheck size={12} color={c.fg} />
      )}
      {c.label}
    </span>
  );
}

type MiniChipProps = {
  tone: 'positive' | 'negative';
  icon: React.ReactNode;
  title: string;
  hint: string;
};

function MiniChip({ icon, title, hint }: MiniChipProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing['8'],
        padding: `${spacing['8']}px ${spacing['12']}px`,
        background: colors.bgMuted,
        borderRadius: radius.md,
      }}
    >
      <span aria-hidden>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{title}</span>
        <span style={{ fontSize: 11, color: colors.textSecondary }}>{hint}</span>
      </div>
    </div>
  );
}
