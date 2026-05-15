'use client';

import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { useT } from '@/hooks/use-t';
import { apiFetch } from '@/lib/api-client';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import type { TeamMember, TeamMembersResponse } from '@/types/api';

export default function SquadPage() {
  const t = useT();
  const q = useQuery<TeamMembersResponse>({
    queryKey: ['team-members'],
    queryFn: () => apiFetch<TeamMembersResponse>('/api/teams/me/members'),
  });

  if (q.isLoading) {
    return (
      <Screen title={t('squad.title')}>
        <span style={{ ...typography.body, color: colors.hint }}>{t('common.loading')}</span>
      </Screen>
    );
  }
  if (q.error || !q.data) {
    return (
      <Screen title={t('squad.title')}>
        <span style={{ ...typography.body, color: colors.destructive }}>{t('common.error')}</span>
      </Screen>
    );
  }

  const { team, members } = q.data;
  return (
    <Screen title={team.name}>
      {members.length === 0 ? (
        <EmptyState title={t('squad.empty')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {members.map((m) => (
            <MemberRow key={m.user_id} member={m} />
          ))}
        </div>
      )}
    </Screen>
  );
}

function MemberRow({ member }: { member: TeamMember }) {
  const t = useT();
  const name = formatName(member);
  const roleLabel =
    member.role === 'organizer' ? t('profile.role.organizer') : t('profile.role.player');
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <Avatar src={member.photo_url} name={name} size={40} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <span style={{ ...typography.bodyBold, color: colors.text }}>{name}</span>
          {member.username ? (
            <span style={{ ...typography.caption, color: colors.hint }}>@{member.username}</span>
          ) : null}
        </div>
        <Chip tone={member.role === 'organizer' ? 'accent' : 'neutral'}>{roleLabel}</Chip>
      </div>
    </Card>
  );
}

function formatName(m: TeamMember): string {
  const parts = [m.first_name, m.last_name].filter((v): v is string => Boolean(v));
  const joined = parts.join(' ').trim();
  return joined || m.username || '—';
}
