'use client';

import type { CSSProperties } from 'react';
import { MediaTile } from './media-tile';
import { spacing } from '@/theme/spacing';
import type { MediaItemDto } from '@/types/api';

type Props = {
  items: MediaItemDto[];
  onOpen: (index: number) => void;
};

export function MediaGrid({ items, onOpen }: Props) {
  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing['6'],
  };
  return (
    <div style={grid}>
      {items.map((m, i) => (
        <MediaTile
          key={m.id}
          url={m.url}
          uploader={m.uploaded_by}
          onClick={() => onOpen(i)}
        />
      ))}
    </div>
  );
}
