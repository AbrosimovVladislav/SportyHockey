'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { useT } from '@/hooks/use-t';
import { useMe } from '@/hooks/use-me';
import { useBackButton } from '@/hooks/use-back-button';
import { ApiError, apiFetch } from '@/lib/api-client';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import type { CreateTeamRequest, CreateTeamResponse } from '@/types/api';
import { ConfirmStep } from './confirm-step';
import { PlayerStep } from './player-step';
import { WaitingStep } from './waiting-step';

type Step = 'welcome' | 'organizer' | 'player';

export default function OnboardingPage() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const [step, setStep] = useState<Step>('welcome');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const goWelcome = useCallback(() => setStep('welcome'), []);

  const data = me.data;
  const hasMembership = data ? data.memberships.length > 0 : false;
  const onboarded = data?.user.onboarded ?? false;
  const pending = data?.pending_join_request ?? null;
  // Приглашённый (членство есть, профиль не подтверждён) или ожидающий аппрува заявки —
  // у них своё представление, локального шага welcome/organizer/player нет.
  const derived = Boolean(data && ((hasMembership && !onboarded) || (!hasMembership && pending)));

  useBackButton(step === 'welcome' || derived ? null : goWelcome);

  useEffect(() => {
    if (data && onboarded && hasMembership) {
      router.replace('/');
    }
  }, [data, onboarded, hasMembership, router]);

  const createTeam = useMutation({
    mutationFn: (name: string) =>
      apiFetch<CreateTeamResponse>('/api/teams', {
        method: 'POST',
        body: JSON.stringify({ name } satisfies CreateTeamRequest),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
      router.replace('/');
    },
    onError: (e: unknown) => {
      setError(e instanceof ApiError ? e.message : t('common.error'));
    },
  });

  if (me.isLoading || !data) {
    return (
      <Screen withTabBar={false}>
        <span style={{ ...typography.body, color: colors.textSecondary }}>
          {t('common.loading')}
        </span>
      </Screen>
    );
  }

  if (onboarded && hasMembership) {
    return null; // редирект на '/' в эффекте
  }

  // Flow 2: приглашённый подтверждает предзаполненный профиль.
  if (hasMembership && !onboarded) {
    return <ConfirmStep user={data.user} />;
  }

  // Flow 1: заявка отправлена — ждём аппрува.
  if (!hasMembership && pending) {
    return <WaitingStep teamName={pending.team_name} />;
  }

  if (step === 'organizer') {
    const trimmed = teamName.trim();
    return (
      <Screen withTabBar={false} title={t('onboarding.organizer.title')}>
        <Input
          placeholder={t('onboarding.organizer.namePlaceholder')}
          value={teamName}
          onChange={(e) => setTeamName(e.currentTarget.value)}
          autoFocus
          maxLength={50}
        />
        {error ? <span style={{ ...typography.sm, color: colors.error }}>{error}</span> : null}
        <Button
          fullWidth
          size="lg"
          disabled={trimmed.length < 2 || createTeam.isPending}
          onClick={() => {
            setError(null);
            createTeam.mutate(trimmed);
          }}
        >
          {t('onboarding.organizer.create')}
        </Button>
      </Screen>
    );
  }

  if (step === 'player') {
    return <PlayerStep user={data.user} />;
  }

  return (
    <Screen withTabBar={false} title={t('onboarding.welcome.title')}>
      <span style={{ ...typography.body, color: colors.textSecondary }}>
        {t('onboarding.welcome.subtitle')}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        <Button fullWidth size="lg" onClick={() => setStep('organizer')}>
          {t('onboarding.role.organizer')}
        </Button>
        <Button variant="secondary" size="lg" fullWidth onClick={() => setStep('player')}>
          {t('onboarding.role.player')}
        </Button>
      </div>
    </Screen>
  );
}
