'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { FilterChips } from '@/components/filter-chips';
import { Avatar } from '@/components/avatar';
import { Skeleton } from '@/components/skeleton';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { IconChevronRight } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useMe } from '@/hooks/use-me';
import { usePlayersBalance } from '@/hooks/use-players-balance';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatSignedMoney, formatMoney } from '@/lib/format-money';
import type { PlayerBalanceItem, PlayerBalanceStatus } from '@/types/api';

// Балансы всех игроков активной команды на «сегодня». Источник — `computeTeamBalance`.
// Знак `balance` здесь со стороны игрока: + = депозит у команды, − = долг.
// По тапу — переход в публичный профиль игрока (`/squad/<user_id>`), где у
// организатора уже есть вкладка «Финансы» с детализацией.
//
// Фильтр — три чипа (Все / Должники / С депозитом). «Закрытые» и «Неактивные»
// видны только в «Все»; отдельных чипов под них нет по решению пользователя.
type FilterId = 'all' | 'debtor' | 'overpaid';

export default function MoneyPlayersPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader(colors.bg);
  const me = useMe();
  const hasTeam = (me.data?.memberships.length ?? 0) > 0;

  const [filter, setFilter] = useState<FilterId>('all');

  const list = usePlayersBalance(hasTeam);

  const visible = useMemo<PlayerBalanceItem[]>(() => {
    const items = list.data?.items ?? [];
    if (filter === 'debtor') return items.filter((p) => p.status === 'debtor');
    if (filter === 'overpaid') return items.filter((p) => p.status === 'overpaid');
    return items;
  }, [list.data, filter]);

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bgOffWhite };
  const sticky: CSSProperties = {
    position: 'sticky',
    top: 56,
    zIndex: 4,
    background: colors.bg,
    borderBottom: `1px solid ${colors.line}`,
  };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['8'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const chipLabels = useMemo(
    () => ({
      all: t('money.players.tab.all'),
      debtor: t('money.players.tab.debtors'),
      overpaid: t('money.players.tab.overpaid'),
      statusDebtor: t('money.players.status.debtor'),
      statusOverpaid: t('money.players.status.overpaid'),
      statusClosed: t('money.players.status.closed'),
      statusInactive: t('money.players.status.inactive'),
    }),
    [t],
  );

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/money');
  };

  return (
    <div style={root}>
      <LightHeader title={t('money.players.title')} onBack={onBack} />

      <div style={sticky}>
        <FilterChips
          options={[
            { id: 'all', label: chipLabels.all },
            { id: 'debtor', label: chipLabels.debtor },
            { id: 'overpaid', label: chipLabels.overpaid },
          ]}
          activeId={filter}
          onChange={(id) => setFilter(id as FilterId)}
          compact
        />
      </div>

      <div style={content}>
        {!hasTeam && me.isSuccess ? (
          <EmptyBlock
            title={t('money.empty.noTeam.title')}
            body={t('money.empty.noTeam.body')}
          />
        ) : list.isLoading || list.isPending ? (
          <ListSkeleton />
        ) : list.isError || !list.data ? (
          <ErrorCard text={t('common.error')} />
        ) : visible.length === 0 ? (
          <EmptyBlock
            title={
              filter === 'all'
                ? t('money.players.empty.all')
                : filter === 'debtor'
                  ? t('money.players.empty.debtors')
                  : t('money.players.empty.overpaid')
            }
          />
        ) : (
          visible.map((p) => (
            <PlayerRow
              key={p.user_id}
              player={p}
              statusLabel={statusLabelFor(p.status, chipLabels)}
              onClick={() => router.push(`/squad/${p.user_id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Строка одного игрока
// ─────────────────────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  statusLabel,
  onClick,
}: {
  player: PlayerBalanceItem;
  statusLabel: string;
  onClick: () => void;
}) {
  // Цвет суммы: зелёный для депозита, красный для долга, нейтральный для нуля.
  const amountColor =
    player.balance > 0
      ? colors.successDark
      : player.balance < 0
        ? colors.errorDark
        : colors.textSecondary;

  const wrap: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['12']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
  };
  const middle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
  const name: CSSProperties = {
    ...typography.bodyBold,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const sub: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  const amount: CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    color: amountColor,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.01em',
    flexShrink: 0,
  };

  const fullName = [player.first_name, player.last_name].filter(Boolean).join(' ').trim();
  const avatarSrc = player.avatar_url ?? player.photo_url;
  // formatSignedMoney всегда печатает знак, в т.ч. для 0 (как «0 ₽»). Для
  // «закрытых» хотим без знака — используем formatMoney.
  const amountText =
    player.balance === 0 ? formatMoney(0) : formatSignedMoney(player.balance);

  return (
    <button type="button" className="pressable" onClick={onClick} style={wrap}>
      <Avatar src={avatarSrc} name={fullName} size={44} />
      <div style={middle}>
        <span style={name}>{fullName || '—'}</span>
        <span style={sub}>{statusLabel}</span>
      </div>
      <span style={amount}>{amountText}</span>
      <IconChevronRight size={14} color={colors.textTertiary} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Скелетоны / пустые состояния
// ─────────────────────────────────────────────────────────────────────────────

function ListSkeleton() {
  const row: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: spacing['16'],
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={row} aria-hidden>
          <Skeleton width={44} height={44} borderRadius={22} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={12} />
          </div>
          <Skeleton width={70} height={14} />
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ text }: { text: string }) {
  return (
    <div
      style={{
        background: colors.errorBg,
        color: colors.errorText,
        borderRadius: radius.lg,
        padding: spacing['16'],
        textAlign: 'center',
        ...typography.sm,
      }}
    >
      {text}
    </div>
  );
}

function EmptyBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div
      style={{
        background: colors.bgWarm,
        borderRadius: radius.lg,
        padding: `${spacing['32']}px ${spacing['16']}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing['8'],
        textAlign: 'center',
      }}
    >
      <span style={{ ...typography.bodyBold, color: colors.text }}>{title}</span>
      {body ? (
        <span style={{ ...typography.sm, color: colors.textSecondary, maxWidth: 280 }}>{body}</span>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Подпись статуса под именем
// ─────────────────────────────────────────────────────────────────────────────

function statusLabelFor(
  status: PlayerBalanceStatus,
  labels: { statusDebtor: string; statusOverpaid: string; statusClosed: string; statusInactive: string },
): string {
  switch (status) {
    case 'debtor': return labels.statusDebtor;
    case 'overpaid': return labels.statusOverpaid;
    case 'closed': return labels.statusClosed;
    case 'inactive': return labels.statusInactive;
  }
}
