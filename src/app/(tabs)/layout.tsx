import type { ReactNode } from 'react';
import { TabBar, TAB_BAR_HEIGHT } from '@/components/tab-bar';

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div style={{ paddingBottom: TAB_BAR_HEIGHT + 16 }}>{children}</div>
      <TabBar />
    </>
  );
}
