'use client';

import { useState, type CSSProperties } from 'react';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { IconChevronDown, IconCalendar } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

// Период-пикер с пресетами и произвольным диапазоном — для `/money/analytics`
// (итерация 55). Снаружи представлен pill-кнопкой «Янв — Июн 2026» рядом
// с иконкой-календарём (та же иконка — chip-shortcut «к последним 6 мес.»).
// Внутренний state — sheet с тремя пресетами и кастом-диапазоном.

export type RangePreset = '3m' | '6m' | '12m' | 'all' | 'custom';
export type RangeValue = { from: string; to: string; preset: RangePreset };

// Нижняя граница для пресета «Всё» — раньше команд не существует.
const ALL_FROM = '2020-01-01';

type Props = {
  value: RangeValue;
  onChange: (next: RangeValue) => void;
};

export function PeriodPickerRange({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<string>(value.from);
  const [customTo, setCustomTo] = useState<string>(value.to);

  const pill: CSSProperties = {
    flex: 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['8'],
    padding: `${spacing['10']}px ${spacing['16']}px`,
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    minHeight: 44,
  };

  const todayBtn: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    background: colors.bg,
    border: `1px solid ${colors.divider}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };

  const apply = (preset: RangePreset, range?: { from: string; to: string }) => {
    const r = range ?? rangeFromPreset(preset);
    onChange({ from: r.from, to: r.to, preset });
    setOpen(false);
  };

  return (
    <>
      <div style={{ display: 'flex', gap: spacing['8'], alignItems: 'center' }}>
        <button
          type="button"
          className="pressable"
          style={pill}
          onClick={() => setOpen(true)}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
            {formatLabel(value)}
          </span>
          <IconChevronDown size={14} color={colors.iconMuted} />
        </button>
        <button
          type="button"
          className="pressable"
          style={todayBtn}
          aria-label="Сбросить на последние 6 месяцев"
          onClick={() => apply('6m')}
        >
          <IconCalendar size={20} color={colors.text} />
        </button>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Период">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <BottomSheetOption
            label="3 месяца"
            active={value.preset === '3m'}
            onClick={() => apply('3m')}
          />
          <BottomSheetOption
            label="6 месяцев"
            active={value.preset === '6m'}
            onClick={() => apply('6m')}
          />
          <BottomSheetOption
            label="12 месяцев"
            active={value.preset === '12m'}
            onClick={() => apply('12m')}
          />
          <BottomSheetOption
            label="Всё время"
            active={value.preset === 'all'}
            onClick={() => apply('all')}
          />

          <div
            style={{
              marginTop: spacing['16'],
              paddingTop: spacing['16'],
              borderTop: `1px solid ${colors.divider}`,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: spacing['8'],
              }}
            >
              Произвольный диапазон
            </div>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['8'] }}
            >
              <div>
                <div
                  style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}
                >
                  От
                </div>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.currentTarget.value)}
                />
              </div>
              <div>
                <div
                  style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}
                >
                  До
                </div>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.currentTarget.value)}
                />
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => apply('custom', { from: customFrom, to: customTo })}
              disabled={!customFrom || !customTo || customFrom > customTo}
              style={{ marginTop: spacing['12'] }}
            >
              Применить
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

// Вычисление дат [from, to] для пресета. `to` = сегодня; `from` = первое
// число месяца, отстоящего на (N-1) месяцев назад, чтобы получить ровно N
// календарных месяцев включая текущий.
export function rangeFromPreset(preset: RangePreset): { from: string; to: string } {
  const today = new Date();
  const toIso = today.toISOString().slice(0, 10);
  if (preset === 'all') return { from: ALL_FROM, to: toIso };
  if (preset === 'custom') {
    // На custom без аргумента откатываемся к 6m — теоретически не должно случаться.
    return rangeFromPreset('6m');
  }
  const months = preset === '3m' ? 3 : preset === '6m' ? 6 : 12;
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1), 1),
  );
  return { from: start.toISOString().slice(0, 10), to: toIso };
}

// Дефолтный период экрана — последние 6 месяцев.
export function defaultRange(): RangeValue {
  const r = rangeFromPreset('6m');
  return { ...r, preset: '6m' };
}

const MONTHS_SHORT = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
];

function formatLabel(v: RangeValue): string {
  if (v.preset === 'all') return 'Всё время';
  const [fy, fm] = v.from.split('-').map((s) => Number.parseInt(s, 10));
  const [ty, tm] = v.to.split('-').map((s) => Number.parseInt(s, 10));
  const fLabel = MONTHS_SHORT[fm - 1] ?? '';
  const tLabel = MONTHS_SHORT[tm - 1] ?? '';
  if (fy === ty) return `${fLabel} — ${tLabel} ${ty}`;
  return `${fLabel} ${fy} — ${tLabel} ${ty}`;
}
