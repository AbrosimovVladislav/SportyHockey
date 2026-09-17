'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/button';
import { IconSend } from '@/components/icons';
import { useAnnounceEvent } from '@/hooks/use-announce-event';
import { useT } from '@/hooks/use-t';
import { useTeamChannel } from '@/hooks/use-team-channel';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Карточка «Анонс в группу» на экране события (итерация 71) — видна организатору, пока
// событие не прошло. Одно нажатие — бот публикует в группу команды пост с фото и кнопкой
// «Записаться». Группа не указана — ведём в настройки команды.

const sentFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export function EventAnnounceCard({
  eventId,
  announcedAt,
}: {
  eventId: string;
  announcedAt: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const channelQ = useTeamChannel();
  const announce = useAnnounceEvent(eventId);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const channel = channelQ.data;
  if (!channel) return null;

  async function handleSend() {
    if (announce.isPending) return;
    setStatus(null);
    try {
      await announce.mutateAsync();
      setStatus({ tone: 'ok', text: t('eventAnnounce.done') });
    } catch (e) {
      const reason = e instanceof ApiError ? e.message : '';
      setStatus({
        tone: 'error',
        text: [t('eventAnnounce.error'), reason].filter(Boolean).join('. '),
      });
    }
  }

  const card: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    border: `1px solid ${colors.line}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  const head: CSSProperties = { display: 'flex', alignItems: 'center', gap: spacing['8'] };
  const hint: CSSProperties = { ...typography.sm, color: colors.textSecondary };

  const group = channel.title ?? '';
  const subtitle = !channel.bound
    ? t('eventAnnounce.noGroup')
    : announcedAt
      ? t('eventAnnounce.sentAt')
          .replace('{when}', sentFmt.format(new Date(announcedAt)))
          .replace('{group}', group)
      : t('eventAnnounce.ready').replace('{group}', group);

  return (
    <div style={card}>
      <div style={head}>
        <IconSend size={20} color={colors.iconFg} />
        <span style={{ ...typography.bodyBold, color: colors.text }}>{t('eventAnnounce.title')}</span>
      </div>
      <div style={hint}>{subtitle}</div>

      {channel.bound ? (
        <Button
          variant={announcedAt ? 'secondary' : 'primary'}
          size="md"
          fullWidth
          onClick={() => void handleSend()}
          disabled={announce.isPending}
        >
          {announce.isPending
            ? t('eventAnnounce.sending')
            : announcedAt
              ? t('eventAnnounce.sendAgain')
              : t('eventAnnounce.send')}
        </Button>
      ) : (
        <Button variant="secondary" size="md" fullWidth onClick={() => router.push('/squad/settings')}>
          {t('eventAnnounce.toSettings')}
        </Button>
      )}

      {status ? (
        <div style={{ ...typography.sm, color: status.tone === 'ok' ? colors.successDark : colors.error }}>
          {status.text}
        </div>
      ) : null}
    </div>
  );
}
