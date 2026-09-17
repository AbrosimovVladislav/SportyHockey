'use client';

import type { CSSProperties } from 'react';
import { IconMinus, IconPlus } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { formatShortDateLocal } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

// Серия тренировок в форме создания события (итерация 72): «создать N тренировок —
// каждую неделю в этот же день и время». count = 1 — обычное одиночное событие.

export const MAX_SERIES_COUNT = 12;

export function RepeatCountRow({
  count,
  onChange,
  dates,
}: {
  count: number;
  onChange: (next: number) => void;
  dates: string[]; // YYYY-MM-DD всех событий серии; пусто, пока дата не выбрана
}) {
  const t = useT();

  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['12'],
    padding: `${spacing['8']}px ${spacing['8']}px ${spacing['8']}px ${spacing['16']}px`,
    background: colors.bgMuted,
    borderRadius: radius.md,
  };
  const stepBtn = (disabled: boolean): CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: radius.md,
    border: `1px solid ${colors.divider}`,
    background: colors.bg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    flexShrink: 0,
  });
  const value: CSSProperties = {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
  };

  const atMin = count <= 1;
  const atMax = count >= MAX_SERIES_COUNT;

  return (
    <div>
      <div style={row}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
            {t('eventNew.repeat.label')}
          </div>
          <div style={{ fontSize: 13, color: colors.textSecondary }}>
            {t('eventNew.repeat.hint')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['8'] }}>
          <button
            type="button"
            className="pressable"
            style={stepBtn(atMin)}
            disabled={atMin}
            onClick={() => onChange(count - 1)}
            aria-label={t('eventNew.repeat.less')}
          >
            <IconMinus size={18} color={colors.text} />
          </button>
          <span style={value} aria-live="polite">
            {count}
          </span>
          <button
            type="button"
            className="pressable"
            style={stepBtn(atMax)}
            disabled={atMax}
            onClick={() => onChange(count + 1)}
            aria-label={t('eventNew.repeat.more')}
          >
            <IconPlus size={18} color={colors.text} />
          </button>
        </div>
      </div>
      {count > 1 && dates.length > 0 ? (
        <div
          style={{
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: spacing['8'],
            lineHeight: 1.45,
          }}
        >
          {t('eventNew.repeat.dates').replace('{dates}', dates.map(formatShortDateLocal).join(', '))}
        </div>
      ) : null}
    </div>
  );
}
