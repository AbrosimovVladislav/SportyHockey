'use client';

import type { CSSProperties } from 'react';
import { IconCheck, IconClose } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type PlayerVoteBlockProps = {
  question: string;
  goingLabel: string;
  notGoingLabel: string;
  myVote: 'going' | 'not_going' | null;
  disabled: boolean;
  onVote: (next: 'going' | 'not_going') => void;
};

export function PlayerVoteBlock({
  question,
  goingLabel,
  notGoingLabel,
  myVote,
  disabled,
  onVote,
}: PlayerVoteBlockProps) {
  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['20']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    alignItems: 'stretch',
  };
  const title: CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 1.3,
  };
  const stack: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
  };
  return (
    <div style={card}>
      <span style={title}>{question}</span>
      <div style={stack}>
        <PlayerVoteButton
          kind="going"
          active={myVote === 'going'}
          label={goingLabel}
          disabled={disabled}
          onClick={() => onVote('going')}
        />
        <PlayerVoteButton
          kind="notGoing"
          active={myVote === 'not_going'}
          label={notGoingLabel}
          disabled={disabled}
          onClick={() => onVote('not_going')}
        />
      </div>
    </div>
  );
}

type PlayerVoteButtonProps = {
  kind: 'going' | 'notGoing';
  active: boolean;
  label: string;
  disabled: boolean;
  onClick: () => void;
};

function PlayerVoteButton({ kind, active, label, disabled, onClick }: PlayerVoteButtonProps) {
  const isGoing = kind === 'going';
  const activeBg = isGoing ? colors.primary : colors.bgMuted;
  const activeColor = isGoing ? colors.textInverse : colors.text;
  const inactiveBorder = isGoing ? colors.primary : colors.border;
  const inactiveColor = isGoing ? colors.primary : colors.textSecondary;
  const Icon = isGoing ? IconCheck : IconClose;
  const iconColor = active ? activeColor : inactiveColor;

  const style: CSSProperties = {
    width: '100%',
    minHeight: 56,
    borderRadius: radius.md,
    padding: `${spacing['12']}px ${spacing['20']}px`,
    background: active ? activeBg : colors.bg,
    color: active ? activeColor : inactiveColor,
    border: active ? 'none' : `1.5px solid ${inactiveBorder}`,
    fontSize: 16,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['8'],
  };

  const iconWrap: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: `1.5px solid ${iconColor}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <button type="button" className="pressable" onClick={onClick} disabled={disabled} style={style}>
      <span style={iconWrap}>
        <Icon size={14} color={iconColor} />
      </span>
      {label}
    </button>
  );
}
