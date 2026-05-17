'use client';

import { Screen } from '@/components/screen';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { useT } from '@/hooks/use-t';
import { useTeamMembers } from '@/hooks/use-team-members';
import { formatName } from '@/lib/format-name';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import type { TeamMember } from '@/types/api';

export default function SquadPage() {
  const t = useT();
  const q = useTeamMembers();

  if (q.isLoading) {
    return (
      <Screen title={t('squad.title')}>
        <span style={{ ...typography.body, color: colors.textSecondary }}>
          {t('common.loading')}
        </span>
      </Screen>
    );
  }
  if (q.error || !q.data) {
    return (
      <Screen title={t('squad.title')}>
        <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>
      </Screen>
    );
  }

  const { team, members } = q.data;
  return (
    <Screen title={team.name}>
      {members.length === 0 ? (
        <EmptyState title={t('squad.empty')} />
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          {members.map((m) => (
            <li key={m.user_id}>
              <MemberRow member={m} />
            </li>
          ))}
        </ul>
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
    <Card variant="warm">
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
        <Avatar src={member.photo_url} name={name} size={44} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...typography.bodyBold, color: colors.text }}>{name}</span>
          {member.username ? (
            <span style={{ ...typography.sm, color: colors.textSecondary }}>@{member.username}</span>
          ) : null}
        </div>
        <Chip tone={member.role === 'organizer' ? 'primary' : 'neutral'}>{roleLabel}</Chip>
      </div>
    </Card>
  );
}
