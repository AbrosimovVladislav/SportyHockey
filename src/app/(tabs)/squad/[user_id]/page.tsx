'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { Chip } from '@/components/chip';
import { ContentTabs } from '@/components/content-tabs';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { IconPhone, IconSend, IconChat, IconCheck, IconMore } from '@/components/icons';
import { PlayerOverviewTab } from './overview-tab';
import { useTeamMember, usePlayerOverview } from '@/hooks/use-team-member';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerPosition, TeamMember } from '@/types/api';

type TabId = 'overview' | 'finance' | 'stats';

export default function PlayerProfilePage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ user_id: string }>();
  const userId = params?.user_id ?? '';
  const { isOrganizer } = useIsOrganizer();
  const memberQ = useTeamMember(userId);
  const overviewQ = usePlayerOverview(userId);
  const [tab, setTab] = useState<TabId>('overview');
  const [menuOpen, setMenuOpen] = useState(false);
  useTgHeader('#FFFFFF');

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/squad');
  };

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const member = memberQ.data?.member;

  const menuButton =
    isOrganizer && member ? (
      <button
        type="button"
        className="pressable"
        aria-label={t('player.menu.title')}
        onClick={() => setMenuOpen(true)}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: colors.bgMuted,
          border: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <IconMore size={20} color={colors.text} />
      </button>
    ) : undefined;

  if (memberQ.isLoading) {
    return (
      <div style={root}>
        <LightHeader title={t('player.title')} onBack={onBack} />
        <StatusText text={t('common.loading')} color={colors.textSecondary} />
      </div>
    );
  }
  if (memberQ.error || !member) {
    return (
      <div style={root}>
        <LightHeader title={t('player.title')} onBack={onBack} />
        <StatusText text={t('common.error')} color={colors.error} />
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: t('player.tabs.overview') },
    { id: 'finance', label: t('player.tabs.finance') },
    { id: 'stats', label: t('player.tabs.stats') },
  ];

  return (
    <div style={root}>
      <LightHeader title={t('player.title')} onBack={onBack} right={menuButton} />

      <div style={content}>
        <HeaderCard member={member} t={t} />

        <ContentTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'overview' ? (
          overviewQ.data ? (
            <PlayerOverviewTab overview={overviewQ.data} t={t} />
          ) : (
            <StatusText text={t('common.loading')} color={colors.textSecondary} />
          )
        ) : (
          <SoonBlock text={t('player.soon')} />
        )}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={t('player.menu.title')}>
        <BottomSheetOption
          label={t('player.menu.edit')}
          onClick={() => {
            setMenuOpen(false);
            alert(t('player.soon'));
          }}
        />
        <BottomSheetOption
          label={t('player.menu.delete')}
          onClick={() => {
            setMenuOpen(false);
            alert(t('player.soon'));
          }}
        />
      </BottomSheet>
    </div>
  );
}

function HeaderCard({ member, t }: { member: TeamMember; t: (k: TKey) => string }) {
  const subtitleParts: string[] = [];
  if (member.jersey_number != null) subtitleParts.push(`#${member.jersey_number}`);
  const pos = positionLabel(t, member.position);
  if (pos) subtitleParts.push(pos);

  const phone = member.contact_phone;
  const username = member.username;
  const hasContacts = Boolean(phone || username);

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing['6'], marginTop: spacing['8'] }}>
            <Chip tone={member.tier === 'reserve' ? 'warning' : 'neutral'}>
              {member.tier === 'reserve' ? t('player.tier.reserve') : t('player.tier.main')}
            </Chip>
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

      {hasContacts ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing['12'],
            marginTop: spacing['16'],
            paddingTop: spacing['16'],
            borderTop: `1px solid ${colors.divider}`,
          }}
        >
          {phone ? (
            <a
              href={`tel:${phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: spacing['8'],
                color: colors.text,
                textDecoration: 'none',
                ...typography.body,
                minWidth: 0,
              }}
            >
              <IconPhone size={20} color={colors.iconFg} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{phone}</span>
            </a>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: spacing['8'], flexShrink: 0 }}>
            {username ? (
              <ContactIcon href={`https://t.me/${username}`} ariaLabel="Telegram">
                <IconSend size={18} color={colors.iconFg} />
              </ContactIcon>
            ) : null}
            {phone ? (
              <ContactIcon
                href={`https://wa.me/${phone.replace(/[^\d]/g, '')}`}
                ariaLabel="WhatsApp"
              >
                <IconChat size={18} color={colors.iconFg} />
              </ContactIcon>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ContactIcon({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="pressable"
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: colors.iconBg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </a>
  );
}

function SoonBlock({ text }: { text: string }) {
  return (
    <div style={{ padding: `${spacing['40']}px ${spacing['16']}px`, textAlign: 'center' }}>
      <span style={{ ...typography.body, color: colors.textSecondary }}>{text}</span>
    </div>
  );
}

function StatusText({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}

function positionLabel(t: (k: TKey) => string, pos: PlayerPosition | null): string | null {
  if (pos === 'forward') return t('squad.position.forward');
  if (pos === 'defender') return t('squad.position.defender');
  if (pos === 'goalie') return t('squad.position.goalie');
  return null;
}
