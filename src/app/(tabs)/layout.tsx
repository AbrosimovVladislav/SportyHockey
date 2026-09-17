'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { Screen } from '@/components/screen';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useActiveTeamStore } from '@/store/active-team';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

export default function TabsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const me = useMe();
  const t = useT();
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  const setActiveTeamId = useActiveTeamStore((s) => s.setActiveTeamId);

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

  // Активная команда живёт в localStorage и уходит на сервер заголовком X-Team-Id.
  // Если сохранённой команды нет среди членств (вышел, удалили, команда пересоздана),
  // `requireOrganizer` отвечает 403 — поэтому лечим значение до рендера экранов.
  const memberships = me.data?.memberships;
  const fallbackTeamId = memberships?.[0]?.team_id ?? null;
  const activeTeamStale = memberships
    ? !memberships.some((m) => m.team_id === activeTeamId) && activeTeamId !== fallbackTeamId
    : false;

  useEffect(() => {
    if (activeTeamStale) {
      setActiveTeamId(fallbackTeamId);
    }
  }, [activeTeamStale, fallbackTeamId, setActiveTeamId]);

  if (me.isLoading || needsOnboarding || activeTeamStale) {
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
