import type { LineSlot } from '@/types/api';

export const FORWARD_LINES = [1, 2, 3] as const;
export const DEFENSE_LINES = [1, 2, 3] as const;

export const LINE_SLOTS: readonly LineSlot[] = [
  'f1_lw', 'f1_c', 'f1_rw',
  'f2_lw', 'f2_c', 'f2_rw',
  'f3_lw', 'f3_c', 'f3_rw',
  'd1_ld', 'd1_rd',
  'd2_ld', 'd2_rd',
  'd3_ld', 'd3_rd',
  'g',
];

export function asLineSlot(value: string | null | undefined): LineSlot | null {
  if (!value) return null;
  return (LINE_SLOTS as readonly string[]).includes(value) ? (value as LineSlot) : null;
}

export function forwardSlot(line: 1 | 2 | 3, role: 'lw' | 'c' | 'rw'): LineSlot {
  return `f${line}_${role}` as LineSlot;
}

export function defenseSlot(pair: 1 | 2 | 3, role: 'ld' | 'rd'): LineSlot {
  return `d${pair}_${role}` as LineSlot;
}
