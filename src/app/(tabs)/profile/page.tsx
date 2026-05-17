'use client';

import { useState } from 'react';
import { Screen } from '@/components/screen';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { Button } from '@/components/button';
import { useT } from '@/hooks/use-t';
import { useMe } from '@/hooks/use-me';
import { formatName } from '@/lib/format-name';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

export default function ProfilePage() {
  const t = useT();
  const me = useMe();
  const [copied, setCopied] = useState(false);

  if (me.isLoading) {
    return (
      <Screen title={t('profile.title')}>
        <span style={{ ...typography.body, color: colors.textSecondary }}>
          {t('common.loading')}
        </span>
      </Screen>
    );
  }
  if (me.error || !me.data) {
    return (
      <Screen title={t('profile.title')}>
        <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>
      </Screen>
    );
  }

  const { user, memberships, invite_link } = me.data;
  const membership = memberships[0];
  const roleLabel = membership
    ? membership.role === 'organizer'
      ? t('profile.role.organizer')
      : t('profile.role.player')
    : null;

  const handleCopy = async () => {
    if (!invite_link) return;
    try {
      await navigator.clipboard.writeText(invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // буфер может быть недоступен — игнорируем
    }
  };

  return (
    <Screen title={t('profile.title')}>
      <Card variant="warm">
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
          <Avatar src={user.photo_url} name={formatName(user)} size={56} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...typography.bodyBold, color: colors.text }}>{formatName(user)}</span>
            {user.username ? (
              <span style={{ ...typography.sm, color: colors.textSecondary }}>@{user.username}</span>
            ) : null}
          </div>
          {membership && roleLabel ? (
            <Chip tone={membership.role === 'organizer' ? 'primary' : 'neutral'}>{roleLabel}</Chip>
          ) : null}
        </div>
      </Card>

      {membership ? (
        <Card variant="warm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ ...typography.caption, color: colors.textSecondary }}>
              {t('profile.team')}
            </span>
            <span style={{ ...typography.bodyBold, color: colors.text }}>
              {membership.team_name}
            </span>
          </div>
        </Card>
      ) : null}

      {invite_link ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <Button fullWidth onClick={handleCopy}>
            {copied ? t('profile.copied') : t('profile.copyInvite')}
          </Button>
          <span style={{ ...typography.sm, color: colors.textSecondary }}>
            {t('profile.copyInviteHint')}
          </span>
        </div>
      ) : null}
    </Screen>
  );
}
