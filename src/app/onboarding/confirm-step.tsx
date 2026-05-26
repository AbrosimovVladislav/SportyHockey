'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/screen';
import { Button } from '@/components/button';
import { MemberForm, emptyMemberForm, splitName, type MemberFormValue } from '@/components/member-form';
import { useOnboard } from '@/hooks/use-onboard';
import { useT } from '@/hooks/use-t';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import type { MeUser } from '@/types/api';

// Flow 2: приглашённый игрок видит предзаполненный профиль (данные завёл организатор) и подтверждает.
export function ConfirmStep({ user }: { user: MeUser }) {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const onboard = useOnboard();

  const [form, setForm] = useState<MemberFormValue>(() => ({
    ...emptyMemberForm(),
    name: [user.first_name, user.last_name].filter(Boolean).join(' '),
    birthDate: user.birth_date ?? '',
    shoots: user.shoots,
  }));

  const submit = () => {
    const { first, last } = splitName(form.name);
    onboard.mutate(
      {
        first_name: first || null,
        last_name: last || null,
        birth_date: form.birthDate || null,
        shoots: form.shoots,
      },
      {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: ['me'] });
          router.replace('/');
        },
      },
    );
  };

  return (
    <Screen withTabBar={false} title={t('onboarding.confirm.title')}>
      <span style={{ ...typography.body, color: colors.textSecondary }}>
        {t('onboarding.confirm.subtitle')}
      </span>
      <MemberForm
        value={form}
        onChange={setForm}
        photo={null}
        onPhotoChange={() => {}}
        variant="onboarding"
        t={t}
      />
      {onboard.error ? (
        <span style={{ ...typography.sm, color: colors.error }}>{onboard.error.message}</span>
      ) : null}
      <Button fullWidth size="lg" disabled={onboard.isPending} onClick={submit}>
        {t('onboarding.confirm.submit')}
      </Button>
    </Screen>
  );
}
