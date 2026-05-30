'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Input } from '@/components/input';
import { Button } from '@/components/button';
import { BottomSheet } from '@/components/bottom-sheet';
import { Avatar } from '@/components/avatar';
import { useTeamSearch } from '@/hooks/use-team-search';
import { useMe } from '@/hooks/use-me';
import { useMyInvites, useApplyToTeam } from '@/hooks/use-my-invites';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TeamSearchItem } from '@/types/api';

// Подать заявку в команду (v0.4, итерация 46). Список команд с поиском
// по названию. Команды, в которых пользователь уже состоит или по которым
// есть pending-заявка, помечаются disabled с пояснением.
export default function ApplyToTeamPage() {
  const t = useT();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<TeamSearchItem | null>(null);
  const me = useMe();
  const invitesQ = useMyInvites();
  const teamsQ = useTeamSearch(debounced);
  const apply = useApplyToTeam();
  useTgHeader(colors.bg);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(id);
  }, [query]);

  const myMembershipIds = useMemo(
    () => new Set((me.data?.memberships ?? []).map((m) => m.team_id)),
    [me.data?.memberships],
  );
  const pendingTeamIds = useMemo(
    () =>
      new Set(
        (invitesQ.data?.items ?? [])
          .filter((i) => i.kind === 'request' && i.status === 'pending')
          .map((i) => i.team_id),
      ),
    [invitesQ.data?.items],
  );

  const onConfirm = async () => {
    if (!selected) return;
    await apply.mutateAsync({ team_id: selected.id });
    setSelected(null);
    router.replace('/profile/invites?tab=out');
  };

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const items = teamsQ.data?.teams ?? [];

  return (
    <div style={root}>
      <LightHeader
        title={t('myProfile.invites.new.title')}
        onBack={() => router.push('/profile/invites')}
      />
      <div style={content}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('myProfile.invites.new.searchPlaceholder')}
        />

        {teamsQ.isLoading ? (
          <Status text={t('common.loading')} color={colors.textSecondary} />
        ) : items.length === 0 ? (
          <Status text={t('myProfile.invites.new.empty')} color={colors.textSecondary} />
        ) : (
          items.map((tm) => {
            const isMember = myMembershipIds.has(tm.id);
            const isPending = pendingTeamIds.has(tm.id);
            const disabled = isMember || isPending;
            const reason = isMember
              ? t('myProfile.invites.new.alreadyMember')
              : isPending
                ? t('myProfile.invites.new.alreadyPending')
                : '';
            return (
              <button
                key={tm.id}
                type="button"
                className={disabled ? undefined : 'pressable'}
                onClick={() => {
                  if (disabled) return;
                  setSelected(tm);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing['12'],
                  padding: spacing['12'],
                  background: colors.bg,
                  borderRadius: radius.lg,
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.6 : 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <Avatar src={tm.logo_url} name={tm.name} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      ...typography.bodyBold,
                      color: colors.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tm.name}
                  </div>
                  <div style={{ ...typography.sm, color: colors.textSecondary }}>
                    {t('myProfile.invites.member_count').replace('{count}', String(tm.member_count))}
                  </div>
                </div>
                {disabled ? (
                  <span style={{ ...typography.sm, color: colors.textTertiary }}>{reason}</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={t('myProfile.invites.new.confirmTitle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
          <div style={{ ...typography.body, color: colors.textSecondary }}>
            {t('myProfile.invites.new.confirmBody')}
          </div>
          {selected ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['12'],
                padding: spacing['12'],
                background: colors.bgWarm,
                borderRadius: radius.md,
              }}
            >
              <Avatar src={selected.logo_url} name={selected.name} size={40} />
              <span style={{ ...typography.bodyBold, color: colors.text }}>{selected.name}</span>
            </div>
          ) : null}
          {apply.error ? (
            <div style={{ ...typography.sm, color: colors.error }}>{apply.error.message}</div>
          ) : null}
          <Button size="lg" fullWidth disabled={apply.isPending} onClick={onConfirm}>
            {t('myProfile.invites.new.submit')}
          </Button>
          <Button size="lg" variant="secondary" fullWidth onClick={() => setSelected(null)}>
            {t('common.cancel')}
          </Button>
        </div>
      </BottomSheet>
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
