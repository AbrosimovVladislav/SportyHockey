import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Tone = 'neutral' | 'accent' | 'success' | 'danger';

type Props = {
  children: ReactNode;
  tone?: Tone;
};

const toneStyles: Record<Tone, CSSProperties> = {
  neutral: { background: colors.secondaryBg, color: colors.text },
  accent: { background: colors.button, color: colors.buttonText },
  success: { background: '#1f8a4c', color: '#ffffff' },
  danger: { background: 'transparent', color: colors.destructive },
};

export function Chip({ children, tone = 'neutral' }: Props) {
  const base: CSSProperties = {
    ...typography.caption,
    padding: `${spacing.xs}px ${spacing.md}px`,
    borderRadius: radius.pill,
    display: 'inline-flex',
    alignItems: 'center',
    ...toneStyles[tone],
  };

  return <span style={base}>{children}</span>;
}
