'use client';

import { type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Button } from '@/components/button';
import { useMe } from '@/hooks/use-me';
import { usePlayerStats } from '@/hooks/use-team-member';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { PlayerStatsTab } from '@/app/(tabs)/squad/[user_id]/stats-tab';

// Моя статистика по активной команде (v0.4, итерация 45).
// Источник данных — тот же GET /api/teams/me/members/[user_id]/stats, но с
// подставленным me.user.id; сервер отдаёт стат-данные ровно для активной
// команды (X-Team-Id). Если активной команды у пользователя нет — empty CTA.
export default function MyStatsPage() {
  const t = useT();
  const router = useRouter();
  const me = useMe();
  const userId = me.data?.user.id ?? '';
  const hasTeam = (me.data?.memberships.length ?? 0) > 0;
  const q = usePlayerStats(userId, hasTeam);
  useTgHeader(colors.bg);

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  return (
    <div style={root}>
      <LightHeader title={t('myProfile.stats.title')} onBack={() => router.push('/profile')} />
      <div style={content}>
        {!hasTeam ? (
          <EmptyCta
            text={t('myProfile.stats.empty')}
            ctaLabel={t('myProfile.empty.cta')}
            onClick={() => router.push('/profile')}
          />
        ) : q.data ? (
          <PlayerStatsTab stats={q.data} t={t} />
        ) : q.isError ? (
          <Status text={t('common.error')} color={colors.error} />
        ) : (
          <Status text={t('common.loading')} color={colors.textSecondary} />
        )}
      </div>
    </div>
  );
}

function Status({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}

function EmptyCta({ text, ctaLabel, onClick }: { text: string; ctaLabel: string; onClick: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing['16'],
        padding: `${spacing['32']}px ${spacing['16']}px`,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <span style={{ ...typography.body, color: colors.textSecondary }}>{text}</span>
      <Button size="lg" onClick={onClick}>
        {ctaLabel}
      </Button>
    </div>
  );
}
