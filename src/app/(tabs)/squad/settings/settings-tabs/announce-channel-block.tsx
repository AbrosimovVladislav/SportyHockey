'use client';

import { useState, type CSSProperties } from 'react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { IconCheckCircle, IconTelegram } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useTeamChannel, useUnbindTeamChannel } from '@/hooks/use-team-channel';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { SectionHeader } from './section-header';

// Блок «Чат анонсов» на вкладке «Общее» (итерация 70). Привязка делается в Telegram:
// бота добавляют в группу команды (или отправляют там /connect); для канала — делают
// бота администратором и пересылают ему пост. Здесь — статус, инструкция и отвязка.

export function AnnounceChannelBlock() {
  const t = useT();
  const channelQ = useTeamChannel();
  const unbind = useUnbindTeamChannel();
  const [error, setError] = useState<string | null>(null);

  const channel = channelQ.data;
  const botName = channel?.bot_username ? `@${channel.bot_username}` : t('teamSettings.channel.botFallback');
  const connectCmd = channel?.bot_username ? `/connect@${channel.bot_username}` : '/connect';

  async function handleUnbind() {
    setError(null);
    try {
      await unbind.mutateAsync();
    } catch {
      setError(t('teamSettings.channel.unbindError'));
    }
  }

  const statusRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
  };
  const iconBox: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    background: channel?.bound ? colors.successBg : colors.bgMuted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const title: CSSProperties = { fontSize: 15, fontWeight: 700, color: colors.text };
  const hint: CSSProperties = { fontSize: 13, color: colors.textSecondary, lineHeight: 1.45 };
  const steps: CSSProperties = {
    ...hint,
    margin: 0,
    marginTop: spacing['12'],
    paddingLeft: spacing['20'],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
  };

  return (
    <section>
      <SectionHeader>{t('teamSettings.channel.title')}</SectionHeader>
      <Card variant="surface" padding={spacing['16']}>
        <div style={statusRow}>
          <div style={iconBox} aria-hidden>
            {channel?.bound ? (
              <IconCheckCircle size={24} color={colors.successDark} />
            ) : (
              <IconTelegram size={24} color={colors.iconFg} />
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={title}>
              {channelQ.isLoading
                ? t('common.loading')
                : channel?.bound
                  ? (channel.title ?? t('teamSettings.channel.boundNoTitle'))
                  : t('teamSettings.channel.notBound')}
            </div>
            <div style={hint}>
              {channel?.bound
                ? t('teamSettings.channel.boundHint')
                : t('teamSettings.channel.notBoundHint')}
            </div>
          </div>
        </div>

        {channel && !channel.bound ? (
          <>
            <ol style={steps}>
              <li>{t('teamSettings.channel.step1').replace('{bot}', botName)}</li>
              <li>{t('teamSettings.channel.step2').replace('{cmd}', connectCmd)}</li>
              <li>{t('teamSettings.channel.step3')}</li>
            </ol>
            <div style={{ ...hint, marginTop: spacing['12'] }}>
              {t('teamSettings.channel.channelNote').replace('{bot}', botName)}
            </div>
          </>
        ) : null}

        {channel?.bound ? (
          <div style={{ marginTop: spacing['16'] }}>
            <Button
              variant="dangerOutline"
              fullWidth
              onClick={() => void handleUnbind()}
              disabled={unbind.isPending}
            >
              {t('teamSettings.channel.unbind')}
            </Button>
          </div>
        ) : null}

        {error ? (
          <div style={{ fontSize: 13, color: colors.error, marginTop: spacing['8'] }}>{error}</div>
        ) : null}
      </Card>
    </section>
  );
}
