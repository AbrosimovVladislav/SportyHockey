'use client';

import { useState, type CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { IconChevronDown } from '@/components/icons';
import { useDecideJoinRequest } from '@/hooks/use-join-requests';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { JoinRequestItem } from '@/types/api';

// Карточка одной заявки на экране /squad/requests.
// Для pending — аккордеон с кнопками «Принять / Отклонить»; для
// approved/rejected — статичная карточка с цветным чипом и subtitle.
export function RequestCard({ item }: { item: JoinRequestItem }) {
  const t = useT();
  const decide = useDecideJoinRequest();
  const [open, setOpen] = useState(false);

  const pending = item.status === 'pending';
  const fullName = composeName(item);

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: spacing['16'],
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  };

  return (
    <div style={wrap}>
      <button
        type="button"
        className={pending ? 'pressable' : undefined}
        onClick={pending ? () => setOpen((v) => !v) : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['12'],
          background: 'none',
          border: 'none',
          padding: 0,
          width: '100%',
          textAlign: 'left',
          cursor: pending ? 'pointer' : 'default',
        }}
      >
        <Avatar src={item.avatar_url ?? item.photo_url} name={fullName} size={48} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...typography.bodyBold, color: colors.text }}>{fullName}</div>
          {item.username ? (
            <div style={{ ...typography.sm, color: colors.textSecondary }}>@{item.username}</div>
          ) : null}
          <div style={{ marginTop: spacing['8'] }}>
            <TypeBadge label={t('requests.type.incoming')} />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: spacing['8'],
            flexShrink: 0,
          }}
        >
          <StatusChip status={item.status} t={t} />
          {pending ? (
            <span
              style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
                display: 'inline-flex',
              }}
            >
              <IconChevronDown size={14} color={colors.textSecondary} />
            </span>
          ) : null}
        </div>
      </button>

      {pending && open ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
          <div style={{ height: 1, background: colors.line }} />
          <div style={{ ...typography.sm, color: colors.text }}>{t('requests.want.join')}</div>
          <div style={{ display: 'flex', gap: spacing['8'] }}>
            <Button
              size="lg"
              fullWidth
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: item.id, action: 'approve' })}
            >
              {t('requests.accept')}
            </Button>
            <Button
              variant="dangerOutline"
              size="lg"
              fullWidth
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: item.id, action: 'reject' })}
            >
              {t('requests.reject')}
            </Button>
          </div>
        </div>
      ) : null}

      {!pending ? (
        <div style={{ ...typography.sm, color: colors.textSecondary }}>
          {item.status === 'approved'
            ? t('requests.subtitle.approved')
            : t('requests.subtitle.rejected')}
        </div>
      ) : null}
    </div>
  );
}

function composeName(r: JoinRequestItem): string {
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (r.username) return `@${r.username}`;
  return 'Игрок';
}

function TypeBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${spacing['4']}px ${spacing['8']}px`,
        borderRadius: radius.pill,
        background: colors.primaryLight,
        color: colors.primary,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </span>
  );
}

function StatusChip({
  status,
  t,
}: {
  status: JoinRequestItem['status'];
  t: (k: 'requests.status.pending' | 'requests.status.approved' | 'requests.status.rejected') => string;
}) {
  const palette =
    status === 'pending'
      ? { bg: colors.warningBg, fg: colors.warningText }
      : status === 'approved'
        ? { bg: colors.successBg, fg: colors.successText }
        : { bg: colors.errorBg, fg: colors.errorText };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${spacing['4']}px ${spacing['10']}px`,
        borderRadius: radius.pill,
        background: palette.bg,
        color: palette.fg,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {t(`requests.status.${status}` as
        | 'requests.status.pending'
        | 'requests.status.approved'
        | 'requests.status.rejected')}
    </span>
  );
}
