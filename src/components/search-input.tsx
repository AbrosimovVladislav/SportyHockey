'use client';

import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { IconSearch } from './icons';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChange, placeholder }: Props) {
  const wrap: CSSProperties = {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  };
  const iconWrap: CSSProperties = {
    position: 'absolute',
    left: spacing['12'],
    display: 'flex',
    pointerEvents: 'none',
  };
  const input: CSSProperties = {
    ...typography.body,
    width: '100%',
    background: colors.bgMuted,
    color: colors.text,
    border: '1.5px solid transparent',
    outline: 'none',
    minHeight: 44,
    padding: `${spacing['10']}px ${spacing['12']}px ${spacing['10']}px 42px`,
    borderRadius: radius.md,
  };

  return (
    <div style={wrap}>
      <span style={iconWrap}>
        <IconSearch size={18} color={colors.textTertiary} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={input}
      />
    </div>
  );
}
