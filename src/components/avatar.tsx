import type { CSSProperties } from 'react';
import { avatarTones, colors } from '@/theme/colors';

type Props = {
  src?: string | null;
  name?: string;
  size?: number;
  toneIdx?: number;
};

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

function toneIndexFor(name?: string): number {
  if (!name) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % avatarTones.length;
}

export function Avatar({ src, name, size = 46, toneIdx }: Props) {
  const idx = toneIdx ?? toneIndexFor(name);
  const tone = avatarTones[idx % avatarTones.length] ?? avatarTones[0];
  const [from, to] = tone;

  const base: CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    color: colors.textInverse,
    fontWeight: 700,
    fontSize: Math.round(size * 0.34),
    letterSpacing: 0.2,
    background: `linear-gradient(135deg, ${from}, ${to})`,
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? ''} style={base} />
    );
  }

  return (
    <span role="img" aria-label={name ?? ''} style={base}>
      {initials(name)}
    </span>
  );
}
