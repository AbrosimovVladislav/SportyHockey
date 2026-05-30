'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { IconPhone, IconTelegram, IconWhatsApp, IconCheck } from '@/components/icons';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerPosition, TeamMember } from '@/types/api';

export function HeaderCard({
  member,
  isOrganizer,
  t,
}: {
  member: TeamMember;
  isOrganizer: boolean;
  t: (k: TKey) => string;
}) {
  const subtitleParts: string[] = [];
  if (member.jersey_number != null) subtitleParts.push(`#${member.jersey_number}`);
  const pos = positionLabel(t, member.position);
  if (pos) subtitleParts.push(pos);

  const phone = member.contact_phone;
  const username = member.username;
  // WhatsApp: явное поле приоритетнее; если игрок WhatsApp отдельно не указал,
  // фоллбэчим на телефон (у большинства WhatsApp на том же номере).
  const waSource = member.contact_whatsapp ?? phone;
  const waDigits = waSource ? waSource.replace(/[^\d]/g, '') : '';

  return (
    <Card variant="surface">
      <div style={{ display: 'flex', gap: spacing['16'], alignItems: 'center' }}>
        <Avatar src={member.avatar_url ?? member.photo_url} name={formatName(member)} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...typography.h2, color: colors.text }}>{formatName(member)}</div>
          {subtitleParts.length > 0 ? (
            <div style={{ ...typography.sm, color: colors.textSecondary, marginTop: spacing['2'] }}>
              {subtitleParts.join(' · ')}
            </div>
          ) : null}
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['6'], marginTop: spacing['8'] }}
          >
            {isOrganizer ? (
              <Chip tone={member.tier === 'reserve' ? 'warning' : 'neutral'}>
                {member.tier === 'reserve' ? t('player.tier.reserve') : t('player.tier.main')}
              </Chip>
            ) : null}
            {member.is_placeholder ? (
              <Chip tone="warning">{t('player.account.no')}</Chip>
            ) : (
              <Chip tone="success">
                <IconCheck size={13} color={colors.successText} />
                {t('player.account.yes')}
              </Chip>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['12'],
          marginTop: spacing['16'],
          paddingTop: spacing['16'],
          borderTop: `1px solid ${colors.divider}`,
        }}
      >
        {phone ? (
          <a href={`tel:${phone}`} style={phoneLink}>
            <IconPhone size={20} color={colors.iconFg} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{phone}</span>
          </a>
        ) : (
          <span style={{ ...phoneLink, color: colors.textTertiary }}>
            <IconPhone size={20} color={colors.iconMuted} />
            <span>{t('player.contact.none')}</span>
          </span>
        )}

        <ContactDivider />
        <ContactCircle
          available={Boolean(username)}
          href={username ? `https://t.me/${username}` : undefined}
          ariaLabel="Telegram"
        >
          <IconTelegram size={18} color={username ? colors.success : colors.error} />
        </ContactCircle>

        <ContactDivider />
        <ContactCircle
          available={Boolean(waSource)}
          href={waSource ? `https://wa.me/${waDigits}` : undefined}
          ariaLabel="WhatsApp"
        >
          <IconWhatsApp size={18} color={waSource ? colors.success : colors.error} />
        </ContactCircle>
      </div>
    </Card>
  );
}

const phoneLink: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing['8'],
  color: colors.text,
  textDecoration: 'none',
  ...typography.body,
};

function ContactDivider() {
  return <span style={{ width: 1, height: 28, background: colors.divider, flexShrink: 0 }} />;
}

function ContactCircle({
  available,
  href,
  ariaLabel,
  children,
}: {
  available: boolean;
  href?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: available ? colors.successBg : colors.errorBg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  if (available && href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        className="pressable"
        style={style}
      >
        {children}
      </a>
    );
  }
  return (
    <span aria-label={ariaLabel} aria-disabled style={style}>
      {children}
    </span>
  );
}

function positionLabel(t: (k: TKey) => string, pos: PlayerPosition | null): string | null {
  if (pos === 'forward') return t('squad.position.forward');
  if (pos === 'defender') return t('squad.position.defender');
  if (pos === 'goalie') return t('squad.position.goalie');
  return null;
}
