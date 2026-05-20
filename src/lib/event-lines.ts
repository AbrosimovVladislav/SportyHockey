import type { DefenseRole, ForwardRole, LineIndex, LineSlot } from '@/types/api';

export const MAX_LINE_INDEX = 9;
export const LINE_SLOT_REGEX = /^(f[1-9]_(lw|c|rw)|d[1-9]_(ld|rd)|g)$/;

export function asLineSlot(value: string | null | undefined): LineSlot | null {
  if (!value) return null;
  return LINE_SLOT_REGEX.test(value) ? (value as LineSlot) : null;
}

export function forwardSlot(line: LineIndex, role: ForwardRole): LineSlot {
  return `f${line}_${role}` as LineSlot;
}

export function defenseSlot(pair: LineIndex, role: DefenseRole): LineSlot {
  return `d${pair}_${role}` as LineSlot;
}

export function parseForwardIndex(slot: LineSlot): LineIndex | null {
  const m = /^f([1-9])_/.exec(slot);
  return m ? (Number(m[1]) as LineIndex) : null;
}

export function parseDefenseIndex(slot: LineSlot): LineIndex | null {
  const m = /^d([1-9])_/.exec(slot);
  return m ? (Number(m[1]) as LineIndex) : null;
}
