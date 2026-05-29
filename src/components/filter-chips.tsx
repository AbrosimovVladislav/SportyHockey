'use client';

import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Option = { id: string; label: string; count?: number };

type Props = {
  options: Option[];
  activeId: string;
  onChange?: (id: string) => void;
  // Слот справа в той же строке (напр. кнопка сортировки). Когда задан — чипы
  // выстраиваются в один ряд с горизонтальным скроллом, trailing закреплён справа.
  trailing?: ReactNode;
  // Компактный режим: меньший внешний паддинг сверху. Нужен, когда чипы стоят
  // сразу под другим управляющим элементом (вкладки, тулбар) и большой воздух
  // ломает визуальную связку.
  compact?: boolean;
};

export function FilterChips({ options, activeId, onChange, trailing, compact }: Props) {
  const wrap: CSSProperties = trailing
    ? {
        display: 'flex',
        alignItems: 'center',
        gap: spacing['8'],
        padding: `${spacing['12']}px ${spacing['16']}px ${spacing['4']}px`,
      }
    : {
        display: 'flex',
        gap: spacing['8'],
        padding: `${compact ? spacing['4'] : spacing['20']}px ${spacing['16']}px ${spacing['2']}px`,
        justifyContent: 'center',
        flexWrap: 'wrap',
      };

  const scroller: CSSProperties = {
    display: 'flex',
    gap: spacing['8'],
    flex: 1,
    minWidth: 0,
    overflowX: 'auto',
    scrollbarWidth: 'none',
  };

  const chips = options.map((o) => {
    const active = o.id === activeId;
    const chipStyle: CSSProperties = {
      padding: `${spacing['8']}px ${spacing['16']}px`,
      borderRadius: radius.xl,
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      lineHeight: '20px',
      whiteSpace: 'nowrap',
      background: active ? colors.headerBg : colors.cardSchedule,
      color: active ? colors.textInverse : colors.text,
      border: 'none',
      cursor: 'pointer',
      flexShrink: 0,
    };
    const countStyle: CSSProperties = {
      marginLeft: spacing['6'],
      fontWeight: 700,
      color: active ? colors.textInverse : colors.textSecondary,
      opacity: active ? 0.75 : 1,
      fontVariantNumeric: 'tabular-nums',
    };
    return (
      <button
        key={o.id}
        type="button"
        onClick={() => onChange?.(o.id)}
        className="pressable"
        style={chipStyle}
      >
        {o.label}
        {o.count != null ? <span style={countStyle}>{o.count}</span> : null}
      </button>
    );
  });

  return (
    <div style={wrap}>
      {trailing ? (
        <>
          <div style={scroller}>{chips}</div>
          <div style={{ flexShrink: 0 }}>{trailing}</div>
        </>
      ) : (
        chips
      )}
    </div>
  );
}
