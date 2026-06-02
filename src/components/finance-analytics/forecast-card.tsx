'use client';

import { type CSSProperties } from 'react';
import { IconCheck, IconAlertTriangle } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMoney } from '@/lib/format-money';
import type { FinanceForecast } from '@/types/api';

// Блок «Прогноз на 3 месяца». Слева — табличка с ожидаемыми суммами,
// справа — кружок-вердикт «Денег хватит» / «Возможен кассовый разрыв».
type Props = {
  forecast: FinanceForecast;
};

export function ForecastCard({ forecast }: Props) {
  const wrap: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    borderRadius: radius.lg,
    padding: spacing['16'],
  };

  return (
    <div style={wrap}>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: colors.text,
          marginBottom: spacing['12'],
        }}
      >
        Прогноз на 3 месяца
      </div>

      <div style={{ display: 'flex', gap: spacing['16'], alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Row
            label="Ожидаемые взносы"
            value={`+${formatMoney(forecast.expected_income)}`}
            color={colors.success}
          />
          <Row
            label="Аренды"
            value={`−${formatMoney(forecast.expected_arenas)}`}
            color={colors.error}
          />
          <Row
            label="Прочие расходы"
            value={`−${formatMoney(forecast.expected_other_expenses)}`}
            color={colors.error}
          />
          <div
            style={{
              borderTop: `1px solid ${colors.divider}`,
              marginTop: spacing['8'],
              paddingTop: spacing['8'],
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <div style={{ fontSize: 13, color: colors.textSecondary }}>
              Прогнозируемый итог
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: forecast.net >= 0 ? colors.success : colors.error,
              }}
            >
              {forecast.net >= 0 ? '+' : '−'}
              {formatMoney(Math.abs(forecast.net))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: colors.textTertiary, marginTop: 2 }}>
            ожидаемый запас
          </div>
        </div>

        <Verdict ok={forecast.has_funds} />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: `${spacing['4']}px 0`,
      }}
    >
      <span style={{ fontSize: 13, color: colors.textSecondary }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color }}>{value}</span>
    </div>
  );
}

function Verdict({ ok }: { ok: boolean }) {
  return (
    <div
      style={{
        width: 116,
        flexShrink: 0,
        background: ok ? colors.successBg : colors.errorBg,
        borderRadius: radius.md,
        padding: spacing['12'],
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: spacing['8'],
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: ok ? colors.success : colors.error,
          color: colors.textInverse,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden
      >
        {ok ? <IconCheck size={20} color={colors.textInverse} /> : <IconAlertTriangle size={20} color={colors.textInverse} />}
      </span>
      <div style={{ fontSize: 13, fontWeight: 700, color: ok ? colors.success : colors.error }}>
        {ok ? 'Денег хватит' : 'Кассовый разрыв'}
      </div>
      <div style={{ fontSize: 11, color: colors.textSecondary, lineHeight: 1.3 }}>
        {ok ? 'кассового разрыва не ожидается' : 'нужно пополнение или сокращение трат'}
      </div>
    </div>
  );
}
