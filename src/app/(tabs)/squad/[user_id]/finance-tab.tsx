'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/card';
import {
  IconFinance,
  IconGame,
  IconTraining,
  IconWallet,
  IconChevronRight,
} from '@/components/icons';
import { CardHead, RoundIcon, caption } from './profile-cards';
import { formatDayMonth, formatTime } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerFinance, PlayerFinanceEventRow, PlayerFinanceDepositRow } from '@/types/api';

type T = (k: TKey) => string;

function formatRub(n: number): string {
  return Math.abs(n).toLocaleString('ru-RU');
}

export function PlayerFinanceTab({ finance, t }: { finance: PlayerFinance; t: T }) {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
      <BalanceCard finance={finance} t={t} />
      <History rows={finance.rows} t={t} onOpenEvent={(id) => router.push(`/events/${id}`)} />
    </div>
  );
}

const balanceValue: CSSProperties = {
  ...typography.statLg,
  display: 'flex',
  alignItems: 'baseline',
  gap: spacing['12'],
};

function BalanceCard({ finance, t }: { finance: PlayerFinance; t: T }) {
  const { balance } = finance;
  const word =
    balance > 0
      ? t('player.finance.debt')
      : balance < 0
        ? t('player.finance.credit')
        : t('player.finance.zero');
  const amount = balance === 0 ? null : `${formatRub(balance)} ₽`;
  const valueColor = balance > 0 ? colors.error : balance < 0 ? colors.success : colors.text;
  return (
    <Card variant="surface">
      <CardHead
        title={t('player.finance.currentBalance')}
        icon={<IconFinance size={22} color={colors.iconFg} />}
      />
      <div style={{ marginTop: spacing['8'] }}>
        <div style={{ ...balanceValue, color: valueColor }}>
          <span>{word}</span>
          {amount ? <span>{amount}</span> : null}
        </div>
      </div>
      <div style={{ marginTop: spacing['16'] }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: spacing['8'],
          }}
        >
          <span style={caption}>
            {t('player.finance.paid')} {formatRub(finance.total_paid)} ₽ {t('player.finance.of')}{' '}
            {formatRub(finance.total_charged)} ₽
          </span>
          <span
            style={{
              ...typography.smBold,
              color: colors.textSecondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {finance.paid_percent}%
          </span>
        </div>
        <ProgressBar percent={finance.paid_percent} />
      </div>
    </Card>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div style={{ height: 8, borderRadius: radius.pill, background: colors.bgMuted, overflow: 'hidden' }}>
      <div
        style={{ width: `${clamped}%`, height: '100%', background: colors.primary, borderRadius: radius.pill }}
      />
    </div>
  );
}

function History({
  rows,
  t,
  onOpenEvent,
}: {
  rows: PlayerFinance['rows'];
  t: T;
  onOpenEvent: (eventId: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['10'] }}>
      <div style={{ ...typography.smBold, color: colors.textSecondary }}>
        {t('player.finance.history')}
      </div>
      {rows.length === 0 ? (
        <Card variant="surface">
          <div style={{ ...caption, color: colors.textTertiary }}>{t('player.finance.empty')}</div>
        </Card>
      ) : (
        rows.map((row) =>
          row.kind === 'event' ? (
            <EventCard key={`e-${row.event_id}`} row={row} t={t} onOpen={() => onOpenEvent(row.event_id)} />
          ) : (
            <DepositCard key={`d-${row.id}`} row={row} t={t} />
          ),
        )
      )}
    </div>
  );
}

const cardTitleText: CSSProperties = {
  ...typography.bodyBold,
  color: colors.text,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const tableBox: CSSProperties = {
  marginTop: spacing['12'],
  border: `1px solid ${colors.divider}`,
  borderRadius: radius.md,
  overflow: 'hidden',
};

function EventCard({
  row,
  t,
  onOpen,
}: {
  row: PlayerFinanceEventRow;
  t: T;
  onOpen: () => void;
}) {
  const remainder = row.charged - row.paid; // > 0 — долг, < 0 — переплата
  return (
    <Card variant="surface" onClick={onOpen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
        <RoundIcon>
          {row.is_game ? (
            <IconGame size={22} color={colors.iconFg} />
          ) : (
            <IconTraining size={22} color={colors.iconFg} />
          )}
        </RoundIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={cardTitleText}>{row.title}</div>
          <div style={{ ...caption, marginTop: spacing['2'] }}>
            {formatDayMonth(row.charged_date)} · {formatTime(row.charged_date)}
          </div>
        </div>
        <IconChevronRight size={16} color={colors.iconMuted} />
      </div>

      <div style={tableBox}>
        <MoneyRow
          label={t('player.finance.charge')}
          date={formatDayMonth(row.charged_date)}
          amount={`${formatRub(row.charged)} ₽`}
          amountColor={colors.text}
          first
        />
        <MoneyRow
          label={t('player.finance.payment')}
          date={row.paid_date ? formatDayMonth(row.paid_date) : '—'}
          amount={`${formatRub(row.paid)} ₽`}
          amountColor={row.paid > 0 ? colors.success : colors.textTertiary}
        />
        {remainder !== 0 ? (
          <RemainderBand
            label={remainder > 0 ? t('player.finance.debt') : t('player.finance.credit')}
            amount={`${formatRub(remainder)} ₽`}
            debt={remainder > 0}
          />
        ) : null}
      </div>
    </Card>
  );
}

function MoneyRow({
  label,
  date,
  amount,
  amountColor,
  first,
}: {
  label: string;
  date: string;
  amount: string;
  amountColor: string;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        padding: `${spacing['10']}px ${spacing['12']}px`,
        borderTop: first ? 'none' : `1px solid ${colors.divider}`,
      }}
    >
      <span style={{ ...typography.sm, color: colors.textSecondary, flex: 1, minWidth: 0 }}>
        {label}
      </span>
      <span style={{ ...caption, color: colors.textTertiary, width: 72, textAlign: 'right' }}>
        {date}
      </span>
      <span
        style={{
          ...typography.bodyBold,
          color: amountColor,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 72,
          marginLeft: spacing['12'],
          textAlign: 'right',
        }}
      >
        {amount}
      </span>
    </div>
  );
}

function RemainderBand({ label, amount, debt }: { label: string; amount: string; debt: boolean }) {
  const bg = debt ? colors.warningBg : colors.successBg;
  const fg = debt ? colors.warning : colors.successDark;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing['10']}px ${spacing['12']}px`,
        borderTop: `1px solid ${colors.divider}`,
        background: bg,
      }}
    >
      <span style={{ ...typography.smBold, color: fg }}>{label}</span>
      <span style={{ ...typography.bodyBold, color: fg, fontVariantNumeric: 'tabular-nums' }}>
        {amount}
      </span>
    </div>
  );
}

function DepositCard({ row, t }: { row: PlayerFinanceDepositRow; t: T }) {
  return (
    <Card variant="surface">
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
        <RoundIcon>
          <IconWallet size={22} color={colors.iconFg} />
        </RoundIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={cardTitleText}>{t('player.finance.deposit')}</div>
          <div style={{ ...caption, marginTop: spacing['2'] }}>
            {formatDayMonth(row.date)} · {formatTime(row.date)}
          </div>
          <div style={{ ...caption, color: colors.textTertiary, marginTop: spacing['2'] }}>
            {row.title ?? t('player.finance.transfer')}
          </div>
        </div>
        <span
          style={{
            ...typography.bodyBold,
            color: colors.success,
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          +{formatRub(row.amount)} ₽
        </span>
      </div>
    </Card>
  );
}
