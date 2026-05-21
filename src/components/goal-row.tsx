'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { IconChevronRight, IconSticksCrossed } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMatchTime } from '@/lib/format-time';
import { formatName } from '@/lib/format-name';
import type { GoalDto } from '@/types/api';

type Props = {
  goal: GoalDto;
  index: number;
  sideALabel: string;
  sideBLabel: string;
  sideAValue: GoalDto['team_side'];
  unknownLabel: string;
  assistsPrefix: string;
  onClick?: () => void;
};

export function GoalRow({
  goal,
  index,
  sideALabel,
  sideBLabel,
  sideAValue,
  unknownLabel,
  assistsPrefix,
  onClick,
}: Props) {
  const sideLabel = goal.team_side === sideAValue ? sideALabel : sideBLabel;
  const scorerName = goal.scorer ? formatName(goal.scorer) : unknownLabel;
  const time = formatMatchTime(goal.time_seconds);
  const assistNames = goal.assists.map((a) => formatName(a));

  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: spacing['12'],
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: onClick ? 'pointer' : 'default',
    color: colors.text,
  };

  const iconBox: CSSProperties = {
    width: 36,
    minWidth: 36,
    height: 36,
    borderRadius: '50%',
    overflow: 'hidden',
    background: colors.primaryLight,
    color: colors.primary,
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

  const headerRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['6'],
    flexWrap: 'wrap',
  };

  const name: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
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

  const content = (
    <>
      <span style={iconBox} aria-hidden>
        {goal.scorer ? (
          <Avatar src={goal.scorer.photo_url} name={scorerName} size={36} />
        ) : (
          <IconSticksCrossed size={18} color={colors.primary} />
        )}
      </span>
      <div style={body}>
        <div style={headerRow}>
          <span style={name}>{scorerName}</span>
          <span style={sideChip}>{sideLabel}</span>
        </div>
        <div style={meta}>
          <span>#{index}</span>
          {time ? <span>· {time}</span> : null}
          {assistNames.length > 0 ? (
            <span>
              · {assistsPrefix}: {assistNames.join(', ')}
            </span>
          ) : null}
        </div>
      </div>
      {onClick ? <IconChevronRight /> : null}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="pressable" onClick={onClick} style={wrap}>
        {content}
      </button>
    );
  }
  return <div style={wrap}>{content}</div>;
}
