'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { Button } from '@/components/button';
import { IconCheck } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useMe } from '@/hooks/use-me';
import { formatName } from '@/lib/format-name';
import { useActiveTeamStore } from '@/store/active-team';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { colors } from '@/theme/colors';
import type { MeMembership } from '@/types/api';

export default function ProfilePage() {
  const t = useT();
  const me = useMe();
  const qc = useQueryClient();
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  const setActiveTeamId = useActiveTeamStore((s) => s.setActiveTeamId);
  const [copied, setCopied] = useState(false);

  const memberships = me.data?.memberships ?? [];
  const activeMembership = useMemo<MeMembership | undefined>(() => {
    if (memberships.length === 0) return undefined;
    if (activeTeamId) {
      const found = memberships.find((m) => m.team_id === activeTeamId);
      if (found) return found;
    }
    return memberships[0];
  }, [memberships, activeTeamId]);

  if (me.isLoading) {
    return (
      <Screen title={t('profile.title')}>
        <span style={{ ...typography.body, color: colors.textSecondary }}>
          {t('common.loading')}
        </span>
      </Screen>
    );
  }
  if (me.error || !me.data) {
    return (
      <Screen title={t('profile.title')}>
        <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>
      </Screen>
    );
  }

  const { user, invite_link } = me.data;
  const roleLabel = activeMembership
    ? activeMembership.role === 'organizer'
      ? t('profile.role.organizer')
      : t('profile.role.player')
    : null;

  const handleCopy = async () => {
    if (!invite_link) return;
    try {
      await navigator.clipboard.writeText(invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // буфер может быть недоступен — игнорируем
    }
  };

  const handleSwitchTeam = async (teamId: string) => {
    if (activeMembership?.team_id === teamId) return;
    setActiveTeamId(teamId);
    await qc.invalidateQueries();
  };

  const showSwitcher = memberships.length > 1;

  return (
    <Screen title={t('profile.title')}>
      <Card variant="warm">
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
          <Avatar src={user.photo_url} name={formatName(user)} size={56} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...typography.bodyBold, color: colors.text }}>{formatName(user)}</span>
            {user.username ? (
              <span style={{ ...typography.sm, color: colors.textSecondary }}>@{user.username}</span>
            ) : null}
          </div>
          {activeMembership && roleLabel ? (
            <Chip tone={activeMembership.role === 'organizer' ? 'primary' : 'neutral'}>
              {roleLabel}
            </Chip>
          ) : null}
        </div>
      </Card>

      {!showSwitcher && activeMembership ? (
        <Card variant="warm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...typography.caption, color: colors.textSecondary }}>
              {t('profile.team')}
            </span>
            <span style={{ ...typography.bodyBold, color: colors.text }}>
              {activeMembership.team_name}
            </span>
          </div>
        </Card>
      ) : null}

      {showSwitcher ? (
        <TeamSwitcher
          memberships={memberships}
          activeTeamId={activeMembership?.team_id ?? null}
          onSelect={handleSwitchTeam}
          headerLabel={t('profile.teamSwitcher.header')}
          organizerLabel={t('profile.role.organizer')}
          playerLabel={t('profile.role.player')}
        />
      ) : null}

      {invite_link ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <Button fullWidth onClick={handleCopy}>
            {copied ? t('profile.copied') : t('profile.copyInvite')}
          </Button>
          <span style={{ ...typography.sm, color: colors.textSecondary }}>
            {t('profile.copyInviteHint')}
          </span>
        </div>
      ) : null}
    </Screen>
  );
}

type TeamSwitcherProps = {
  memberships: MeMembership[];
  activeTeamId: string | null;
  onSelect: (teamId: string) => void;
  headerLabel: string;
  organizerLabel: string;
  playerLabel: string;
};

function TeamSwitcher({
  memberships,
  activeTeamId,
  onSelect,
  headerLabel,
  organizerLabel,
  playerLabel,
}: TeamSwitcherProps) {
  const wrap: CSSProperties = {
    background: colors.bgWarm,
    borderRadius: radius.lg,
    padding: spacing['16'],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  return (
    <div style={wrap}>
      <span style={{ ...typography.caption, color: colors.textSecondary }}>{headerLabel}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        {memberships.map((m) => (
          <TeamRow
            key={m.team_id}
            membership={m}
            active={m.team_id === activeTeamId}
            onClick={() => onSelect(m.team_id)}
            organizerLabel={organizerLabel}
            playerLabel={playerLabel}
          />
        ))}
      </div>
    </div>
  );
}

type TeamRowProps = {
  membership: MeMembership;
  active: boolean;
  onClick: () => void;
  organizerLabel: string;
  playerLabel: string;
};

function TeamRow({ membership, active, onClick, organizerLabel, playerLabel }: TeamRowProps) {
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['12']}px`,
    background: colors.bg,
    borderRadius: radius.md,
    border: `1.5px solid ${active ? colors.primary : 'transparent'}`,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  };
  const checkCircle: CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: active ? colors.primary : colors.bgMuted,
    color: active ? colors.textInverse : 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" onClick={onClick} style={row}>
      <span style={checkCircle}>{active ? <IconCheck size={14} color={colors.textInverse} /> : null}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            ...typography.bodyBold,
            color: colors.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {membership.team_name}
        </span>
        <span style={{ ...typography.sm, color: colors.textSecondary }}>
          {membership.role === 'organizer' ? organizerLabel : playerLabel}
        </span>
      </div>
    </button>
  );
}
