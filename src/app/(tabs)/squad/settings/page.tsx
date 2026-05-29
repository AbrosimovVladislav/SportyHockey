'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { ContentTabs } from '@/components/content-tabs';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { useTeamSettings } from '@/hooks/use-team-settings';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { GeneralTab } from './settings-tabs/general-tab';
import { RolesTab } from './settings-tabs/roles-tab';
import { EventsFinanceTab } from './settings-tabs/events-finance-tab';
import { DangerTab } from './settings-tabs/danger-tab';

type TabId = 'general' | 'roles' | 'events' | 'danger';

// Корневой экран настроек команды. Светлая шапка с back на /squad,
// под ней — 4 вкладки. Активная — local state, без query-параметра в URL.
export default function TeamSettingsPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#FFFFFF');

  const [active, setActive] = useState<TabId>('general');
  const settingsQ = useTeamSettings();

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bg,
    paddingBottom: BOTTOM_NAV_HEIGHT,
  };

  const content: CSSProperties = {
    padding: `${spacing['16']}px ${spacing['16']}px ${spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['20'],
  };

  return (
    <div style={root}>
      <LightHeader
        title={t('teamSettings.title')}
        onBack={() => router.push('/squad')}
      />
      <ContentTabs
        tabs={[
          { id: 'general', label: t('teamSettings.tabs.general') },
          { id: 'roles', label: t('teamSettings.tabs.roles') },
          { id: 'events', label: t('teamSettings.tabs.events') },
          { id: 'danger', label: t('teamSettings.tabs.danger') },
        ]}
        activeId={active}
        onChange={(id) => setActive(id as TabId)}
      />
      <div style={content}>
        {active === 'general' ? <GeneralTab settings={settingsQ.data ?? null} /> : null}
        {active === 'roles' ? <RolesTab /> : null}
        {active === 'events' ? <EventsFinanceTab settings={settingsQ.data ?? null} /> : null}
        {active === 'danger' ? <DangerTab /> : null}
      </div>
    </div>
  );
}
