'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatMoney } from '@/lib/format-money';

// Карточка детализации под «Расчётным балансом» (v0.5, итерации 57 + 58).
// Используется парой в гриде 1fr 1fr: слева «Мы должны», справа «Нам должны».
// Каждая строка = pill-плашка с категорией + сумма справа. Инвариант:
// сумма по всем строкам = `TeamBalanceSummary.owed_by_us` или `owed_to_us`.
//
// С итерации 58 фильтр `value > 0` снят: карточка показывает все переданные
// строки, в том числе нулевые. Это нужно, чтобы три категории (Площадке /
// Игрокам / Прочее или Игроки / Переплаты площадкам / Прочее) всегда были на
// своих местах и визуально не «дрожали» при обнулении одной из них. Если
// items пуст — карточка не рендерится.

type Tone = 'negative' | 'positive';

export type BalanceDetailItem = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  tone: Tone;
  items: BalanceDetailItem[];
};

export function BalanceDetailsCard({ title, tone, items }: Props) {
  if (items.length === 0) return null;

  const pillBg = tone === 'negative' ? colors.error : colors.success;
  const titleColor = tone === 'negative' ? colors.errorDark : colors.successDark;

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    minWidth: 0,
  };

  const titleStyle: CSSProperties = {
    ...typography.caption,
    color: titleColor,
    fontWeight: 700,
    letterSpacing: '-0.005em',
  };

  return (
    <div style={card}>
      <div style={titleStyle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        {items.map((it, i) => (
          <Row key={i} label={it.label} value={it.value} pillBg={pillBg} />
        ))}
      </div>
    </div>
  );
}

function Row({ label, value, pillBg }: { label: string; value: number; pillBg: string }) {
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['8'],
    minWidth: 0,
  };
  const pill: CSSProperties = {
    background: pillBg,
    color: colors.textInverse,
    borderRadius: radius.md,
    padding: `${spacing['4']}px ${spacing['10']}px`,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.2,
    minHeight: 26,
    display: 'inline-flex',
    alignItems: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  };
  const valueStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
  };
  return (
    <div style={row}>
      <span style={pill}>{label}</span>
      <span style={valueStyle}>{formatMoney(value)}</span>
    </div>
  );
}
