'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav, BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Screen } from '@/components/screen';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

export default function TabsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const me = useMe();
  const t = useT();

  const noTeam = me.data ? me.data.memberships.length === 0 : false;

  useEffect(() => {
    if (noTeam) {
      router.replace('/onboarding');
    }
  }, [noTeam, router]);

  if (me.isLoading || noTeam) {
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
      <div style={{ paddingBottom: BOTTOM_NAV_HEIGHT + 16 }}>{children}</div>
      <BottomNav />
    </>
  );
}
