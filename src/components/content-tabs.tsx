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
    borderBottom: `1px solid ${colors.line}`,
    position: 'relative',
  };

  return (
    <div style={wrap}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        const tabStyle: CSSProperties = {
          flex: 1,
          textAlign: 'center',
          padding: `${spacing['16']}px 0 ${spacing['12']}px`,
          fontSize: 16,
          fontWeight: active ? 600 : 400,
          color: active ? colors.text : colors.tabInactive,
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        };
        const indicator: CSSProperties = {
          position: 'absolute',
          bottom: -1,
          left: '28%',
          right: '28%',
          height: 3,
          borderRadius: 2,
          background: colors.headerAccent,
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
            {active ? <span style={indicator} /> : null}
          </button>
        );
      })}
    </div>
  );
}
