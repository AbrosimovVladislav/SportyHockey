'use client';

import { BottomSheet } from '@/components/bottom-sheet';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
};

// Заглушка «Скоро» для секций раздела «Команда», ещё не реализованных.
// Заменяется реальным экраном по мере итераций v0.3.
export function SoonSheet({ open, onClose, title, description }: Props) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <p
        style={{
          ...typography.body,
          color: colors.textSecondary,
          margin: 0,
          paddingBottom: spacing['8'],
        }}
      >
        {description}
      </p>
    </BottomSheet>
  );
}
