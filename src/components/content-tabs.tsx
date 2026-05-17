'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  activeId: string;
  onChange?: (id: string) => void;
};

export function ContentTabs({ tabs, activeId, onChange }: Props) {
  const wrap: CSSProperties = {
    display: 'flex',
    gap: spacing['4'],
    padding: spacing['4'],
    margin: `${spacing['16']}px ${spacing['16']}px`,
    background: colors.cardSchedule,
    borderRadius: 999,
  };

  return (
    <div style={wrap}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const tabStyle: CSSProperties = {
          flex: 1,
          textAlign: 'center',
          padding: `${spacing['10']}px 0`,
          fontSize: 15,
          fontWeight: active ? 700 : 500,
          color: active ? colors.textInverse : colors.tabInactive,
          background: active ? colors.headerBg : 'transparent',
          borderRadius: 999,
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s ease, color 0.15s ease',
        };
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className="pressable"
            style={tabStyle}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
