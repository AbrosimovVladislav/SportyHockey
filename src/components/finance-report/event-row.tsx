'use client';

import { type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevronRight, IconWhistle, IconHockeyStick } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { formatMoney } from '@/lib/format-money';
import type { FinanceReportEvent } from '@/types/api';

// Компактная строка-событие в карточке «События за период» на `/money/report`.
// Иконка-тип слева (тренировка/игра), название и подпись «собрано / арена»,
// справа — нетто и шеврон. Тап ведёт в карточку события.
type Props = {
  ev: FinanceReportEvent;
  collectedLabel: string;
  arenaLabel: string;
};

export function EventRow({ ev, collectedLabel, arenaLabel }: Props) {
  const router = useRouter();

  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['10']}px 0`,
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
  };

  const iconBox: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: colors.mediaDepositBg,
    color: colors.mediaDepositFg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const netColor =
    ev.net > 0 ? colors.success : ev.net < 0 ? colors.error : colors.text;
  const netText =
    ev.net > 0
      ? `+${formatMoney(ev.net)}`
      : ev.net < 0
        ? `−${formatMoney(Math.abs(ev.net))}`
        : formatMoney(0);

  const Icon = ev.type === 'game' ? IconHockeyStick : IconWhistle;

  return (
    <button
      type="button"
      className="pressable"
      style={row}
      onClick={() => router.push(`/events/${ev.id}`)}
    >
      <span style={iconBox} aria-hidden>
        <Icon size={18} color={colors.mediaDepositFg} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
          {titleFor(ev)}
          <span
            style={{ fontWeight: 400, color: colors.textSecondary }}
          >{` · ${formatDay(ev.starts_at)}`}</span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {collectedLabel} {formatMoney(ev.collected)} · {arenaLabel}{' '}
          {formatMoney(ev.arena_cost)}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['8'],
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: netColor }}>
          {netText}
        </span>
        <IconChevronRight size={14} color={colors.iconMuted} />
      </div>
    </button>
  );
}

const MONTHS_SHORT = [
  'янв',
  'фев',
  'мар',
  'апр',
  'мая',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()] ?? ''}`;
}

function titleFor(ev: FinanceReportEvent): string {
  if (ev.type === 'game') {
    return ev.opponent_name ? `Игра · ${ev.opponent_name}` : 'Игра';
  }
  return ev.title ?? 'Тренировка';
}
