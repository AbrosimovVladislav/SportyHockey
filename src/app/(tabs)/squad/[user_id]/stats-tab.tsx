'use client';

import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/card';
import { IconGame, IconTraining, IconChevronRight } from '@/components/icons';
import { CardHead, StatCells, caption } from './profile-cards';
import { formatDayMonth, formatTime } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerEventStat, PlayerStats } from '@/types/api';

type T = (k: TKey) => string;

export function PlayerStatsTab({ stats, t }: { stats: PlayerStats; t: T }) {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
      <Card variant="surface">
        <CardHead title={t('player.stats.games')} icon={<IconGame size={22} color={colors.iconFg} />} />
        <div style={{ marginTop: spacing['12'] }}>
          <StatCells
            cells={[
              { label: t('player.stats.games'), value: stats.games.played },
              { label: t('player.stats.goals'), value: stats.games.goals },
              { label: t('player.stats.assists'), value: stats.games.assists },
              { label: t('player.stats.pim'), value: stats.games.penalty_minutes },
            ]}
          />
        </div>
      </Card>

      <Card variant="surface">
        <CardHead
          title={t('player.stats.trainings')}
          icon={<IconTraining size={22} color={colors.iconFg} />}
        />
        <div style={{ marginTop: spacing['12'] }}>
          <StatCells
            cells={[
              { label: t('player.stats.trainings'), value: stats.trainings.played },
              { label: t('player.stats.goals'), value: stats.trainings.goals },
              { label: t('player.stats.assists'), value: stats.trainings.assists },
            ]}
          />
        </div>
      </Card>

      <Card variant="surface">
        <div style={{ ...typography.smBold, color: colors.textSecondary, marginBottom: spacing['8'] }}>
          {t('player.stats.history')}
        </div>
        {stats.events.length === 0 ? (
          <div style={{ ...caption, color: colors.textTertiary, paddingTop: spacing['8'] }}>
            {t('player.stats.empty')}
          </div>
        ) : (
          stats.events.map((e, i) => (
            <EventRow
              key={e.event_id}
              event={e}
              t={t}
              isLast={i === stats.events.length - 1}
              onOpen={() => router.push(`/events/${e.event_id}`)}
            />
          ))
        )}
      </Card>
    </div>
  );
}

function EventRow({
  event,
  t,
  isLast,
  onOpen,
}: {
  event: PlayerEventStat;
  t: T;
  isLast: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      className="pressable"
      role="button"
      tabIndex={0}
      aria-label={event.title}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing['12'],
        padding: `${spacing['12']}px 0`,
        borderBottom: isLast ? 'none' : `1px solid ${colors.divider}`,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: colors.iconBg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {event.is_game ? (
          <IconGame size={20} color={colors.iconFg} />
        ) : (
          <IconTraining size={20} color={colors.iconFg} />
        )}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...typography.body,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {event.title}
        </div>
        <div style={{ ...caption, marginTop: spacing['2'] }}>
          {formatDayMonth(event.starts_at)} · {formatTime(event.starts_at)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: spacing['6'], flexShrink: 0 }}>
        <StatBadge label={t('player.stats.short.goals')} value={event.goals} tone="success" />
        <StatBadge label={t('player.stats.short.assists')} value={event.assists} tone="neutral" />
        {event.is_game ? (
          <StatBadge label={t('player.stats.short.pim')} value={event.penalty_minutes} tone="error" />
        ) : null}
      </div>
      <IconChevronRight size={16} color={colors.iconMuted} />
    </div>
  );
}

const badgeBase: CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 34,
  padding: `${spacing['4']}px ${spacing['6']}px`,
  borderRadius: radius.md,
  lineHeight: 1.1,
};

function StatBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'success' | 'neutral' | 'error';
}) {
  const palette =
    tone === 'success'
      ? { bg: colors.successBg, fg: colors.successText }
      : tone === 'error'
        ? { bg: colors.errorBg, fg: colors.errorText }
        : { bg: colors.bgMuted, fg: colors.textSecondary };
  return (
    <span style={{ ...badgeBase, background: palette.bg }}>
      <span style={{ fontSize: 10, fontWeight: 600, color: palette.fg, opacity: 0.85 }}>{label}</span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: palette.fg,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </span>
  );
}
