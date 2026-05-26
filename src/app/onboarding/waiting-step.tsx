'use client';

import { Screen } from '@/components/screen';
import { EmptyState } from '@/components/empty-state';
import { useT } from '@/hooks/use-t';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

// Flow 1: заявка отправлена — ждём, пока организатор её подтвердит.
export function WaitingStep({ teamName }: { teamName: string }) {
  const t = useT();
  return (
    <Screen withTabBar={false}>
      <EmptyState title={t('onboarding.waiting.title')} description={t('onboarding.waiting.description')} />
      <div
        style={{
          ...typography.bodyBold,
          color: colors.text,
          textAlign: 'center',
          marginTop: spacing['8'],
        }}
      >
        {teamName}
      </div>
    </Screen>
  );
}
