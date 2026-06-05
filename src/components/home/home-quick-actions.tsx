'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconPlus,
  IconWallet,
  IconTrophy,
  IconUserCheck,
} from '@/components/icons';
import { useHomeActions } from '@/hooks/use-home-actions';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

// Quick-actions для organizer на главной (v0.6, итерация 63). Четыре плитки 2×2,
// каждая ведёт в реальное действие, которое organizer делает регулярно:
//
//   1. Создать событие             → /events/new
//   2. Отметить оплаты             → последнее прошедшее событие
//   3. Записать результат          → последняя прошедшая ИГРА (для голов/удалений)
//   4. Заявки (+badge с counter)   → /squad/requests
//
// Контекст (last_past_event_id, last_past_game_id, pending_requests_count)
// приходит из `useHomeActions`. Если цели нет — плитка disabled (тап ничего
// не делает), визуально приглушённая. «Создать событие» всегда активна.

export function HomeQuickActions() {
  const t = useT();
  const router = useRouter();
  const actionsQ = useHomeActions();

  const actions = actionsQ.data;
  const lastPastEventId = actions?.last_past_event_id ?? null;
  const lastPastGameId = actions?.last_past_game_id ?? null;
  const pendingRequests = actions?.pending_requests_count ?? 0;

  const grid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['10'],
  };

  return (
    <div style={grid}>
      <Tile
        icon={<IconPlus size={20} color={colors.iconFg} />}
        label={t('home.actions.organizer.createEvent')}
        onClick={() => router.push('/events/new')}
      />
      <Tile
        icon={<IconWallet size={20} color={colors.iconFg} />}
        label={t('home.actions.organizer.markPayments')}
        onClick={
          lastPastEventId ? () => router.push(`/events/${lastPastEventId}`) : undefined
        }
      />
      <Tile
        icon={<IconTrophy size={20} color={colors.iconFg} />}
        label={t('home.actions.organizer.recordResult')}
        onClick={
          lastPastGameId
            ? () => router.push(`/events/${lastPastGameId}/result`)
            : undefined
        }
      />
      <Tile
        icon={<IconUserCheck size={20} color={colors.iconFg} />}
        label={t('home.actions.organizer.requests')}
        badge={pendingRequests > 0 ? pendingRequests : null}
        onClick={() => router.push('/squad/requests')}
      />
    </div>
  );
}

type TileProps = {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number | null;
};

function Tile({ icon, label, onClick, badge }: TileProps) {
  const disabled = !onClick;
  const card: CSSProperties = {
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    borderRadius: radius.lg,
    padding: `${spacing['12']}px ${spacing['12']}px`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    minHeight: 64,
    width: '100%',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    textAlign: 'left',
    color: colors.text,
    position: 'relative',
  };
  const iconBox: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    border: `1.5px solid ${colors.iconFg}`,
    background: colors.bg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
  const labelStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.25,
    color: colors.text,
    flex: 1,
    minWidth: 0,
  };
  const badgeStyle: CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: 10,
    background: colors.error,
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };
  return (
    <button
      type="button"
      className={disabled ? undefined : 'pressable'}
      onClick={onClick}
      disabled={disabled}
      style={card}
    >
      <span style={iconBox} aria-hidden>
        {icon}
      </span>
      <span style={labelStyle}>{label}</span>
      {badge != null ? <span style={badgeStyle}>{badge}</span> : null}
    </button>
  );
}
