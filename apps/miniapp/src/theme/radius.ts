export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 9999,
} as const;

export type RadiusToken = keyof typeof radius;
