'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Input } from './input';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
  title: string;
  playerName: string;
  playerSubtitle?: string;
  photoUrl?: string | null;
  costPerPlayer: number | null;
  currentPaid: number | null;
  feeLabel: string; // "Взнос за тренировку: 1 300 ₽"
  hint: string; // "Можно изменить сумму"
  saveLabel: string;
  cancelLabel: string;
  amountLabel: string;
  pending?: boolean;
};

function formatNumber(n: number): string {
  return n.toString();
}

export function PaymentSheet({
  open,
  onClose,
  onSubmit,
  title,
  playerName,
  playerSubtitle,
  photoUrl,
  costPerPlayer,
  currentPaid,
  feeLabel,
  hint,
  saveLabel,
  cancelLabel,
  amountLabel,
  pending,
}: Props) {
  const initial = currentPaid != null && currentPaid > 0
    ? formatNumber(currentPaid)
    : costPerPlayer != null
      ? formatNumber(costPerPlayer)
      : '';
  const [amount, setAmount] = useState(initial);

  useEffect(() => {
    if (open) setAmount(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const headRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    marginBottom: spacing['12'],
  };

  const playerNameStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
  };

  const playerSub: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  };

  const feeText: CSSProperties = {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing['12'],
  };

  const amountLabelStyle: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: spacing['6'],
  };

  const hintStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing['6'],
  };

  const handleSubmit = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) return;
    onSubmit(n);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div style={headRow}>
        <Avatar src={photoUrl} name={playerName} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={playerNameStyle}>{playerName}</div>
          {playerSubtitle ? <div style={playerSub}>{playerSubtitle}</div> : null}
        </div>
      </div>

      <div style={feeText}>{feeLabel}</div>

      <div style={amountLabelStyle}>{amountLabel}</div>
      <div style={{ position: 'relative' }}>
        <Input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.currentTarget.value.replace(/[^\d]/g, ''))}
          placeholder="0"
          style={{
            background: colors.bg,
            border: `1.5px solid ${colors.headerAccent}`,
            paddingRight: 36,
            fontSize: 22,
            fontWeight: 700,
            color: colors.headerAccent,
          }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: spacing['16'],
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.headerAccent,
            fontSize: 18,
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          ₽
        </span>
      </div>
      <div style={hintStyle}>{hint}</div>

      <div style={{ marginTop: spacing['24'], display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          disabled={pending}
          style={{ background: colors.headerAccent }}
        >
          {saveLabel}
        </Button>
        <Button
          fullWidth
          size="lg"
          variant="ghost"
          onClick={onClose}
          disabled={pending}
        >
          {cancelLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
