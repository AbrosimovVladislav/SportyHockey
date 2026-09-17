'use client';

import { MenuButton } from '@/components/menu-button';
import { IconSend } from '@/components/icons';
import { useAnnounceEvent } from '@/hooks/use-announce-event';
import { useT } from '@/hooks/use-t';
import { useTeamChannel } from '@/hooks/use-team-channel';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';

// Пункт меню события «Анонсировать в канал» (итерация 70). Рендерится только
// если у команды привязан Telegram-канал. Результат показываем системным
// сообщением — так же, как остальные статусы на экранах события.
export function EventAnnounceMenuItem({
  eventId,
  announcedAt,
  onDone,
}: {
  eventId: string;
  announcedAt: string | null;
  onDone: () => void;
}) {
  const t = useT();
  const channelQ = useTeamChannel();
  const announce = useAnnounceEvent(eventId);

  if (!channelQ.data?.bound) return null;

  async function handleClick() {
    if (announce.isPending) return;
    try {
      await announce.mutateAsync();
      onDone();
      window.alert(t('eventMenu.announceDone'));
    } catch (e) {
      const reason = e instanceof ApiError ? e.message : '';
      window.alert([t('eventMenu.announceError'), reason].filter(Boolean).join('\n'));
    }
  }

  const label = announce.isPending
    ? t('eventMenu.announcing')
    : announcedAt
      ? t('eventMenu.announceAgain')
      : t('eventMenu.announce');

  return (
    <MenuButton
      icon={<IconSend size={20} color={colors.iconFg} />}
      label={label}
      onClick={() => void handleClick()}
    />
  );
}
