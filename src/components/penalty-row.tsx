'use client';

import type { CSSProperties } from 'react';
import { IconTrash, IconWhistle } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMatchTime } from '@/lib/format-time';
import { formatName } from '@/lib/format-name';
import type { PenaltyDto } from '@/types/api';

type Props = {
  penalty: PenaltyDto;
  sideALabel: string;
  sideBLabel: string;
  sideAValue: PenaltyDto['team_side'];
  unknownLabel: string;
  minutesSuffix: string;
  onDelete?: () => void;
};

export function PenaltyRow({
  penalty,
  sideALabel,
  sideBLabel,
  sideAValue,
  unknownLabel,
  minutesSuffix,
  onDelete,
}: Props) {
  const sideLabel = penalty.team_side === sideAValue ? sideALabel : sideBLabel;
  const playerName = penalty.player ? formatName(penalty.player) : unknownLabel;
  const time = formatMatchTime(penalty.time_seconds);

  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: spacing['12'],
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
  };

  const iconBox: CSSProperties = {
    width: 36,
    minWidth: 36,
    height: 36,
    borderRadius: '50%',
    background: colors.warningBg,
    color: colors.warning,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const body: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const name: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
    flexWrap: 'wrap',
  };

  const meta: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing['6'],
  };

  const sideChip: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textSecondary,
    background: colors.bgMuted,
    padding: '2px 8px',
    borderRadius: radius.sm,
  };

  const trashBtn: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    background: 'transparent',
    border: 'none',
    color: colors.textTertiary,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };

  return (
    <div style={wrap}>
      <span style={iconBox} aria-hidden>
        <IconWhistle size={18} color={colors.warning} />
      </span>
      <div style={body}>
        <div style={name}>
          <span>{playerName}</span>
          <span style={sideChip}>{sideLabel}</span>
        </div>
        <div style={meta}>
          <span>
            {penalty.minutes} {minutesSuffix}
          </span>
          {time ? <span>· {time}</span> : null}
        </div>
      </div>
      {onDelete ? (
        <button
          type="button"
          className="pressable"
          aria-label="delete"
          onClick={onDelete}
          style={trashBtn}
        >
          <IconTrash size={18} color={colors.textTertiary} />
        </button>
      ) : null}
    </div>
  );
}
