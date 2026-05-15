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
    gap: spacing.sm,
    padding: spacing.xl,
    textAlign: 'center',
  };

  const titleStyle: CSSProperties = { ...typography.bodyBold, color: colors.text };
  const descStyle: CSSProperties = { ...typography.caption, color: colors.hint };

  return (
    <div style={wrapper}>
      <span style={titleStyle}>{title}</span>
      {description ? <span style={descStyle}>{description}</span> : null}
      {action ? <div style={{ marginTop: spacing.md }}>{action}</div> : null}
    </div>
  );
}
