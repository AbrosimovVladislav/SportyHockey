'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { EmptyState } from '@/components/empty-state';
import { useT } from '@/hooks/use-t';
import { useMe } from '@/hooks/use-me';
import { useBackButton } from '@/hooks/use-back-button';
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

  const goWelcome = useCallback(() => setStep('welcome'), []);
  useBackButton(step === 'welcome' ? null : goWelcome);

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
      <Screen withTabBar={false}>
        <span style={{ ...typography.body, color: colors.textSecondary }}>
          {t('common.loading')}
        </span>
      </Screen>
    );
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
        {error ? (
          <span style={{ ...typography.sm, color: colors.error }}>{error}</span>
        ) : null}
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
    return (
      <Screen withTabBar={false}>
        <EmptyState
          title={t('onboarding.player.title')}
          description={t('onboarding.player.description')}
        />
      </Screen>
    );
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
