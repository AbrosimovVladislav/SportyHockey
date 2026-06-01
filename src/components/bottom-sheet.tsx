'use client';

import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function BottomSheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const backdrop: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  };

  // Sheet прижимается к низу backdrop'а, но отступает от низа экрана на
  // высоту нашего bottom-nav (64px) — иначе кнопки на дне sheet'а уезжают
  // под навбар табов. Также учитываем iOS safe-area для внутренних кнопок.
  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    padding: `${spacing['12']}px ${spacing['16']}px ${spacing['24']}px`,
    maxHeight: `calc(85dvh - ${BOTTOM_NAV_HEIGHT}px)`,
    overflowY: 'auto',
    boxShadow: '0 -8px 24px rgba(0,0,0,0.18)',
    marginBottom: BOTTOM_NAV_HEIGHT,
  };

  const handle: CSSProperties = {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: colors.divider,
    margin: '4px auto 14px',
  };

  const titleStyle: CSSProperties = {
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
    marginBottom: spacing['12'],
  };

  return (
    <div
      style={backdrop}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="presentation"
    >
      <div
        style={sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={handle} />
        {title ? <div style={titleStyle}>{title}</div> : null}
        {children}
      </div>
    </div>
  );
}

// Универсальная строка-опция для выбора (с галочкой справа)
type RowProps = {
  label: ReactNode;
  hint?: ReactNode;
  active?: boolean;
  onClick: () => void;
};

export function BottomSheetOption({ label, hint, active, onClick }: RowProps) {
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['12'],
    padding: `${spacing['12']}px ${spacing['4']}px`,
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    textAlign: 'left',
    color: colors.text,
    borderRadius: radius.md,
  };

  const check: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: active ? colors.primary : 'transparent',
    border: active ? 'none' : `1.5px solid ${colors.chipBorder}`,
    color: colors.textInverse,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  };

  return (
    <button type="button" className="pressable" onClick={onClick} style={row}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <span style={{ fontSize: 16, fontWeight: 500 }}>{label}</span>
        {hint ? <span style={{ fontSize: 13, color: colors.textSecondary }}>{hint}</span> : null}
      </div>
      <span style={check} aria-hidden>
        {active ? '✓' : ''}
      </span>
    </button>
  );
}
