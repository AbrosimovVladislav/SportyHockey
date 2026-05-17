import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';

type Item = {
  src?: string | null;
  name?: string;
};

type Props = {
  items: Item[];
  size?: number;
  overlap?: number;
  max?: number;
};

export function AvatarStack({ items, size = 50, overlap = 14, max = 5 }: Props) {
  const visible = items.slice(0, max);
  const extra = items.length - visible.length;

  const wrap: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
  };

  const item: CSSProperties = {
    marginLeft: 0,
    border: `2px solid ${colors.bg}`,
    borderRadius: '50%',
    display: 'inline-flex',
  };

  const itemOffset: CSSProperties = {
    ...item,
    marginLeft: -overlap,
  };

  const more: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: colors.bgMuted,
    color: colors.textSecondary,
    fontSize: Math.round(size * 0.3),
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px solid ${colors.bg}`,
    marginLeft: -overlap,
    flexShrink: 0,
  };

  return (
    <div style={wrap}>
      {visible.map((it, i) => (
        <span key={i} style={i === 0 ? item : itemOffset}>
          <Avatar size={size} src={it.src ?? undefined} name={it.name} />
        </span>
      ))}
      {extra > 0 ? <span style={more}>+{extra}</span> : null}
    </div>
  );
}
