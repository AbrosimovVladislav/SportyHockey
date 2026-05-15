import type { CSSProperties } from 'react';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
};

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? '?').toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? '');
}

export function Avatar({ src, name, size = 40 }: Props) {
  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: colors.secondaryBg,
    color: colors.hint,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    ...typography.bodyBold,
    fontSize: Math.round(size * 0.4),
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? ''} style={base} />
    );
  }

  return <span style={base}>{initials(name)}</span>;
}
