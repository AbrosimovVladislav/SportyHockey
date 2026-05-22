'use client';

import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { VenueDto } from '@/types/api';

type Props = {
  open: boolean;
  onClose: () => void;
  venues: VenueDto[];
  activeId: string | null;
  onSelect: (venueId: string) => void;
};

export function VenueSelectSheet({ open, onClose, venues, activeId, onSelect }: Props) {
  const t = useT();
  return (
    <BottomSheet open={open} onClose={onClose} title={t('eventNew.sheet.venue.title')}>
      {venues.length === 0 ? (
        <div
          style={{
            padding: `${spacing['16']}px ${spacing['4']}px`,
            color: colors.textSecondary,
            fontSize: 14,
          }}
        >
          {t('eventNew.empty.venues')}
        </div>
      ) : (
        venues.map((v) => {
          const hintParts: string[] = [];
          if (v.cost_per_arena != null) {
            hintParts.push(`${v.cost_per_arena.toLocaleString('ru-RU')} ₽ аренда`);
          }
          if (v.default_cost_per_player != null) {
            hintParts.push(`${v.default_cost_per_player.toLocaleString('ru-RU')} ₽ с игрока`);
          }
          const hint = hintParts.length > 0 ? hintParts.join(' · ') : v.address ?? undefined;
          return (
            <BottomSheetOption
              key={v.id}
              label={v.name}
              hint={hint}
              active={activeId === v.id}
              onClick={() => {
                onSelect(v.id);
                onClose();
              }}
            />
          );
        })
      )}
    </BottomSheet>
  );
}
