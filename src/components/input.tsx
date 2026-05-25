'use client';

import type { CSSProperties, InputHTMLAttributes, KeyboardEvent } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  fullWidth?: boolean;
  invalid?: boolean;
};

export function Input({
  fullWidth = true,
  invalid,
  style,
  type,
  enterKeyHint,
  onKeyDown,
  ...rest
}: Props) {
  const isDate = type === 'date';

  const base: CSSProperties = {
    ...typography.body,
    background: colors.bgMuted,
    color: colors.text,
    border: `1.5px solid ${invalid ? colors.error : 'transparent'}`,
    outline: 'none',
    minHeight: 44,
    padding: `${spacing['10']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    width: fullWidth ? '100%' : undefined,
    boxSizing: 'border-box',
    transition: 'border-color 100ms ease',
    // iOS: нативный date-инпут игнорирует width и вылезает за контейнер — сбрасываем appearance.
    ...(isDate ? { WebkitAppearance: 'none', appearance: 'none', minWidth: 0 } : null),
    ...style,
  };

  // Enter закрывает клавиатуру на текстовых полях: у одиночного инпута своего submit'а нет,
  // поэтому return по умолчанию ничего не делает — даём явный blur.
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.key === 'Enter' && !e.defaultPrevented) {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      {...rest}
      type={type}
      enterKeyHint={enterKeyHint ?? 'done'}
      onKeyDown={handleKeyDown}
      style={base}
    />
  );
}
