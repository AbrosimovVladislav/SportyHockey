import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { Avatar } from './avatar';

type Props = {
  name: string;
  subtitle?: string;
  photoUrl?: string | null;
  right?: ReactNode;
  isLast?: boolean;
};

export function PlayerRow({ name, subtitle, photoUrl, right, isLast = false }: Props) {
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
  };

  const nameStyle: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: 500,
    marginTop: 2,
  };

  return (
    <div>
      <div style={row}>
        <Avatar src={photoUrl} name={name} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={nameStyle}>{name}</div>
          {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
        </div>
        {right ? <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{right}</div> : null}
      </div>
      {!isLast ? <div style={{ height: 1, background: colors.divider, marginLeft: 74 }} /> : null}
    </div>
  );
}
