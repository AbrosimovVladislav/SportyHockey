export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

export const RADIUS_FULL = '50%' as const;
export const RADIUS_SHEET = 24 as const;
