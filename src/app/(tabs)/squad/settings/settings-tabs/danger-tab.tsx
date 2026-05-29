'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/card';
import { BottomSheet } from '@/components/bottom-sheet';
import { IconLogout, IconArchive, IconAlertTriangle } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useLeaveTeam } from '@/hooks/use-leave-team';
import { useArchiveTeam } from '@/hooks/use-archive-team';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useMe } from '@/hooks/use-me';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { SectionHeader } from './section-header';

// Вкладка «Опасная зона»: два действия — «Покинуть команду» (только не последний
// организатор), «Архивировать команду». Карточка-блок с двумя ListRow внутри,
// плашка предупреждения снизу.

type Confirm = 'leave' | 'archive' | null;

export function DangerTab() {
  const t = useT();
  const router = useRouter();
  const me = useMe();
  const membersQ = useTeamMembers();
  const leave = useLeaveTeam();
  const archive = useArchiveTeam();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [error, setError] = useState<string | null>(null);

  const meId = me.data?.user.id ?? null;
  const organizers = (membersQ.data?.members ?? []).filter((m) => m.role === 'organizer');
  const isOnlyOrganizer =
    meId != null && organizers.length === 1 && organizers[0]?.user_id === meId;

  async function confirmLeave() {
    setError(null);
    try {
      await leave.mutateAsync();
      router.push('/');
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(String(e));
    }
  }

  async function confirmArchive() {
    setError(null);
    try {
      await archive.mutateAsync();
      router.push('/');
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(String(e));
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['16'] }}>
      <section>
        <SectionHeader>{t('teamSettings.danger.section')}</SectionHeader>
        <Card variant="surface" padding={0}>
          <DangerRow
            icon={<IconLogout size={22} color={colors.error} />}
            title={t('teamSettings.danger.leave.title')}
            subtitle={
              isOnlyOrganizer
                ? t('teamSettings.danger.leave.lastOrganizer')
                : t('teamSettings.danger.leave.subtitle')
            }
            disabled={isOnlyOrganizer}
            onClick={() => setConfirm('leave')}
            isFirst
          />
          <DangerRow
            icon={<IconArchive size={22} color={colors.error} />}
            title={t('teamSettings.danger.archive.title')}
            subtitle={t('teamSettings.danger.archive.subtitle')}
            onClick={() => setConfirm('archive')}
            isLast
          />
        </Card>
      </section>

      <div style={warningBox}>
        <IconAlertTriangle size={20} color={colors.error} />
        <span>{t('teamSettings.danger.note')}</span>
      </div>

      <BottomSheet
        open={confirm === 'leave'}
        onClose={() => setConfirm(null)}
        title={t('teamSettings.danger.leave.confirm.title')}
      >
        <p style={confirmBody}>{t('teamSettings.danger.leave.confirm.body')}</p>
        {error ? <div style={errorLine}>{error}</div> : null}
        <button
          type="button"
          className="pressable"
          onClick={() => void confirmLeave()}
          disabled={leave.isPending}
          style={destructiveButton}
        >
          {t('teamSettings.danger.leave.cta')}
        </button>
      </BottomSheet>

      <BottomSheet
        open={confirm === 'archive'}
        onClose={() => setConfirm(null)}
        title={t('teamSettings.danger.archive.confirm.title')}
      >
        <p style={confirmBody}>{t('teamSettings.danger.archive.confirm.body')}</p>
        {error ? <div style={errorLine}>{error}</div> : null}
        <button
          type="button"
          className="pressable"
          onClick={() => void confirmArchive()}
          disabled={archive.isPending}
          style={destructiveButton}
        >
          {t('teamSettings.danger.archive.cta')}
        </button>
      </BottomSheet>
    </div>
  );
}

type RowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

function DangerRow({ icon, title, subtitle, onClick, disabled, isFirst, isLast }: RowProps) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing['12'],
    padding: `${spacing['16']}px ${spacing['16']}px`,
    background: 'transparent',
    border: 'none',
    borderTop: isFirst ? 'none' : `1px solid ${colors.divider}`,
    borderRadius: isFirst
      ? `${radius.lg}px ${radius.lg}px 0 0`
      : isLast
        ? `0 0 ${radius.lg}px ${radius.lg}px`
        : 0,
    width: '100%',
    cursor: disabled ? 'default' : 'pointer',
    textAlign: 'left',
    opacity: disabled ? 0.6 : 1,
  };
  return (
    <button
      type="button"
      className="pressable"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={wrap}
    >
      <div style={iconBubbleError}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={titleStyle}>{title}</div>
        <div style={subtitleStyle}>{subtitle}</div>
      </div>
    </button>
  );
}

const iconBubbleError: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: radius.md,
  background: colors.errorBg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const titleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: colors.error,
};

const subtitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: colors.textSecondary,
  marginTop: 2,
  lineHeight: 1.4,
};

const warningBox: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing['12'],
  padding: `${spacing['12']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  background: colors.errorBg,
  color: colors.error,
  fontSize: 14,
  fontWeight: 600,
};

const confirmBody: CSSProperties = {
  margin: 0,
  marginBottom: spacing['12'],
  fontSize: 14,
  color: colors.textSecondary,
  lineHeight: 1.45,
};

const errorLine: CSSProperties = {
  marginBottom: spacing['12'],
  fontSize: 13,
  color: colors.error,
};

const destructiveButton: CSSProperties = {
  width: '100%',
  padding: `${spacing['12']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  border: 'none',
  background: colors.error,
  color: colors.textInverse,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};
