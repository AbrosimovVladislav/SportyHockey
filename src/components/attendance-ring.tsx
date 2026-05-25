'use client';

import { RingProgress } from './ring-progress';
import { colors } from '@/theme/colors';

type Props = {
  // Процент посещаемости 0–100 или null, если данных ещё нет.
  rate: number | null;
  size?: number;
};

// Цвет по уровню: высокая — брендовый зелёный, средняя — оранжевый, низкая — красный.
function rateColor(rate: number): string {
  if (rate >= 75) return colors.primary;
  if (rate >= 50) return colors.warning;
  return colors.error;
}

export function AttendanceRing({ rate, size = 44 }: Props) {
  if (rate == null) {
    return (
      <RingProgress
        size={size}
        stroke={4.5}
        value={0}
        total={1}
        label="—"
        labelSize={13}
        color={colors.textTertiary}
      />
    );
  }
  return (
    <RingProgress
      size={size}
      stroke={4.5}
      value={rate}
      total={100}
      label={`${rate}%`}
      labelSize={12}
      color={rateColor(rate)}
    />
  );
}
