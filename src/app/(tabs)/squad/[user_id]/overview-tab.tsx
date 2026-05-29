'use client';

import { useState, type CSSProperties } from 'react';
import { Card } from '@/components/card';
import { BottomSheet } from '@/components/bottom-sheet';
import {
  IconAttendance,
  IconFinance,
  IconChart,
  IconCheck,
  IconClose,
  IconChevronRight,
  IconShieldCheck,
} from '@/components/icons';
import { useUpdateMember } from '@/hooks/use-update-member';
import { ApiError } from '@/lib/api-client';
import { CardHead, StatCells, bigValue, caption } from './profile-cards';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { AttendanceStatus, MemberRole, PlayerOverview } from '@/types/api';

type TabId = 'finance' | 'stats';
type Props = {
  overview: PlayerOverview;
  isOrganizer: boolean;
  onOpenTab: (tab: TabId) => void;
  t: (k: TKey) => string;
  // Параметры для кнопки смены роли (итерация 41). Если userId не передан —
  // кнопка не рендерится (сохраняет старый контракт).
  userId?: string;
  targetRole?: MemberRole;
  isSelf?: boolean;
};

function formatRub(n: number): string {
  return Math.abs(n).toLocaleString('ru-RU');
}

export function PlayerOverviewTab({
  overview,
  isOrganizer,
  onOpenTab,
  t,
  userId,
  targetRole,
  isSelf,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
      {/* Финансы чужого игрока — только организатору. */}
      {isOrganizer ? (
        <FinanceCard balance={overview.finance.balance} onOpen={() => onOpenTab('finance')} t={t} />
      ) : null}
      <AttendanceCard attendance={overview.attendance} t={t} />
      <StatsCard stats={overview.stats} onOpen={() => onOpenTab('stats')} t={t} />
      {/* Смена роли организатор/игрок (итерация 41) — только организатору, не на своём профиле. */}
      {isOrganizer && !isSelf && userId && targetRole ? (
        <RoleSwitchCard userId={userId} role={targetRole} t={t} />
      ) : null}
    </div>
  );
}

function RoleSwitchCard({
  userId,
  role,
  t,
}: {
  userId: string;
  role: MemberRole;
  t: (k: TKey) => string;
}) {
  const update = useUpdateMember(userId);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrg = role === 'organizer';
  const cta = isOrg
    ? t('player.role.removeOrganizer')
    : t('player.role.makeOrganizer');
  const confirmTitle = isOrg
    ? t('player.role.confirm.removeTitle')
    : t('player.role.confirm.makeTitle');
  const confirmBodyText = isOrg
    ? t('player.role.confirm.removeBody')
    : t('player.role.confirm.makeBody');

  async function apply() {
    setError(null);
    try {
      await update.mutateAsync({ body: { role: isOrg ? 'player' : 'organizer' } });
      setConfirm(false);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(String(e));
    }
  }

  return (
    <>
      <Card variant="surface">
        <CardHead
          title={t('teamSettings.tabs.roles')}
          icon={<IconShieldCheck size={22} color={colors.iconFg} />}
        />
        <button
          type="button"
          className="pressable"
          onClick={() => setConfirm(true)}
          style={isOrg ? destructiveButton : primaryButton}
        >
          {cta}
        </button>
      </Card>

      <BottomSheet open={confirm} onClose={() => setConfirm(false)} title={confirmTitle}>
        <p style={sheetBody}>{confirmBodyText}</p>
        {error ? <div style={errorLine}>{error}</div> : null}
        <button
          type="button"
          className="pressable"
          onClick={() => void apply()}
          disabled={update.isPending}
          style={isOrg ? destructiveButton : primaryButton}
        >
          {cta}
        </button>
      </BottomSheet>
    </>
  );
}

const primaryButton: CSSProperties = {
  marginTop: spacing['12'],
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

const destructiveButton: CSSProperties = {
  marginTop: spacing['12'],
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

const sheetBody: CSSProperties = {
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

const linkRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: spacing['12'],
  paddingTop: spacing['12'],
  borderTop: `1px solid ${colors.divider}`,
  color: colors.primary,
  ...typography.label,
  cursor: 'pointer',
};

function OpenLink({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <div
      className="pressable"
      style={linkRow}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <span>{label}</span>
      <IconChevronRight size={16} color={colors.primary} />
    </div>
  );
}

function AttendanceCard({
  attendance,
  t,
}: {
  attendance: PlayerOverview['attendance'];
  t: (k: TKey) => string;
}) {
  return (
    <Card variant="surface">
      <CardHead
        title={t('player.attendance.title')}
        icon={<IconAttendance size={22} color={colors.iconFg} />}
      />
      <div style={{ marginTop: spacing['8'] }}>
        <div style={bigValue}>{attendance.rate == null ? '—' : `${attendance.rate}%`}</div>
      </div>
      <div style={linkRowStatic}>
        <span style={caption}>{t('player.attendance.last5')}</span>
        {attendance.last5.length === 0 ? (
          <span style={{ ...caption, color: colors.textTertiary }}>
            {t('player.attendance.empty')}
          </span>
        ) : (
          <div style={{ display: 'flex', gap: spacing['6'] }}>
            {attendance.last5.map((item) => (
              <Last5Dot key={item.event_id} status={item.status} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

const linkRowStatic: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: spacing['12'],
  paddingTop: spacing['12'],
  borderTop: `1px solid ${colors.divider}`,
};

function Last5Dot({ status }: { status: AttendanceStatus }) {
  const base: CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
  };
  if (status === 'showed') {
    return (
      <span style={{ ...base, background: colors.successBg }}>
        <IconCheck size={15} color={colors.success} />
      </span>
    );
  }
  if (status === 'missed') {
    return (
      <span style={{ ...base, background: colors.errorBg }}>
        <IconClose size={15} color={colors.error} />
      </span>
    );
  }
  return <span style={{ ...base, background: colors.bgMuted, color: colors.textTertiary }}>?</span>;
}

function FinanceCard({
  balance,
  onOpen,
  t,
}: {
  balance: number;
  onOpen: () => void;
  t: (k: TKey) => string;
}) {
  const word =
    balance > 0
      ? t('player.finance.debt')
      : balance < 0
        ? t('player.finance.credit')
        : t('player.finance.zero');
  const amount = balance === 0 ? null : `${formatRub(balance)} ₽`;
  const valueColor = balance > 0 ? colors.error : balance < 0 ? colors.success : colors.text;
  return (
    <Card variant="surface">
      <CardHead
        title={t('player.finance.title')}
        icon={<IconFinance size={22} color={colors.iconFg} />}
      />
      <div style={{ marginTop: spacing['8'] }}>
        <div
          style={{
            ...bigValue,
            color: valueColor,
            display: 'flex',
            alignItems: 'baseline',
            gap: spacing['12'],
          }}
        >
          <span>{word}</span>
          {amount ? <span>{amount}</span> : null}
        </div>
      </div>
      <OpenLink label={t('player.finance.open')} onOpen={onOpen} />
    </Card>
  );
}

function StatsCard({
  stats,
  onOpen,
  t,
}: {
  stats: PlayerOverview['stats'];
  onOpen: () => void;
  t: (k: TKey) => string;
}) {
  return (
    <Card variant="surface">
      <CardHead title={t('player.stats.title')} icon={<IconChart size={22} color={colors.iconFg} />} />
      <div style={{ marginTop: spacing['12'] }}>
        <StatCells
          cells={[
            { label: t('player.stats.games'), value: stats.games.played },
            { label: t('player.stats.goals'), value: stats.games.goals },
            { label: t('player.stats.assists'), value: stats.games.assists },
          ]}
        />
      </div>
      <div style={{ height: 1, background: colors.divider, margin: `${spacing['12']}px 0` }} />
      <StatCells
        cells={[
          { label: t('player.stats.trainings'), value: stats.trainings.played },
          { label: t('player.stats.goals'), value: stats.trainings.goals },
          { label: t('player.stats.assists'), value: stats.trainings.assists },
        ]}
      />
      <OpenLink label={t('player.stats.open')} onOpen={onOpen} />
    </Card>
  );
}
