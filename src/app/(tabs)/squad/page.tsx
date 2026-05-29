'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { ListRow } from '@/components/list-row';
import { TeamStatCells } from '@/components/team-stat-cells';
import { SoonSheet } from '@/components/soon-sheet';
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
} from '@/components/icons';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function TeamHubPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#233F30');

  const membersQ = useTeamMembers();
  const [soon, setSoon] = useState<string | null>(null);

  const members = membersQ.data?.members ?? [];
  const counts = useMemo(
    () => ({
      total: members.length,
      forward: members.filter((m) => m.position === 'forward').length,
      defender: members.filter((m) => m.position === 'defender').length,
      goalie: members.filter((m) => m.position === 'goalie').length,
    }),
    [members],
  );

  const sections = [
    {
      key: 'roster',
      icon: <IconShirt size={20} color={colors.iconFg} />,
      title: t('team.section.roster.title'),
      subtitle: t('team.section.roster.subtitle'),
      onClick: () => router.push('/squad/roster'),
    },
    {
      key: 'stats',
      icon: <IconStats size={20} color={colors.iconFg} />,
      title: t('team.section.stats.title'),
      subtitle: t('team.section.stats.subtitle'),
      onClick: () => router.push('/squad/stats'),
    },
    {
      key: 'tactics',
      icon: <IconSticksCrossed size={20} color={colors.iconFg} />,
      title: t('team.section.tactics.title'),
      subtitle: t('team.section.tactics.subtitle'),
      onClick: () => setSoon(t('team.section.tactics.title')),
    },
    {
      key: 'media',
      icon: <IconImage size={20} color={colors.iconFg} />,
      title: t('team.section.media.title'),
      subtitle: t('team.section.media.subtitle'),
      onClick: () => router.push('/squad/media'),
    },
    {
      key: 'settings',
      icon: <IconSettings size={20} color={colors.iconFg} />,
      title: t('team.section.settings.title'),
      subtitle: t('team.section.settings.subtitle'),
      onClick: () => setSoon(t('team.section.settings.title')),
    },
  ];

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
      <DarkHeader title={t('team.title')} imageSrc="/team.png" />

      <div style={sheet}>
        <TeamStatCells
          cells={[
            { icon: <IconPlayers size={28} />, value: counts.total, label: t('team.stat.players') },
            { icon: <IconHockeyStick size={28} />, value: counts.forward, label: t('team.stat.forwards') },
            { icon: <IconShield size={28} />, value: counts.defender, label: t('team.stat.defenders') },
            { icon: <IconGoalie size={28} />, value: counts.goalie, label: t('team.stat.goalies') },
          ]}
        />

        {sections.map((s) => (
          <ListRow
            key={s.key}
            icon={s.icon}
            title={s.title}
            subtitle={s.subtitle}
            onClick={s.onClick}
          />
        ))}
      </div>

      <SoonSheet
        open={soon !== null}
        onClose={() => setSoon(null)}
        title={soon ?? ''}
        description={t('team.soon')}
      />
    </div>
  );
}
