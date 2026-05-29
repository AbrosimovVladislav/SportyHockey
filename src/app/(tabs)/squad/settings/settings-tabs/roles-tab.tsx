'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { IconChevronRight, IconLink } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useTeamInvite } from '@/hooks/use-team-invite';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { TeamMember } from '@/types/api';
import { SectionHeader } from './section-header';

// Вкладка «Роли»: список игроков с ярлыками роли (тап → публичный профиль)
// и постоянная ссылка-приглашение с кнопкой «Копировать».

export function RolesTab() {
  const t = useT();
  const router = useRouter();
  const membersQ = useTeamMembers();
  const inviteQ = useTeamInvite();
  const [copied, setCopied] = useState(false);

  const members = membersQ.data?.members ?? [];

  function formatPositionLine(m: TeamMember): string {
    const parts: string[] = [];
    if (m.jersey_number != null) parts.push(`#${m.jersey_number}`);
    if (m.position === 'forward') parts.push('Нападающий');
    else if (m.position === 'defender') parts.push('Защитник');
    else if (m.position === 'goalie') parts.push('Вратарь');
    return parts.join(' • ');
  }

  function fullName(m: TeamMember): string {
    return [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || '—';
  }

  async function copyInvite() {
    const url = inviteQ.data?.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // в Telegram WebView copy чаще всего срабатывает; fallback не нужен
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['20'] }}>
      <section>
        <SectionHeader>{t('teamSettings.roles.section.players')}</SectionHeader>
        <Card variant="surface" padding={0}>
          {members.map((m, idx) => (
            <button
              type="button"
              key={m.user_id}
              className="pressable"
              onClick={() => router.push(`/squad/${m.user_id}`)}
              style={memberRow(idx === 0, idx === members.length - 1)}
            >
              <Avatar
                src={m.avatar_url ?? m.photo_url ?? null}
                name={fullName(m)}
                size={44}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={memberName}>{fullName(m)}</div>
                <div style={memberMeta}>{formatPositionLine(m)}</div>
              </div>
              <RolePill role={m.role} />
              <IconChevronRight />
            </button>
          ))}
        </Card>
      </section>

      <section>
        <SectionHeader>{t('teamSettings.roles.section.invite')}</SectionHeader>
        <Card variant="surface" padding={spacing['16']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
            <div style={iconBubble}>
              <IconLink size={20} color={colors.iconFg} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={inviteTitle}>{t('teamSettings.invite.link')}</div>
              <div style={inviteUrl}>
                {inviteQ.data?.url ?? t('teamSettings.invite.loading')}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="pressable"
            onClick={() => void copyInvite()}
            disabled={!inviteQ.data}
            style={primaryButton}
          >
            {copied ? t('teamSettings.invite.copied') : t('teamSettings.invite.copy')}
          </button>
        </Card>
      </section>
    </div>
  );
}

function RolePill({ role }: { role: 'organizer' | 'player' }) {
  const isOrg = role === 'organizer';
  const style: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    padding: `${spacing['4']}px ${spacing['12']}px`,
    borderRadius: radius.pill,
    background: isOrg ? colors.successBg : colors.bgMuted,
    color: isOrg ? colors.successText : colors.textSecondary,
    flexShrink: 0,
  };
  return <span style={style}>{isOrg ? 'Организатор' : 'Игрок'}</span>;
}

const memberRow = (isFirst: boolean, isLast: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: spacing['12'],
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderTop: isFirst ? 'none' : `1px solid ${colors.divider}`,
  padding: `${spacing['12']}px ${spacing['16']}px`,
  cursor: 'pointer',
  textAlign: 'left',
  color: colors.text,
  borderRadius: isFirst ? `${radius.lg}px ${radius.lg}px 0 0` : isLast ? `0 0 ${radius.lg}px ${radius.lg}px` : 0,
});

const memberName: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: colors.text,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const memberMeta: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: colors.textSecondary,
  marginTop: 2,
};

const iconBubble: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: radius.md,
  background: colors.iconBg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const inviteTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: colors.text,
};

const inviteUrl: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: colors.textSecondary,
  marginTop: 2,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const primaryButton: CSSProperties = {
  marginTop: spacing['16'],
  width: '100%',
  padding: `${spacing['12']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  border: 'none',
  background: colors.primary,
  color: colors.textInverse,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};
