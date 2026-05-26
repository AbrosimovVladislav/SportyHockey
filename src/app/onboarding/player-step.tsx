'use client';

import { useState, type CSSProperties } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Avatar } from '@/components/avatar';
import { IconCheck, IconPeople } from '@/components/icons';
import { MemberForm, emptyMemberForm, splitName, type MemberFormValue } from '@/components/member-form';
import { useOnboard } from '@/hooks/use-onboard';
import { useTeamSearch } from '@/hooks/use-team-search';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { MeUser, TeamSearchItem } from '@/types/api';

// Flow 1: игрок сам заполняет профиль и выбирает одну команду — отправляем заявку.
export function PlayerStep({ user }: { user: MeUser }) {
  const t = useT();
  const qc = useQueryClient();
  const onboard = useOnboard();

  const [form, setForm] = useState<MemberFormValue>(() => ({
    ...emptyMemberForm(),
    name: [user.first_name, user.last_name].filter(Boolean).join(' '),
    birthDate: user.birth_date ?? '',
    shoots: user.shoots,
  }));
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState<TeamSearchItem | null>(null);

  const search = useTeamSearch(query.trim());
  const teams = search.data?.teams ?? [];

  const submit = () => {
    if (!team) return;
    const { first, last } = splitName(form.name);
    onboard.mutate(
      {
        first_name: first || null,
        last_name: last || null,
        birth_date: form.birthDate || null,
        shoots: form.shoots,
        join_team_id: team.id,
      },
      { onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }) },
    );
  };

  const label: CSSProperties = {
    ...typography.smBold,
    color: colors.textSecondary,
  };

  return (
    <Screen withTabBar={false} title={t('onboarding.player.title')}>
      <span style={{ ...typography.body, color: colors.textSecondary }}>
        {t('onboarding.player.subtitle')}
      </span>

      <MemberForm
        value={form}
        onChange={setForm}
        photo={null}
        onPhotoChange={() => {}}
        variant="onboarding"
        t={t}
      />

      <div style={label}>{t('onboarding.player.chooseTeam')}</div>
      <Input
        value={query}
        placeholder={t('onboarding.player.searchPlaceholder')}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        {teams.length === 0 && query.trim() && !search.isLoading ? (
          <span style={{ ...typography.sm, color: colors.textTertiary }}>
            {t('onboarding.player.searchEmpty')}
          </span>
        ) : null}
        {teams.map((it) => (
          <TeamRow key={it.id} item={it} active={team?.id === it.id} onClick={() => setTeam(it)} />
        ))}
      </div>

      {onboard.error ? (
        <span style={{ ...typography.sm, color: colors.error }}>{onboard.error.message}</span>
      ) : null}

      <Button
        fullWidth
        size="lg"
        disabled={!team || onboard.isPending}
        onClick={submit}
      >
        {t('onboarding.player.submit')}
      </Button>
    </Screen>
  );
}

function TeamRow({
  item,
  active,
  onClick,
}: {
  item: TeamSearchItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="pressable"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing['12'],
        padding: spacing['12'],
        borderRadius: radius.lg,
        border: `1px solid ${active ? colors.primary : colors.line}`,
        background: active ? colors.primaryLight : colors.bg,
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <Avatar src={item.logo_url} name={item.name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...typography.bodyBold, color: colors.text }}>{item.name}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing['4'],
            ...typography.sm,
            color: colors.textSecondary,
            marginTop: 2,
          }}
        >
          <IconPeople size={14} color={colors.textSecondary} />
          {item.member_count}
        </div>
      </div>
      {active ? <IconCheck size={20} color={colors.primary} /> : null}
    </button>
  );
}
