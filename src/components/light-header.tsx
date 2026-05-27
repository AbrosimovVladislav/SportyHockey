'use client';

import type { CSSProperties, ReactNode } from 'react';
import { IconBack } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  ariaLabelBack?: string;
};

export function LightHeader({ title, subtitle, onBack, right, ariaLabelBack = 'Назад' }: Props) {
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    gap: spacing['8'],
    // Верхний отступ под «опасную зону» (статус-бар + телеграм-кнопки) в fullscreen,
    // иначе sticky-хедер уедет под них. Вне fullscreen --app-safe-top = 0.
    paddingTop: `calc(${spacing['10']}px + var(--app-safe-top))`,
    paddingBottom: spacing['10'],
    paddingLeft: spacing['12'],
    paddingRight: spacing['12'],
    background: colors.bg,
    position: 'sticky',
    top: 0,
    zIndex: 5,
    minHeight: 56,
  };

  const backBtn: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: colors.bgMuted,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: onBack ? 'pointer' : 'default',
    flexShrink: 0,
  };

  const titleStyle: CSSProperties = {
    fontSize: 17,
    fontWeight: 800,
    margin: 0,
    color: colors.text,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.3px',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <header style={wrap}>
      {onBack ? (
        <button
          type="button"
          className="pressable"
          onClick={onBack}
          style={backBtn}
          aria-label={ariaLabelBack}
        >
          <IconBack size={20} color={colors.text} />
        </button>
      ) : (
        <span aria-hidden />
      )}
      <div style={{ minWidth: 0 }}>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
      </div>
      {right ? <div>{right}</div> : <span aria-hidden />}
    </header>
  );
}
