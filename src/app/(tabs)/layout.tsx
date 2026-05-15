'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { TabBar, TAB_BAR_HEIGHT } from '@/components/tab-bar';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { spacing } from '@/theme/spacing';
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
      <div style={{ padding: spacing.lg, ...typography.body, color: colors.hint }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <>
      <div style={{ paddingBottom: TAB_BAR_HEIGHT + spacing.lg }}>{children}</div>
      <TabBar />
    </>
  );
}
