import type { DefenseRole, ForwardRole, LineIndex, LineSlot } from '@/types/api';

export const MAX_LINE_INDEX = 9;
export const LINE_SLOT_REGEX = /^(f[1-9]_(lw|c|rw)|d[1-9]_(ld|rd)|g[12]?)$/;

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

export type LineKind = 'forward' | 'defense' | 'goalie';

export function slotKind(slot: LineSlot): LineKind {
  if (slot.startsWith('f')) return 'forward';
  if (slot.startsWith('d')) return 'defense';
  return 'goalie';
}

export function lineIndexOfSlot(slot: LineSlot): LineIndex | null {
  return parseForwardIndex(slot) ?? parseDefenseIndex(slot);
}

const SLOT_ROLE_ORDER: Record<string, number> = {
  lw: 0, c: 1, rw: 2,
  ld: 0, rd: 1,
  g: 0, g1: 0, g2: 1,
};

export function slotSortKey(slot: LineSlot): number {
  const role = slot.includes('_') ? slot.split('_')[1] : slot;
  return SLOT_ROLE_ORDER[role] ?? 99;
}
