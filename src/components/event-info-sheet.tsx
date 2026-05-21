'use client';

import type { CSSProperties, ReactNode } from 'react';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Avatar } from './avatar';
import { IconSticksCrossed, IconWhistle } from './icons';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatMatchTime } from '@/lib/format-time';
import { formatName } from '@/lib/format-name';
import type { GoalDto, GoalParticipant, PenaltyDto, ResultSide } from '@/types/api';

type Event =
  | { kind: 'goal'; goal: GoalDto }
  | { kind: 'penalty'; penalty: PenaltyDto };

type Props = {
  open: boolean;
  event: Event | null;
  sideAValue: ResultSide;
  sideALabel: string;
  sideBLabel: string;
  onClose: () => void;
};

export function EventInfoSheet({
  open,
  event,
  sideAValue,
  sideALabel,
  sideBLabel,
  onClose,
}: Props) {
  const t = useT();
  if (!event) return null;

  const isGoal = event.kind === 'goal';
  const side = isGoal ? event.goal.team_side : event.penalty.team_side;
  const isOur = side === sideAValue;
  const sideLabel = side === sideAValue ? sideALabel : sideBLabel;
  const time = isGoal ? event.goal.time_seconds : event.penalty.time_seconds;
  const timeText = formatMatchTime(time);
  const minute = time != null ? Math.floor(time / 60) + 1 : null;

  const player: GoalParticipant | null = isGoal
    ? event.goal.scorer
    : event.penalty.player;

  const assists: GoalParticipant[] = isGoal ? event.goal.assists : [];
  const minutes = !isGoal ? event.penalty.minutes : null;

  const titleColor = isGoal ? colors.primary : colors.warning;
  const titleBg = isGoal ? colors.primaryLight : colors.warningBg;

  const headBlock: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    marginBottom: spacing['16'],
  };
  const iconBox: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: titleBg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const titleText: CSSProperties = {
    fontSize: 17,
    fontWeight: 800,
    color: colors.text,
  };
  const subTitle: CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: colors.textSecondary,
  };

  const rows: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    marginBottom: spacing['16'],
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div style={headBlock}>
        <span style={iconBox}>
          {isGoal ? (
            <IconSticksCrossed size={20} color={titleColor} />
          ) : (
            <IconWhistle size={20} color={titleColor} />
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={titleText}>
            {isGoal ? t('result.goal.title') : t('result.penalty.title')}
          </div>
          <div style={subTitle}>
            {sideLabel}
            {minute != null
              ? ` · ${interp(t('result.info.minute'), { n: minute })}`
              : timeText
                ? ` · ${timeText}`
                : ''}
          </div>
        </div>
      </div>

      <div style={rows}>
        {isOur && player ? (
          <Row
            label={isGoal ? t('result.goal.scorer') : t('result.penalty.player')}
            value={<PersonValue p={player} />}
          />
        ) : isOur && !player ? (
          <Row
            label={isGoal ? t('result.goal.scorer') : t('result.penalty.player')}
            value={<span style={mutedValue}>{t('result.unknownPlayer')}</span>}
          />
        ) : null}

        {!isOur ? (
          <Row
            label={t('result.info.team')}
            value={<span style={emptyValueStyle}>{sideLabel}</span>}
          />
        ) : null}

        {isGoal && assists.length > 0 ? (
          <Row
            label={t('result.assistsPrefix')}
            value={
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['6'] }}>
                {assists.map((a) => (
                  <PersonValue key={a.user_id} p={a} />
                ))}
              </div>
            }
          />
        ) : null}

        {!isGoal && minutes != null ? (
          <Row
            label={t('result.penalty.minutes')}
            value={
              <span style={emptyValueStyle}>
                {minutes} {t('result.penalty.minutesSuffix')}
              </span>
            }
          />
        ) : null}

        <Row
          label={t('result.info.timeLabel')}
          value={
            <span style={emptyValueStyle}>
              {minute != null && timeText
                ? `${interp(t('result.info.minute'), { n: minute })} · ${timeText}`
                : t('result.info.noTime')}
            </span>
          }
        />
      </div>

      <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
        {t('result.info.close')}
      </Button>
    </BottomSheet>
  );
}

const emptyValueStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: colors.text,
};

const mutedValue: CSSProperties = {
  fontSize: 15,
  fontWeight: 500,
  color: colors.textTertiary,
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: colors.bgMuted,
    borderRadius: radius.md,
  };
  const lbl: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };
  return (
    <div style={wrap}>
      <span style={lbl}>{label}</span>
      <div>{value}</div>
    </div>
  );
}

function PersonValue({ p }: { p: GoalParticipant }) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
  };
  return (
    <div style={wrap}>
      <Avatar src={p.photo_url} name={formatName(p)} size={28} />
      <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{formatName(p)}</span>
      {p.jersey_number != null ? (
        <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
          #{p.jersey_number}
        </span>
      ) : null}
    </div>
  );
}

function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
