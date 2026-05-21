'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { StatRowSkeleton } from '@/components/skeleton';
import { PlayerRow } from '@/components/player-row';
import { ActionTile } from '@/components/action-tile';
import { StatChip } from '@/components/stat-chip';
import { RingProgress } from '@/components/ring-progress';
import { PaymentSheet } from '@/components/payment-sheet';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { IconCheck, IconRuble } from '@/components/icons';
import { useEvent } from '@/hooks/use-event';
import { useMe } from '@/hooks/use-me';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useSetPayment } from '@/hooks/use-set-payment';
import { useSetAttendance } from '@/hooks/use-set-attendance';
import { usePaymentClaim } from '@/hooks/use-payment-claim';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatEventDateRange } from '@/lib/event-format';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { EventAttendee, EventDetailDto, PlayerPosition } from '@/types/api';

function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

function formatRub(n: number): string {
  return n.toLocaleString('ru-RU');
}

function positionLabel(pos: PlayerPosition | null, t: (k: never) => string): string | null {
  if (!pos) return null;
  if (pos === 'forward') return t('rosterDay.position.forward' as never);
  if (pos === 'defender') return t('rosterDay.position.defender' as never);
  if (pos === 'goalie') return t('rosterDay.position.goalie' as never);
  return null;
}

function playerSubtitle(a: EventAttendee, t: (k: never) => string): string | undefined {
  const pos = positionLabel(a.position, t);
  if (a.jersey_number != null && pos) return `#${a.jersey_number} · ${pos}`;
  if (a.jersey_number != null) return `#${a.jersey_number}`;
  if (pos) return pos;
  return undefined;
}

type PayingFor = { attendee: EventAttendee } | null;

export default function EventAttendeesPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#FFFFFF');

  const me = useMe();
  const myUserId = me.data?.user.id;
  const ev = useEvent(id);
  const setPayment = useSetPayment(id);
  const setAttendance = useSetAttendance(id);
  const paymentClaim = usePaymentClaim(id, myUserId);

  const data = ev.data as EventDetailDto | undefined;
  const isTraining = data?.type !== 'game';
  const { isOrganizer } = useIsOrganizer(data?.team_id);

  const cost = data?.cost_per_player ?? null;
  const showFinance = isOrganizer && cost != null && cost > 0;

  const [paying, setPaying] = useState<PayingFor>(null);

  const groups = useMemo(() => {
    const list = data?.attendees ?? [];
    return {
      going: list.filter((a) => a.vote === 'going'),
      noAnswer: list.filter((a) => a.vote === null),
      notGoing: list.filter((a) => a.vote === 'not_going'),
    };
  }, [data]);

  const headerTitle = isOrganizer
    ? t('rosterDay.title.attendees')
    : isTraining
      ? t('rosterDay.title.attendees.training.player')
      : t('rosterDay.title.attendees.game.player');

  const venueName = data?.venue?.name ?? data?.venue_text ?? '';
  const subtitle = data
    ? [formatEventDateRange(data.starts_at, data.ends_at), venueName]
        .filter(Boolean)
        .join(' · ')
    : '';

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const content: CSSProperties = {
    padding: `${spacing['8']}px 0 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/events/${id}`);
  };

  if (ev.isLoading || !data) {
    return (
      <div style={root}>
        <LightHeader title={headerTitle} onBack={onBack} />
        <div style={{ padding: `${spacing['16']}px` }}>
          <StatRowSkeleton />
        </div>
      </div>
    );
  }
  if (ev.isError) {
    return (
      <div style={root}>
        <LightHeader title={headerTitle} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('eventDetail.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={root}>
      <LightHeader title={headerTitle} subtitle={subtitle} onBack={onBack} />

      <div style={content}>
        {showFinance ? (
          <FinanceCard
            cost={cost!}
            collected={data.payments.collected}
            target={data.payments.target}
            paidCount={data.payments.paid_count}
            partialCount={data.payments.partial_count}
            debtCount={data.payments.debt_count}
            tPaid={t('rosterDay.stats.paid')}
            tPartial={t('rosterDay.stats.partial')}
            tDebt={t('rosterDay.stats.debt')}
            tFee={t('rosterDay.finance.feePlayer')}
            tCollected={t('rosterDay.finance.collected')}
            tTargetTemplate={t('rosterDay.finance.target')}
          />
        ) : null}

        {(['going', 'noAnswer', 'notGoing'] as const).map((g) => (
          <Group
            key={g}
            title={
              g === 'going'
                ? t('rosterDay.sections.signed')
                : g === 'noAnswer'
                  ? t('rosterDay.sections.noAnswer')
                  : t('rosterDay.sections.notGoing')
            }
            attendees={groups[g]}
            renderRight={(a, isLast) => (
              <PlayerActions
                attendee={a}
                cost={cost}
                isOrganizer={isOrganizer}
                isMe={a.user_id === myUserId}
                tPaid={t('rosterDay.actions.paid')}
                tWas={t('rosterDay.actions.was')}
                tClaimCta={t('rosterDay.paymentClaim.cta')}
                tClaimSent={t('rosterDay.paymentClaim.sent')}
                onPay={() => setPaying({ attendee: a })}
                onWas={() =>
                  setAttendance.mutate({ user_id: a.user_id, showed_up: !(a.showed_up ?? false) })
                }
                onClaim={() => paymentClaim.mutate()}
                claimPending={paymentClaim.isPending}
                isLast={isLast}
              />
            )}
            renderSubtitle={(a) => playerSubtitle(a, t as (k: never) => string)}
          />
        ))}
      </div>

      {paying ? (
        <PaymentSheet
          open={!!paying}
          onClose={() => setPaying(null)}
          onSubmit={(amount) => {
            setPayment.mutate({
              user_id: paying.attendee.user_id,
              amount: amount > 0 ? amount : null,
            });
            setPaying(null);
          }}
          title={t('rosterDay.sheet.title')}
          playerName={formatName(paying.attendee)}
          playerSubtitle={playerSubtitle(paying.attendee, t as (k: never) => string)}
          photoUrl={paying.attendee.photo_url}
          costPerPlayer={cost}
          currentPaid={paying.attendee.paid_amount}
          feeLabel={interp(
            isTraining
              ? t('rosterDay.sheet.feeForTraining')
              : t('rosterDay.sheet.feeForGame'),
            { cost: cost != null ? formatRub(cost) : '—' },
          )}
          hint={t('rosterDay.sheet.canChange')}
          saveLabel={t('rosterDay.sheet.save')}
          cancelLabel={t('rosterDay.sheet.cancel')}
          amountLabel={t('rosterDay.sheet.amount')}
          pending={setPayment.isPending}
        />
      ) : null}
    </div>
  );
}

function FinanceCard({
  cost,
  collected,
  target,
  paidCount,
  partialCount,
  debtCount,
  tPaid,
  tPartial,
  tDebt,
  tFee,
  tCollected,
  tTargetTemplate,
}: {
  cost: number;
  collected: number;
  target: number;
  paidCount: number;
  partialCount: number;
  debtCount: number;
  tPaid: string;
  tPartial: string;
  tDebt: string;
  tFee: string;
  tCollected: string;
  tTargetTemplate: string;
}) {
  const card: CSSProperties = {
    margin: `0 ${spacing['16']}px`,
    padding: `${spacing['16']}px ${spacing['16']}px ${spacing['4']}px`,
    background: colors.bgOffWhite,
    border: `1px solid ${colors.surfaceWarm}`,
    borderRadius: radius.lg,
    display: 'flex',
    flexDirection: 'column',
  };

  const top: CSSProperties = {
    display: 'flex',
    gap: spacing['12'],
    alignItems: 'center',
  };

  const labelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
  };

  const amountStyle: CSSProperties = {
    fontSize: 24,
    fontWeight: 800,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.4px',
    marginTop: 2,
  };

  const targetStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textTertiary,
    marginTop: 3,
  };

  const divider: CSSProperties = {
    height: 1,
    background: colors.surfaceMuted,
    margin: `${spacing['16']}px 0 0`,
  };

  const chipsRow: CSSProperties = {
    display: 'flex',
    gap: 4,
    padding: `${spacing['12']}px 0`,
  };

  return (
    <div style={card}>
      <div style={top}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={labelStyle}>{tFee}</div>
          <div style={amountStyle}>{cost.toLocaleString('ru-RU')} ₽</div>
          <div style={{ ...labelStyle, marginTop: spacing['12'] }}>{tCollected}</div>
          <div style={amountStyle}>{collected.toLocaleString('ru-RU')} ₽</div>
          <div style={targetStyle}>
            {interp(tTargetTemplate, { target: target.toLocaleString('ru-RU') })}
          </div>
        </div>
        <RingProgress value={collected} total={target} />
      </div>
      <div style={divider} />
      <div style={chipsRow}>
        <StatChip
          icon={<IconCheck size={16} color={colors.textInverse} />}
          color={colors.headerAccent}
          label={tPaid}
          value={paidCount}
        />
        <StatChip
          icon={<span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFFFFF' }} />}
          color="#FF9500"
          label={tPartial}
          value={partialCount}
        />
        <StatChip
          icon={
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.5" stroke="white" strokeWidth="1.8" />
              <path d="M5 19c0-3 3-5 7-5s7 2 7 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
          color="#D43838"
          label={tDebt}
          value={debtCount}
        />
      </div>
    </div>
  );
}

function Group({
  title,
  attendees,
  renderRight,
  renderSubtitle,
}: {
  title: string;
  attendees: EventAttendee[];
  renderRight: (a: EventAttendee, isLast: boolean) => React.ReactNode;
  renderSubtitle: (a: EventAttendee) => string | undefined;
}) {
  if (attendees.length === 0) return null;
  const headerStyle: CSSProperties = {
    padding: `${spacing['12']}px ${spacing['16']}px ${spacing['8']}px`,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };
  const titleStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 800,
    color: colors.text,
    letterSpacing: '-0.2px',
  };
  const pill: CSSProperties = {
    minWidth: 22,
    height: 20,
    padding: '0 7px',
    borderRadius: 10,
    background: colors.bgMuted,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontVariantNumeric: 'tabular-nums',
  };
  return (
    <div>
      <div style={headerStyle}>
        <span style={titleStyle}>{title}</span>
        <span style={pill}>{attendees.length}</span>
      </div>
      <div>
        {attendees.map((a, idx) => (
          <PlayerRow
            key={a.user_id}
            name={formatName(a)}
            subtitle={renderSubtitle(a)}
            photoUrl={a.photo_url}
            right={renderRight(a, idx === attendees.length - 1)}
            isLast={idx === attendees.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerActions({
  attendee,
  cost,
  isOrganizer,
  isMe,
  tPaid,
  tWas,
  tClaimCta,
  tClaimSent,
  onPay,
  onWas,
  onClaim,
  claimPending,
}: {
  attendee: EventAttendee;
  cost: number | null;
  isOrganizer: boolean;
  isMe: boolean;
  tPaid: string;
  tWas: string;
  tClaimCta: string;
  tClaimSent: string;
  onPay: () => void;
  onWas: () => void;
  onClaim: () => void;
  claimPending: boolean;
  isLast: boolean;
}) {
  const paid = attendee.paid_amount ?? 0;
  let paidVariant: 'empty' | 'full' | 'partial' = 'empty';
  if (cost != null && cost > 0) {
    if (paid >= cost) paidVariant = 'full';
    else if (paid > 0) paidVariant = 'partial';
  } else if (paid > 0) {
    paidVariant = 'full';
  }

  const paidActive = paidVariant !== 'empty';
  const paidActiveColor = paidVariant === 'partial' ? '#FF9500' : colors.headerAccent;
  const paidLabel =
    paidVariant === 'partial' ? `${paid.toLocaleString('ru-RU')} ₽` : tPaid;

  if (!isOrganizer) {
    if (isMe && paidVariant !== 'full' && cost != null && cost > 0) {
      return (
        <button
          type="button"
          onClick={onClaim}
          disabled={claimPending || attendee.payment_claim}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: attendee.payment_claim ? colors.textTertiary : colors.headerAccent,
            fontSize: 11,
            fontWeight: 600,
            cursor: attendee.payment_claim ? 'default' : 'pointer',
            textAlign: 'right',
          }}
        >
          {attendee.payment_claim ? tClaimSent : tClaimCta}
        </button>
      );
    }
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
      <ActionTile
        icon={<IconCheck size={20} color={attendee.showed_up ? colors.textInverse : colors.navInactive} />}
        label={tWas}
        active={!!attendee.showed_up}
        activeColor={colors.headerAccent}
        onClick={onWas}
      />
      <ActionTile
        icon={
          <IconRuble
            size={20}
            color={paidActive ? colors.textInverse : colors.navInactive}
          />
        }
        label={paidLabel}
        active={paidActive}
        activeColor={paidActiveColor}
        onClick={onPay}
      />
    </div>
  );
}
