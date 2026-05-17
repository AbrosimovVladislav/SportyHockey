import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  const wrapper: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['8'],
    padding: spacing['24'],
    textAlign: 'center',
  };

  const titleStyle: CSSProperties = {
    ...typography.h3,
    color: colors.text,
  };
  const descStyle: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
    maxWidth: 320,
  };

  return (
    <div style={wrapper}>
      <span style={titleStyle}>{title}</span>
      {description ? <span style={descStyle}>{description}</span> : null}
      {action ? <div style={{ marginTop: spacing['12'] }}>{action}</div> : null}
    </div>
  );
}
