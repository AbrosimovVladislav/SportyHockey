'use client';

import { useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { ListRow } from '@/components/list-row';
import { TeamStatCells } from '@/components/team-stat-cells';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconPlayers,
  IconHockeyStick,
  IconShield,
  IconGoalie,
  IconShirt,
  IconStats,
  IconSticksCrossed,
  IconImage,
  IconSettings,
  IconUserCheck,
} from '@/components/icons';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useTeam } from '@/hooks/use-team';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useJoinRequests } from '@/hooks/use-join-requests';
import { useTeamSectionImages } from '@/hooks/use-team-section-images';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function TeamHubPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#233F30');

  const membersQ = useTeamMembers();
  const teamQ = useTeam();
  const { isOrganizer } = useIsOrganizer();
  // Бейдж с количеством pending-заявок для пункта «Заявки и приглашения».
  // Запрос идёт по тому же ключу, что pop-up в профиле — TanStack делит кеш,
  // повторного сетевого вызова не будет.
  const pendingQ = useJoinRequests(isOrganizer, 'pending');
  const pendingCount = pendingQ.data?.requests.length ?? 0;

  const members = membersQ.data?.members ?? [];
  const sectionImagesQ = useTeamSectionImages();
  // Картинка раздела «Команда»: кастом из team_section_images > общее фото
  // команды (teams.photo_url) > дефолт /team.png.
  const teamPhoto =
    sectionImagesQ.data?.team ?? teamQ.data?.photo_url ?? '/team.png';
  const counts = useMemo(
    () => ({
      total: members.length,
      forward: members.filter((m) => m.position === 'forward').length,
      defender: members.filter((m) => m.position === 'defender').length,
      goalie: members.filter((m) => m.position === 'goalie').length,
    }),
    [members],
  );

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };

  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 140px)`,
    padding: `${spacing['16']}px ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  return (
    <div style={root}>
      <DarkHeader title={t('team.title')} imageSrc={teamPhoto} />

      <div style={sheet}>
        <TeamStatCells
          cells={[
            { icon: <IconPlayers size={28} />, value: counts.total, label: t('team.stat.players') },
            { icon: <IconHockeyStick size={28} />, value: counts.forward, label: t('team.stat.forwards') },
            { icon: <IconShield size={28} />, value: counts.defender, label: t('team.stat.defenders') },
            { icon: <IconGoalie size={28} />, value: counts.goalie, label: t('team.stat.goalies') },
          ]}
        />

        <ListRow
          icon={<IconShirt size={20} color={colors.iconFg} />}
          title={t('team.section.roster.title')}
          subtitle={t('team.section.roster.subtitle')}
          onClick={() => router.push('/squad/roster')}
        />
        <ListRow
          icon={<IconStats size={20} color={colors.iconFg} />}
          title={t('team.section.stats.title')}
          subtitle={t('team.section.stats.subtitle')}
          onClick={() => router.push('/squad/stats')}
        />
        <ListRow
          icon={<IconImage size={20} color={colors.iconFg} />}
          title={t('team.section.media.title')}
          subtitle={t('team.section.media.subtitle')}
          onClick={() => router.push('/squad/media')}
        />
        {isOrganizer ? (
          <ListRow
            icon={<IconUserCheck size={20} color={colors.iconFg} />}
            title={t('team.section.requests.title')}
            subtitle={t('team.section.requests.subtitle')}
            onClick={() => router.push('/squad/requests')}
            right={pendingCount > 0 ? <PendingBadge count={pendingCount} /> : undefined}
          />
        ) : null}
        {isOrganizer ? (
          <ListRow
            icon={<IconSettings size={20} color={colors.iconFg} />}
            title={t('team.section.settings.title')}
            subtitle={t('team.section.settings.subtitle')}
            onClick={() => router.push('/squad/settings')}
          />
        ) : null}
        {/* «Тактика» — замьючена (раздел вынесен в post-MVP). Стоит
            последней в списке, чтобы не разрывать рабочие пункты. */}
        <ListRow
          icon={<IconSticksCrossed size={20} color={colors.iconFg} />}
          title={t('team.section.tactics.title')}
          subtitle={t('team.section.tactics.subtitle')}
          muted
        />
      </div>
    </div>
  );
}

// Числовой бейдж в правой части ListRow — количество ожидающих заявок.
function PendingBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        minWidth: 22,
        height: 22,
        padding: `0 ${spacing['8']}px`,
        borderRadius: radius.pill,
        background: colors.primary,
        color: colors.textInverse,
        fontSize: 12,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {count}
    </span>
  );
}
