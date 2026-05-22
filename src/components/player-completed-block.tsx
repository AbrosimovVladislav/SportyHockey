'use client';

import type { CSSProperties, ReactNode } from 'react';
import { IconCheck, IconChevronRight, IconImage, IconStats } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type PaymentStatus = 'none' | 'unpaid' | 'partial' | 'paid';

type Props = {
  isGame: boolean;
  costPerPlayer: number | null;
  paidAmount: number | null;
  labels: {
    paymentLabel: string;
    paid: string;
    partial: string;
    due: string;
    none: string;
    completedTraining: string;
    completedGame: string;
    statsTitle: string;
    statsSubtitle: string;
    mediaTitle: string;
    mediaSubtitleTraining: string;
    mediaSubtitleGame: string;
  };
  onOpenStats: () => void;
  onOpenMedia: () => void;
};

function formatRub(n: number): string {
  return n.toLocaleString('ru-RU');
}

function computeStatus(cost: number | null, paid: number | null): {
  status: PaymentStatus;
  amount: number;
} {
  const c = cost ?? 0;
  const p = paid ?? 0;
  if (c <= 0) return { status: 'none', amount: 0 };
  if (p <= 0) return { status: 'unpaid', amount: c };
  if (p < c) return { status: 'partial', amount: p };
  return { status: 'paid', amount: p };
}

export function PlayerCompletedBlock({
  isGame,
  costPerPlayer,
  paidAmount,
  labels,
  onOpenStats,
  onOpenMedia,
}: Props) {
  const { status, amount } = computeStatus(costPerPlayer, paidAmount);

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  const completedLabel = isGame ? labels.completedGame : labels.completedTraining;
  const mediaSubtitle = isGame ? labels.mediaSubtitleGame : labels.mediaSubtitleTraining;

  return (
    <div style={card}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: spacing['16'],
        }}
      >
        <PaymentSection
          status={status}
          amount={amount}
          label={labels.paymentLabel}
          paidText={labels.paid}
          partialText={labels.partial}
          dueText={labels.due}
          noneText={labels.none}
        />
        <CompletedBadge label={completedLabel} />
      </div>

      <CtaButton
        variant="primary"
        icon={<IconStats size={20} color={colors.textInverse} />}
        title={labels.statsTitle}
        subtitle={labels.statsSubtitle}
        onClick={onOpenStats}
      />
      <CtaButton
        variant="outline"
        icon={<IconImage size={20} color={colors.primary} />}
        title={labels.mediaTitle}
        subtitle={mediaSubtitle}
        onClick={onOpenMedia}
      />
    </div>
  );
}

function PaymentSection({
  status,
  amount,
  label,
  paidText,
  partialText,
  dueText,
  noneText,
}: {
  status: PaymentStatus;
  amount: number;
  label: string;
  paidText: string;
  partialText: string;
  dueText: string;
  noneText: string;
}) {
  const statusText =
    status === 'paid'
      ? paidText
      : status === 'partial'
        ? partialText
        : status === 'unpaid'
          ? dueText
          : noneText;
  const amountColor =
    status === 'paid'
      ? colors.primary
      : status === 'unpaid'
        ? colors.error
        : status === 'partial'
          ? colors.warning
          : colors.textTertiary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{label}</span>
      {status === 'none' ? (
        <span style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{statusText}</span>
      ) : (
        <>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: amountColor,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.5px',
              lineHeight: 1.1,
              marginTop: 4,
            }}
          >
            {formatRub(amount)} ₽
          </span>
          <span style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{statusText}</span>
        </>
      )}
    </div>
  );
}

function CompletedBadge({ label }: { label: string }) {
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['6'],
    flexShrink: 0,
    maxWidth: 96,
  };
  const circle: CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: colors.primaryLight,
    color: colors.primary,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <div style={wrap}>
      <span style={circle}>
        <IconCheck size={28} color={colors.primary} />
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 1.25,
        }}
      >
        {label}
      </span>
    </div>
  );
}

type CtaProps = {
  variant: 'primary' | 'outline';
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
};

function CtaButton({ variant, icon, title, subtitle, onClick }: CtaProps) {
  const isPrimary = variant === 'primary';
  const style: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['16']}px`,
    background: isPrimary ? colors.primary : colors.bg,
    color: isPrimary ? colors.textInverse : colors.text,
    border: isPrimary ? 'none' : `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
  };
  const iconBox: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    background: isPrimary ? 'rgba(255,255,255,0.18)' : colors.primaryLight,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={style}>
      <span style={iconBox}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: isPrimary ? colors.textInverse : colors.text,
            lineHeight: 1.25,
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isPrimary ? 'rgba(255,255,255,0.85)' : colors.textSecondary,
            lineHeight: 1.3,
          }}
        >
          {subtitle}
        </span>
      </div>
      <IconChevronRight color={isPrimary ? colors.textInverse : colors.textTertiary} />
    </button>
  );
}
