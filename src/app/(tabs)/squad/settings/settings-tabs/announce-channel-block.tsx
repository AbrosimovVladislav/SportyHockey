'use client';

import { useState, type CSSProperties } from 'react';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { IconCheckCircle, IconTelegram } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import {
  useBindTeamChannel,
  useTeamChannel,
  useUnbindTeamChannel,
} from '@/hooks/use-team-channel';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { SectionHeader } from './section-header';

// Блок «Группа команды в Telegram» на вкладке «Общее» (итерации 70–71). У каждой команды
// своя группа, в неё бот публикует анонсы. Публичную группу организатор вписывает сюда
// по @нику; закрытая (ника нет) привязывается сама, когда бота в неё добавляют.

export function AnnounceChannelBlock() {
  const t = useT();
  const channelQ = useTeamChannel();
  const bind = useBindTeamChannel();
  const unbind = useUnbindTeamChannel();
  const [nick, setNick] = useState('');
  const [error, setError] = useState<string | null>(null);

  const channel = channelQ.data;
  const botName = channel?.bot_username
    ? `@${channel.bot_username}`
    : t('teamSettings.channel.botFallback');

  async function handleBind() {
    if (!nick.trim() || bind.isPending) return;
    setError(null);
    try {
      await bind.mutateAsync({ username: nick.trim() });
      setNick('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('teamSettings.channel.bindError'));
    }
  }

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
  const bindRow: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: spacing['8'],
    marginTop: spacing['16'],
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
            <div style={bindRow}>
              <Input
                type="text"
                value={nick}
                onChange={(e) => setNick(e.currentTarget.value)}
                placeholder={t('teamSettings.channel.nickPlaceholder')}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={100}
                aria-label={t('teamSettings.channel.nickPlaceholder')}
              />
              <Button onClick={() => void handleBind()} disabled={!nick.trim() || bind.isPending}>
                {bind.isPending ? t('teamSettings.channel.binding') : t('teamSettings.channel.bind')}
              </Button>
            </div>
            <div style={{ ...hint, marginTop: spacing['12'] }}>
              {t('teamSettings.channel.note').replace('{bot}', botName)}
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
