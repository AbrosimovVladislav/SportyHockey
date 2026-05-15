'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { EmptyState } from '@/components/empty-state';
import { useT } from '@/hooks/use-t';
import { useMe } from '@/hooks/use-me';
import { ApiError, apiFetch } from '@/lib/api-client';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import type { CreateTeamRequest, CreateTeamResponse } from '@/types/api';

type Step = 'welcome' | 'organizer' | 'player';

export default function OnboardingPage() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();
  const [step, setStep] = useState<Step>('welcome');
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me.data && me.data.memberships.length > 0) {
      router.replace('/');
    }
  }, [me.data, router]);

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

  if (me.isLoading) {
    return (
      <Screen>
        <span style={{ ...typography.body, color: colors.hint }}>{t('common.loading')}</span>
      </Screen>
    );
  }

  if (step === 'organizer') {
    const trimmed = teamName.trim();
    return (
      <Screen title={t('onboarding.organizer.title')}>
        <Input
          placeholder={t('onboarding.organizer.namePlaceholder')}
          value={teamName}
          onChange={(e) => setTeamName(e.currentTarget.value)}
          autoFocus
          maxLength={50}
        />
        {error ? (
          <span style={{ ...typography.caption, color: colors.destructive }}>{error}</span>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <Button
            fullWidth
            disabled={trimmed.length < 2 || createTeam.isPending}
            onClick={() => {
              setError(null);
              createTeam.mutate(trimmed);
            }}
          >
            {t('onboarding.organizer.create')}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setStep('welcome')}>
            {t('onboarding.back')}
          </Button>
        </div>
      </Screen>
    );
  }

  if (step === 'player') {
    return (
      <Screen>
        <EmptyState
          title={t('onboarding.player.title')}
          description={t('onboarding.player.description')}
          action={
            <Button variant="secondary" onClick={() => setStep('welcome')}>
              {t('onboarding.back')}
            </Button>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen title={t('onboarding.welcome.title')}>
      <span style={{ ...typography.body, color: colors.hint }}>
        {t('onboarding.welcome.subtitle')}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        <Button fullWidth onClick={() => setStep('organizer')}>
          {t('onboarding.role.organizer')}
        </Button>
        <Button variant="secondary" fullWidth onClick={() => setStep('player')}>
          {t('onboarding.role.player')}
        </Button>
      </div>
    </Screen>
  );
}
