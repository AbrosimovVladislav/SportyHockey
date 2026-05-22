'use client';

import type { CSSProperties } from 'react';
import { IconCheck, IconClose } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Vote = 'going' | 'not_going';

type Props = {
  question: string;
  goingLabel: string;
  notGoingLabel: string;
  myVote: Vote | null;
  disabled?: boolean;
  onVote: (next: Vote) => void;
};

export function PlayerVoteCompact({
  question,
  goingLabel,
  notGoingLabel,
  myVote,
  disabled,
  onVote,
}: Props) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['10'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
  };

  return (
    <div style={card}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: colors.text,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {question}
      </span>
      <div style={{ display: 'flex', gap: spacing['4'], flexShrink: 0 }}>
        <Pill
          active={myVote === 'going'}
          kind="going"
          label={goingLabel}
          disabled={!!disabled}
          onClick={() => onVote('going')}
        />
        <Pill
          active={myVote === 'not_going'}
          kind="notGoing"
          label={notGoingLabel}
          disabled={!!disabled}
          onClick={() => onVote('not_going')}
        />
      </div>
    </div>
  );
}

type PillProps = {
  active: boolean;
  kind: 'going' | 'notGoing';
  label: string;
  disabled: boolean;
  onClick: () => void;
};

function Pill({ active, kind, label, disabled, onClick }: PillProps) {
  const isGoing = kind === 'going';
  const activeBg = isGoing ? colors.success : colors.error;
  const inactiveBg = colors.bg;
  const inactiveColor = colors.text;
  const Icon = isGoing ? IconCheck : IconClose;
  const iconColor = active ? colors.textInverse : inactiveColor;

  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '5px 8px',
    borderRadius: radius.md,
    background: active ? activeBg : inactiveBg,
    color: active ? colors.textInverse : inactiveColor,
    border: active ? 'none' : `1px solid ${colors.border}`,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: '16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
    minHeight: 28,
    whiteSpace: 'nowrap',
  };

  return (
    <button type="button" className="pressable" onClick={onClick} disabled={disabled} style={style}>
      <Icon size={12} color={iconColor} />
      {label}
    </button>
  );
}
