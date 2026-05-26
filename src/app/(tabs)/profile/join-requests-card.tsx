'use client';

import type { CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { useJoinRequests, useDecideJoinRequest } from '@/hooks/use-join-requests';
import { useT } from '@/hooks/use-t';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { colors } from '@/theme/colors';
import type { JoinRequestItem } from '@/types/api';

// Приём заявок на вступление организатором. Появляется, когда есть pending-заявки.
export function JoinRequestsCard({ enabled }: { enabled: boolean }) {
  const t = useT();
  const q = useJoinRequests(enabled);
  const decide = useDecideJoinRequest();
  const requests = q.data?.requests ?? [];

  if (!enabled || requests.length === 0) return null;

  const wrap: CSSProperties = {
    background: colors.bgWarm,
    borderRadius: radius.lg,
    padding: spacing['16'],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  return (
    <div style={wrap}>
      <span style={{ ...typography.caption, color: colors.textSecondary }}>
        {t('profile.requests.title')}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        {requests.map((r) => (
          <RequestRow key={r.id} item={r} pending={decide.isPending} onDecide={decide.mutate} t={t} />
        ))}
      </div>
    </div>
  );
}

function fullName(r: JoinRequestItem): string {
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (r.username) return `@${r.username}`;
  return 'Игрок';
}

function RequestRow({
  item,
  pending,
  onDecide,
  t,
}: {
  item: JoinRequestItem;
  pending: boolean;
  onDecide: (vars: { id: string; action: 'approve' | 'reject' }) => void;
  t: (k: 'profile.requests.approve' | 'profile.requests.reject') => string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing['8'],
        padding: spacing['12'],
        background: colors.bg,
        borderRadius: radius.md,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
        <Avatar src={item.avatar_url ?? item.photo_url} name={fullName(item)} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...typography.bodyBold, color: colors.text }}>{fullName(item)}</div>
          {item.username ? (
            <div style={{ ...typography.sm, color: colors.textSecondary }}>@{item.username}</div>
          ) : null}
        </div>
      </div>
      <div style={{ display: 'flex', gap: spacing['8'] }}>
        <Button
          size="md"
          fullWidth
          disabled={pending}
          onClick={() => onDecide({ id: item.id, action: 'approve' })}
        >
          {t('profile.requests.approve')}
        </Button>
        <Button
          variant="secondary"
          size="md"
          fullWidth
          disabled={pending}
          onClick={() => onDecide({ id: item.id, action: 'reject' })}
        >
          {t('profile.requests.reject')}
        </Button>
      </div>
    </div>
  );
}
