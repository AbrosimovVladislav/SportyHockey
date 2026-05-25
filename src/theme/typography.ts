import type { CSSProperties } from 'react';

export const typography = {
  display: { fontSize: 32, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' },
  h1: { fontSize: 28, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
  h2: { fontSize: 20, fontWeight: 700, lineHeight: 1.3 },
  h3: { fontSize: 17, fontWeight: 600, lineHeight: 1.35 },
  body: { fontSize: 15, fontWeight: 400, lineHeight: 1.47 },
  bodyBold: { fontSize: 15, fontWeight: 600, lineHeight: 1.47 },
  sm: { fontSize: 13, fontWeight: 400, lineHeight: 1.38 },
  smBold: { fontSize: 13, fontWeight: 600, lineHeight: 1.38 },
  caption: { fontSize: 12, fontWeight: 500, lineHeight: 1.33 },
  label: { fontSize: 13, fontWeight: 600, lineHeight: 1.38 },
  score: { fontSize: 48, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  statLg: {
    fontSize: 34,
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
  },
  stat: { fontSize: 24, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' },
} as const satisfies Record<string, CSSProperties>;

export type TypographyToken = keyof typeof typography;

export const numericStyle: CSSProperties = { fontVariantNumeric: 'tabular-nums' };
