'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/card';
import { IconFinance } from '@/components/icons';
import { CardHead, caption } from './profile-cards';
import { formatDayMonth, formatTime } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerFinance, PlayerFinanceTx } from '@/types/api';

type T = (k: TKey) => string;

function formatRub(n: number): string {
  return Math.abs(n).toLocaleString('ru-RU');
}

export function PlayerFinanceTab({ finance, t }: { finance: PlayerFinance; t: T }) {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
      <BalanceCard finance={finance} t={t} />
      <HistoryCard
        transactions={finance.transactions}
        t={t}
        onOpenEvent={(id) => router.push(`/events/${id}`)}
      />
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
    <div style={{ height: 8, borderRadius: radiusPill, background: colors.bgMuted, overflow: 'hidden' }}>
      <div
        style={{ width: `${clamped}%`, height: '100%', background: colors.primary, borderRadius: radiusPill }}
      />
    </div>
  );
}

const radiusPill = 999;

function HistoryCard({
  transactions,
  t,
  onOpenEvent,
}: {
  transactions: PlayerFinanceTx[];
  t: T;
  onOpenEvent: (eventId: string) => void;
}) {
  return (
    <Card variant="surface">
      <div style={{ ...typography.smBold, color: colors.textSecondary, marginBottom: spacing['8'] }}>
        {t('player.finance.history')}
      </div>
      {transactions.length === 0 ? (
        <div style={{ ...caption, color: colors.textTertiary, paddingTop: spacing['8'] }}>
          {t('player.finance.empty')}
        </div>
      ) : (
        transactions.map((tx, i) => {
          const eventId = tx.event_id;
          return (
            <TxRow
              key={`${tx.kind}-${tx.id}`}
              tx={tx}
              t={t}
              isLast={i === transactions.length - 1}
              onOpen={eventId ? () => onOpenEvent(eventId) : undefined}
            />
          );
        })
      )}
    </Card>
  );
}

function TxRow({
  tx,
  t,
  isLast,
  onOpen,
}: {
  tx: PlayerFinanceTx;
  t: T;
  isLast: boolean;
  onOpen?: () => void;
}) {
  const isCharge = tx.kind === 'charge';
  const primary = isCharge ? (tx.title ?? '—') : (tx.title ?? t('player.finance.payment'));
  const kindWord = isCharge ? t('player.finance.charge') : t('player.finance.payment');
  const amountText = `${isCharge ? '+' : '−'}${formatRub(tx.amount)} ₽`;
  const clickable = Boolean(onOpen);
  return (
    <div
      className={clickable ? 'pressable' : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? primary : undefined}
      onClick={onOpen}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen?.();
              }
            }
          : undefined
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing['12'],
        padding: `${spacing['12']}px 0`,
        borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ ...typography.body, color: colors.text }}>{primary}</div>
        <div style={{ ...caption, marginTop: spacing['2'] }}>
          {formatDayMonth(tx.date)} · {formatTime(tx.date)} · {kindWord}
        </div>
      </div>
      <span
        style={{
          ...typography.bodyBold,
          color: isCharge ? colors.success : colors.text,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {amountText}
      </span>
    </div>
  );
}
