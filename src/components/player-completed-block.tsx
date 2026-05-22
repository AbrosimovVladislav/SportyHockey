'use client';

import type { CSSProperties, ReactNode } from 'react';
import { IconCheck, IconChevronRight, IconImage, IconRuble, IconStats } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type PaymentStatus = 'none' | 'unpaid' | 'partial' | 'paid';

type Props = {
  isGame: boolean;
  costPerPlayer: number | null;
  paidAmount: number | null;
  labels: {
    paid: string;
    partial: string;
    due: string;
    partialOf: string;
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
  paid: number;
  cost: number;
} {
  const c = cost ?? 0;
  const p = paid ?? 0;
  if (c <= 0) return { status: 'none', paid: p, cost: c };
  if (p <= 0) return { status: 'unpaid', paid: p, cost: c };
  if (p < c) return { status: 'partial', paid: p, cost: c };
  return { status: 'paid', paid: p, cost: c };
}

export function PlayerCompletedBlock({
  isGame,
  costPerPlayer,
  paidAmount,
  labels,
  onOpenStats,
  onOpenMedia,
}: Props) {
  const payment = computeStatus(costPerPlayer, paidAmount);
  const mediaSubtitle = isGame ? labels.mediaSubtitleGame : labels.mediaSubtitleTraining;

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  return (
    <div style={card}>
      {payment.status !== 'none' ? (
        <PaymentBanner
          status={payment.status}
          paid={payment.paid}
          cost={payment.cost}
          paidLabel={labels.paid}
          partialLabel={labels.partial}
          dueLabel={labels.due}
          partialOfTemplate={labels.partialOf}
        />
      ) : null}

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

function PaymentBanner({
  status,
  paid,
  cost,
  paidLabel,
  partialLabel,
  dueLabel,
  partialOfTemplate,
}: {
  status: Exclude<PaymentStatus, 'none'>;
  paid: number;
  cost: number;
  paidLabel: string;
  partialLabel: string;
  dueLabel: string;
  partialOfTemplate: string;
}) {
  const tone = {
    paid: {
      bg: colors.successBg,
      text: colors.successText,
      iconColor: colors.successText,
      icon: <IconCheck size={20} color={colors.successText} />,
    },
    partial: {
      bg: colors.warningBg,
      text: colors.warningText,
      iconColor: colors.warningText,
      icon: <IconRuble size={20} color={colors.warningText} />,
    },
    unpaid: {
      bg: colors.errorBg,
      text: colors.errorText,
      iconColor: colors.errorText,
      icon: <IconRuble size={20} color={colors.errorText} />,
    },
  }[status];

  const banner: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['16']}px`,
    background: tone.bg,
    borderRadius: radius.md,
  };

  const iconWrap: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.6)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const label =
    status === 'paid'
      ? paidLabel
      : status === 'partial'
        ? partialLabel
        : dueLabel;

  const amountText =
    status === 'partial'
      ? partialOfTemplate
          .replace('{paid}', formatRub(paid))
          .replace('{cost}', formatRub(cost))
      : status === 'paid'
        ? `${formatRub(paid)} ₽`
        : `${formatRub(cost)} ₽`;

  return (
    <div style={banner}>
      <span style={iconWrap}>{tone.icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: tone.text, lineHeight: 1.25 }}>
          {label}
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: tone.text,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.3px',
            lineHeight: 1.15,
          }}
        >
          {amountText}
        </span>
      </div>
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
