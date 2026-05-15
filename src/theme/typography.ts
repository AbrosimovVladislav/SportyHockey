import type { CSSProperties } from 'react';

export const typography = {
  title: { fontSize: 24, fontWeight: 700, lineHeight: '32px' },
  heading: { fontSize: 18, fontWeight: 600, lineHeight: '24px' },
  body: { fontSize: 16, fontWeight: 400, lineHeight: '22px' },
  bodyBold: { fontSize: 16, fontWeight: 600, lineHeight: '22px' },
  caption: { fontSize: 14, fontWeight: 400, lineHeight: '18px' },
  small: { fontSize: 12, fontWeight: 400, lineHeight: '16px' },
} as const satisfies Record<string, CSSProperties>;

export type TypographyToken = keyof typeof typography;
