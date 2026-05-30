'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/avatar';
import { LightHeader } from '@/components/light-header';
import { ListRow } from '@/components/list-row';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconStats,
  IconWallet,
  IconUserCheck,
  IconHeadphones,
  IconFileText,
  IconPhone,
  IconAtSign,
  IconWhatsApp,
  IconSettings,
  IconCheck,
} from '@/components/icons';
import { useMe } from '@/hooks/use-me';
import { useUpdateMe } from '@/hooks/use-update-me';
import { useMyInvites } from '@/hooks/use-my-invites';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useActiveTeamStore } from '@/store/active-team';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatName } from '@/lib/format-name';
import type { MeMembership } from '@/types/api';

type ContactField = 'phone' | 'whatsapp' | 'username';

export default function ProfilePage() {
  const t = useT();
  const router = useRouter();
  const me = useMe();
  const qc = useQueryClient();
  const activeTeamId = useActiveTeamStore((s) => s.activeTeamId);
  const setActiveTeamId = useActiveTeamStore((s) => s.setActiveTeamId);
  useTgHeader(colors.bg);

  const invitesQ = useMyInvites(!!me.data);
  const pendingInvitesCount = (invitesQ.data?.items ?? []).filter(
    (i) => i.kind === 'invite' && i.status === 'pending',
  ).length;

  const [teamSheet, setTeamSheet] = useState(false);
  const [editing, setEditing] = useState<ContactField | null>(null);

  const memberships = me.data?.memberships ?? [];
  const activeMembership = useMemo<MeMembership | undefined>(() => {
    if (memberships.length === 0) return undefined;
    if (activeTeamId) {
      const found = memberships.find((m) => m.team_id === activeTeamId);
      if (found) return found;
    }
    return memberships[0];
  }, [memberships, activeTeamId]);

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const editButton = (
    <button
      type="button"
      className="pressable"
      aria-label={t('myProfile.editAria')}
      onClick={() => router.push('/profile/edit')}
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: colors.bgMuted,
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <IconSettings size={20} color={colors.text} />
    </button>
  );

  if (me.isLoading) {
    return (
      <div style={root}>
        <LightHeader title={t('myProfile.title')} />
        <div style={{ ...content, justifyContent: 'center' }}>
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }
  if (me.error || !me.data) {
    return (
      <div style={root}>
        <LightHeader title={t('myProfile.title')} />
        <div style={{ ...content, justifyContent: 'center' }}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('common.error')}
          </span>
        </div>
      </div>
    );
  }

  const { user } = me.data;
  const fullName = formatName(user);
  const roleLabel = activeMembership
    ? activeMembership.role === 'organizer'
      ? t('profile.role.organizer')
      : t('profile.role.player')
    : null;

  const handleSwitchTeam = async (teamId: string) => {
    setTeamSheet(false);
    if (activeMembership?.team_id === teamId) return;
    setActiveTeamId(teamId);
    await qc.invalidateQueries();
  };

  return (
    <div style={root}>
      <LightHeader title={t('myProfile.title')} right={editButton} />

      <div style={content}>
        {/* Шапка с аватаром, ФИО и pill роли. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
          <Avatar src={user.avatar_url ?? user.photo_url} name={fullName} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...typography.h2, color: colors.text }}>{fullName}</div>
            {roleLabel ? (
              <div
                style={{
                  marginTop: spacing['6'],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing['8'],
                  flexWrap: 'wrap',
                }}
              >
                <span style={pillStyle(activeMembership!.role === 'organizer')}>{roleLabel}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Карточка контактов: три типа — Telegram, телефон, WhatsApp.
            Источник один — users; в публичном профиле и здесь видна одна
            и та же запись. */}
        <div style={cardStyle}>
          <ContactRow
            icon={<IconAtSign size={20} color={colors.iconFg} />}
            value={user.username ? `@${user.username}` : null}
            placeholder={t('myProfile.contacts.usernamePlaceholder')}
            onTap={() => setEditing('username')}
          />
          <Divider />
          <ContactRow
            icon={<IconPhone size={20} color={colors.iconFg} />}
            value={user.contact_phone}
            placeholder={t('myProfile.contacts.phonePlaceholder')}
            onTap={() => setEditing('phone')}
          />
          <Divider />
          <ContactRow
            icon={<IconWhatsApp size={20} color={colors.iconFg} />}
            value={user.contact_whatsapp}
            placeholder={t('myProfile.contacts.whatsappPlaceholder')}
            onTap={() => setEditing('whatsapp')}
          />
          <div
            style={{
              ...typography.sm,
              color: colors.textSecondary,
              padding: `${spacing['8']}px ${spacing['16']}px 0`,
            }}
          >
            {t('myProfile.contacts.visibilityHint')}
          </div>
        </div>

        {/* Селектор активной команды. */}
        {memberships.length === 0 ? (
          <div style={emptyTeamCard}>
            <span style={{ ...typography.body, color: colors.textSecondary }}>
              {t('myProfile.team.empty')}
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="pressable"
            onClick={() => memberships.length > 1 && setTeamSheet(true)}
            style={{
              ...cardStyle,
              display: 'flex',
              alignItems: 'center',
              gap: spacing['12'],
              padding: spacing['16'],
              cursor: memberships.length > 1 ? 'pointer' : 'default',
              border: 'none',
              width: '100%',
              textAlign: 'left',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...typography.caption, color: colors.textSecondary }}>
                {t('myProfile.team.active')}
              </div>
              <div
                style={{
                  ...typography.bodyBold,
                  color: colors.text,
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeMembership!.team_name}
              </div>
              <div style={{ ...typography.sm, color: colors.textSecondary, marginTop: 2 }}>
                {activeMembership!.role === 'organizer'
                  ? t('profile.role.organizer')
                  : t('profile.role.player')}
              </div>
            </div>
            {memberships.length > 1 ? (
              <span style={{ ...typography.sm, color: colors.primary }}>
                {t('myProfile.team.change')}
              </span>
            ) : null}
          </button>
        )}

        {/* Разделы. Поддержка и политика — замьючены (как тактика в /squad). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
          <ListRow
            icon={<IconStats size={20} color={colors.iconFg} />}
            title={t('myProfile.section.stats.title')}
            subtitle={t('myProfile.section.stats.subtitle')}
            onClick={() => router.push('/profile/stats')}
          />
          <ListRow
            icon={<IconWallet size={20} color={colors.iconFg} />}
            title={t('myProfile.section.finance.title')}
            subtitle={t('myProfile.section.finance.subtitle')}
            onClick={() => router.push('/profile/finance')}
          />
          <ListRow
            icon={<IconUserCheck size={20} color={colors.iconFg} />}
            title={t('myProfile.section.invites.title')}
            subtitle={t('myProfile.section.invites.subtitle')}
            onClick={() => router.push('/profile/invites')}
            right={
              pendingInvitesCount > 0 ? (
                <span style={pendingBadgeStyle}>{pendingInvitesCount}</span>
              ) : undefined
            }
          />
          <ListRow
            icon={<IconHeadphones size={20} color={colors.iconFg} />}
            title={t('myProfile.section.support.title')}
            subtitle={t('myProfile.section.support.subtitle')}
            muted
          />
          <ListRow
            icon={<IconFileText size={20} color={colors.iconFg} />}
            title={t('myProfile.section.privacy.title')}
            subtitle={t('myProfile.section.privacy.subtitle')}
            muted
          />
        </div>
      </div>

      <TeamPickerSheet
        open={teamSheet}
        onClose={() => setTeamSheet(false)}
        memberships={memberships}
        activeTeamId={activeMembership?.team_id ?? null}
        onSelect={handleSwitchTeam}
        title={t('myProfile.team.pickerTitle')}
        organizerLabel={t('profile.role.organizer')}
        playerLabel={t('profile.role.player')}
      />

      {editing ? (
        <ContactEditor
          field={editing}
          initialValue={initialContactValue(
            editing,
            user.contact_phone,
            user.contact_whatsapp,
            user.username,
          )}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function initialContactValue(
  field: ContactField,
  phone: string | null,
  whatsapp: string | null,
  username: string | null,
): string {
  if (field === 'phone') return phone ?? '';
  if (field === 'whatsapp') return whatsapp ?? '';
  return username ?? '';
}

function pillStyle(primary: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing['4']}px ${spacing['10']}px`,
    borderRadius: radius.pill,
    background: primary ? colors.primaryLight : colors.bgMuted,
    color: primary ? colors.primary : colors.textSecondary,
    fontSize: 12,
    fontWeight: 700,
  };
}

const pendingBadgeStyle: CSSProperties = {
  minWidth: 22,
  height: 22,
  padding: `0 ${spacing['8']}px`,
  borderRadius: radius.pill,
  background: colors.primary,
  color: colors.textInverse,
  fontSize: 12,
  fontWeight: 800,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardStyle: CSSProperties = {
  background: colors.bg,
  borderRadius: radius.lg,
  padding: spacing['16'],
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
};

const emptyTeamCard: CSSProperties = {
  ...cardStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing['24']}px ${spacing['16']}px`,
};

function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: colors.line,
        margin: `${spacing['12']}px -${spacing['16']}px`,
      }}
    />
  );
}

function ContactRow({
  icon,
  value,
  placeholder,
  onTap,
}: {
  icon: React.ReactNode;
  value: string | null;
  placeholder: string;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      className="pressable"
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing['12'],
        background: 'none',
        border: 'none',
        padding: 0,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'inline-flex' }}>{icon}</span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          ...typography.body,
          color: value ? colors.text : colors.textSecondary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value ?? placeholder}
      </span>
    </button>
  );
}

function ContactEditor({
  field,
  initialValue,
  onClose,
}: {
  field: ContactField;
  initialValue: string;
  onClose: () => void;
}) {
  const t = useT();
  const update = useUpdateMe();
  const [value, setValue] = useState(initialValue);

  const fieldLabel =
    field === 'phone'
      ? t('myProfile.contacts.phoneTitle')
      : field === 'whatsapp'
        ? t('myProfile.contacts.whatsappTitle')
        : t('myProfile.contacts.usernameTitle');

  const placeholder =
    field === 'phone'
      ? t('myProfile.contacts.phonePlaceholder')
      : field === 'whatsapp'
        ? t('myProfile.contacts.whatsappPlaceholder')
        : t('myProfile.contacts.usernamePlaceholder');

  const onSave = () => {
    const trimmed = value.trim();
    const payload =
      field === 'phone'
        ? { contact_phone: trimmed || null }
        : field === 'whatsapp'
          ? { contact_whatsapp: trimmed || null }
          : { username: trimmed || null };
    update.mutate(
      { body: payload },
      {
        onSuccess: onClose,
      },
    );
  };

  return (
    <BottomSheet open onClose={onClose} title={fieldLabel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          inputMode={field === 'phone' || field === 'whatsapp' ? 'tel' : 'text'}
          autoFocus
        />
        {update.error ? (
          <div style={{ ...typography.sm, color: colors.error }}>{update.error.message}</div>
        ) : null}
        <Button size="lg" fullWidth disabled={update.isPending} onClick={onSave}>
          {t('common.save')}
        </Button>
      </div>
    </BottomSheet>
  );
}

function TeamPickerSheet({
  open,
  onClose,
  memberships,
  activeTeamId,
  onSelect,
  title,
  organizerLabel,
  playerLabel,
}: {
  open: boolean;
  onClose: () => void;
  memberships: MeMembership[];
  activeTeamId: string | null;
  onSelect: (teamId: string) => void;
  title: string;
  organizerLabel: string;
  playerLabel: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        {memberships.map((m) => {
          const active = m.team_id === activeTeamId;
          return (
            <button
              key={m.team_id}
              type="button"
              className="pressable"
              onClick={() => onSelect(m.team_id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing['12'],
                padding: spacing['12'],
                background: colors.bg,
                borderRadius: radius.md,
                border: `1.5px solid ${active ? colors.primary : 'transparent'}`,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: active ? colors.primary : colors.bgMuted,
                  color: active ? colors.textInverse : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {active ? <IconCheck size={14} color={colors.textInverse} /> : null}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    ...typography.bodyBold,
                    color: colors.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.team_name}
                </div>
                <div style={{ ...typography.sm, color: colors.textSecondary }}>
                  {m.role === 'organizer' ? organizerLabel : playerLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
