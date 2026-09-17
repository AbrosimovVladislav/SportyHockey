'use client';

import type { CSSProperties } from 'react';
import { Switch } from '@/components/switch';
import { useT } from '@/hooks/use-t';
import { useTeamChannel } from '@/hooks/use-team-channel';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

// Строка «Анонс в канал» в форме создания события (итерация 70). Видна только
// когда у команды привязан Telegram-канал; иначе анонсировать некуда.
export function AnnounceToggleRow({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const t = useT();
  const channelQ = useTeamChannel();
  const channel = channelQ.data;

  if (!channel?.bound) return null;

  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing['12'],
    marginTop: spacing['16'],
    padding: `${spacing['8']}px ${spacing['16']}px`,
    background: colors.bgMuted,
    borderRadius: radius.md,
  };

  return (
    <div style={row}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>
          {t('eventNew.announce.label')}
        </div>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>
          {t('eventNew.announce.hint').replace('{channel}', channel.title ?? '')}
        </div>
      </div>
      <Switch checked={checked} onChange={onChange} ariaLabel={t('eventNew.announce.label')} />
    </div>
  );
}
