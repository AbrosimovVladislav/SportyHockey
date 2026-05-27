'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { SectionCard } from '@/components/section-card';
import { PlayerCompletedBlock } from '@/components/player-completed-block';
import { PlayerVoteCompact } from '@/components/player-vote-compact';
import { PlayerVoteBlock } from '@/components/player-vote-block';
import { PlayerLineupBlock } from '@/components/player-lineup-block';
import { IconCheck, IconClose } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { EventAttendee, EventLineEntry, TeamSide } from '@/types/api';

type VotePillProps = {
  active: boolean;
  kind: 'going' | 'notGoing';
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

function VotePill({ active, kind, label, onClick, disabled }: VotePillProps) {
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

type Props = {
  id: string;
  isOrganizer: boolean;
  isCompleted: boolean;
  isGame: boolean;
  isTraining: boolean;
  myVote: 'going' | 'not_going' | null;
  mySide: TeamSide | null;
  myPaidAmount: number | null;
  costPerPlayer: number | null;
  myUserId: string;
  attendees: EventAttendee[];
  lines: EventLineEntry[];
  votePending: boolean;
  onVote: (next: 'going' | 'not_going') => void;
};

export function EventVoteSection({
  id,
  isOrganizer,
  isCompleted,
  isGame,
  isTraining,
  myVote,
  mySide,
  myPaidAmount,
  costPerPlayer,
  myUserId,
  attendees,
  lines,
  votePending,
  onVote,
}: Props) {
  const t = useT();
  const router = useRouter();

  const playerQuestion = isTraining
    ? t('eventDetail.vote.player.question.training')
    : t('eventDetail.vote.player.question.game');

  // Player — Состояние 3: завершено, оплата + CTA
  if (isCompleted && !isOrganizer) {
    return (
      <PlayerCompletedBlock
        isGame={isGame}
        costPerPlayer={costPerPlayer}
        paidAmount={myPaidAmount}
        labels={{
          paid: t('eventDetail.player.completed.payment.paid'),
          partial: t('eventDetail.player.completed.payment.partial'),
          due: t('eventDetail.player.completed.payment.due'),
          partialOf: t('eventDetail.player.completed.payment.partialOf'),
          statsTitle: t('eventDetail.player.completed.cta.stats.title'),
          statsSubtitle: t('eventDetail.player.completed.cta.stats.subtitle'),
          mediaTitle: t('eventDetail.player.completed.cta.media.title'),
          mediaSubtitleTraining: t('eventDetail.player.completed.cta.media.subtitleTraining'),
          mediaSubtitleGame: t('eventDetail.player.completed.cta.media.subtitleGame'),
        }}
        onOpenStats={() => router.push(`/events/${id}/result`)}
        onOpenMedia={() => router.push(`/events/${id}/media`)}
      />
    );
  }

  // Organizer — завершено: компактный статус
  if (isCompleted) {
    return (
      <SectionCard padding={spacing['10']}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: radius.sm,
            background: colors.bgMuted,
            color: colors.textSecondary,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {t('eventDetail.status.completed')}
        </span>
      </SectionCard>
    );
  }

  // Organizer — компактный блок голосования
  if (isOrganizer) {
    const voteQuestion = isTraining
      ? t('eventDetail.vote.question.training')
      : t('eventDetail.vote.question.game');
    return (
      <SectionCard padding={spacing['10']}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['6'] }}>
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
            {voteQuestion}
          </span>
          <div style={{ display: 'flex', gap: spacing['4'], flexShrink: 0 }}>
            <VotePill
              active={myVote === 'going'}
              kind="going"
              label={t('eventDetail.vote.going')}
              onClick={() => onVote('going')}
              disabled={votePending}
            />
            <VotePill
              active={myVote === 'not_going'}
              kind="notGoing"
              label={t('eventDetail.vote.notGoing')}
              onClick={() => onVote('not_going')}
              disabled={votePending}
            />
          </div>
        </div>
      </SectionCard>
    );
  }

  // Player — Состояние 1: большой блок голосования
  if (myVote == null) {
    return (
      <PlayerVoteBlock
        question={playerQuestion}
        goingLabel={t('eventDetail.vote.player.going')}
        notGoingLabel={t('eventDetail.vote.player.notGoing')}
        myVote={null}
        disabled={votePending}
        onVote={onVote}
      />
    );
  }

  // Player — Состояние 2: компактный голос + Моё звено
  return (
    <>
      <PlayerVoteCompact
        question={playerQuestion}
        goingLabel={t('eventDetail.vote.player.going')}
        notGoingLabel={t('eventDetail.vote.player.notGoing')}
        myVote={myVote}
        disabled={votePending}
        onVote={onVote}
      />
      <PlayerLineupBlock
        myUserId={myUserId}
        myVote={myVote}
        mySide={mySide}
        isGame={isGame}
        attendees={attendees}
        lines={lines}
        labels={{
          title: t('eventDetail.player.lineup.title'),
          viewAll: t('eventDetail.player.lineup.viewAll'),
          you: t('eventDetail.player.lineup.you'),
          sideOnlyTitleTemplate: t('eventDetail.player.lineup.sideOnly.title'),
          sideOnlyHint: t('eventDetail.player.lineup.sideOnly.hint'),
          notInRosterTitle: t('eventDetail.player.lineup.notInRoster'),
          notInRosterHint: t('eventDetail.player.lineup.notInRoster.hint'),
          notGoingTitle: t('eventDetail.player.lineup.notGoing'),
          notGoingHint: t('eventDetail.player.lineup.notGoing.hint'),
          linePrefix: t('eventDetail.player.lineup.linePrefix'),
          defensePrefix: t('eventDetail.player.lineup.defensePrefix'),
          goalieLabel: t('eventDetail.player.lineup.goalie'),
          sideLight: t('eventDetail.player.side.light'),
          sideDark: t('eventDetail.player.side.dark'),
          positions: {
            lw: t('eventDetail.player.position.lw'),
            c: t('eventDetail.player.position.c'),
            rw: t('eventDetail.player.position.rw'),
            ld: t('eventDetail.player.position.ld'),
            rd: t('eventDetail.player.position.rd'),
            g: t('eventDetail.player.position.g'),
            g1: t('eventDetail.player.position.g'),
            g2: t('eventDetail.player.position.g'),
          },
        }}
        onOpenLineup={() => router.push(`/events/${id}/lineup`)}
      />
    </>
  );
}
