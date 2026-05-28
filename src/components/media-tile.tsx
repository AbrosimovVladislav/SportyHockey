'use client';

import type { CSSProperties } from 'react';
import { Avatar } from './avatar';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import type { MediaUploader } from '@/types/api';

type Props = {
  url: string;
  uploader: MediaUploader | null;
  onClick?: () => void;
};

export function MediaTile({ url, uploader, onClick }: Props) {
  const wrap: CSSProperties = {
    position: 'relative',
    width: '100%',
    aspectRatio: '1 / 1',
    background: colors.bgMuted,
    borderRadius: radius.md,
    overflow: 'hidden',
    border: 'none',
    padding: 0,
    cursor: onClick ? 'pointer' : 'default',
    display: 'block',
  };
  const img: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  };
  const uploaderWrap: CSSProperties = {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: '50%',
    overflow: 'hidden',
    border: `1.5px solid ${colors.bg}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  };

  const uploaderName = uploader
    ? `${uploader.first_name ?? ''} ${uploader.last_name ?? ''}`.trim() || '—'
    : '—';

  return (
    <button type="button" className="pressable" style={wrap} onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" style={img} loading="lazy" />
      {uploader ? (
        <span style={uploaderWrap}>
          <Avatar src={uploader.photo_url} name={uploaderName} size={22} />
        </span>
      ) : null}
    </button>
  );
}
