import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'gold' | 'dark';

type Props = {
  children: ReactNode;
  tone?: Tone;
};

const toneStyles: Record<Tone, CSSProperties> = {
  neutral: {
    background: colors.bg,
    color: colors.text,
    border: `1.5px solid ${colors.chipBorder}`,
  },
  primary: { background: colors.primaryLight, color: colors.primary },
  success: { background: colors.successBg, color: colors.successText },
  warning: { background: colors.warningBg, color: colors.warningText },
  danger: { background: colors.errorBg, color: colors.errorText },
  gold: { background: colors.goldBg, color: colors.goldText },
  dark: { background: colors.headerBg, color: colors.textInverse },
};

export function Chip({ children, tone = 'neutral' }: Props) {
  const base: CSSProperties = {
    ...typography.sm,
    fontWeight: 500,
    padding: `${spacing['8']}px ${spacing['16']}px`,
    borderRadius: radius.xl,
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['6'],
    whiteSpace: 'nowrap',
    ...toneStyles[tone],
  };

  return <span style={base}>{children}</span>;
}
