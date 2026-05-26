'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { Screen } from '@/components/screen';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

export default function TabsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const me = useMe();
  const t = useT();

  // В приложение пускаем только тех, кто прошёл онбординг и состоит в команде.
  // Остальные (нет команды / приглашённый не подтвердил профиль / ждёт аппрува) — на онбординг.
  const needsOnboarding = me.data
    ? me.data.memberships.length === 0 || !me.data.user.onboarded
    : false;

  useEffect(() => {
    if (needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [needsOnboarding, router]);

  if (me.isLoading || needsOnboarding) {
    return (
      <Screen>
        <span style={{ ...typography.body, color: colors.textSecondary }}>{t('common.loading')}</span>
      </Screen>
    );
  }
  if (me.isError) {
    return (
      <Screen>
        <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>
      </Screen>
    );
  }

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
