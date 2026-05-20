'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { Button } from '@/components/button';
import { Textarea } from '@/components/textarea';
import { EventSummaryCard } from '@/components/event-summary-card';
import { InfoListCard } from '@/components/info-list-card';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconPeople,
  IconRuble,
  IconLocation,
} from '@/components/icons';
import { useEvent } from '@/hooks/use-event';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useUpdateEvent } from '@/hooks/use-update-event';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

const REASON_LIMIT = 200;

function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export default function EventCancelPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#FFFFFF');

  const me = useMe();
  const ev = useEvent(id);
  const update = useUpdateEvent(id);

  const data = ev.data;
  const isOrganizer = useMemo(() => {
    if (!data || !me.data) return false;
    return me.data.memberships.some(
      (m) => m.team_id === data.team_id && m.role === 'organizer',
    );
  }, [data, me.data]);

  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/events/${id}`);
  };

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
  };
  const content: CSSProperties = {
    padding: `${spacing['8']}px ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };

  if (ev.isLoading || !data) {
    return (
      <div style={root}>
        <LightHeader title={t('cancel.title')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }
  if (ev.isError) {
    return (
      <div style={root}>
        <LightHeader title={t('cancel.title')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('media.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }
  if (!isOrganizer || data.status !== 'scheduled') {
    return (
      <div style={root}>
        <LightHeader title={t('cancel.title')} onBack={onBack} />
        <div
          style={{
            padding: `${spacing['24']}px ${spacing['16']}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing['16'],
            alignItems: 'center',
          }}
        >
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('cancel.disabled.notEditable')}
          </span>
          <Button variant="secondary" onClick={() => router.replace(`/events/${id}`)}>
            {t('cancel.close')}
          </Button>
        </div>
      </div>
    );
  }

  const isGame = data.type === 'game';
  const summaryTitle = isGame ? t('reschedule.summary.game') : t('reschedule.summary.training');
  const venueName = data.venue?.name ?? data.venue_text ?? null;

  const notifyCount = data.team_size;
  const refundsCount = data.payments.paid_count + data.payments.partial_count;
  const arenaCost = data.arena_cost ?? 0;

  const happensItems = [
    notifyCount > 1
      ? {
          icon: <IconPeople size={16} color={colors.error} />,
          title: interp(t('cancel.happens.notify'), { count: notifyCount }),
          subtitle: t('cancel.happens.notifyHint'),
        }
      : null,
    refundsCount > 0
      ? {
          icon: <IconRuble size={16} color={colors.error} />,
          title: interp(t('cancel.happens.refunds'), { count: refundsCount }),
          subtitle: t('cancel.happens.refundsHint'),
        }
      : null,
    arenaCost > 0
      ? {
          icon: <IconLocation size={16} color={colors.error} />,
          title: t('cancel.happens.arena'),
          subtitle: t('cancel.happens.arenaHint'),
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  const onConfirm = () => {
    if (typeof window !== 'undefined' && !window.confirm(t('cancel.confirm'))) {
      return;
    }
    setError(null);
    update.mutate(
      { status: 'cancelled', cancelled_reason: reason.trim() || null },
      {
        onSuccess: () => router.replace('/events'),
        onError: (e) =>
          setError(e instanceof ApiError ? e.message : t('common.error')),
      },
    );
  };

  const reasonLabel: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    marginBottom: spacing['4'],
  };
  const counterStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: spacing['4'],
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={root}>
      <LightHeader title={t('cancel.title')} onBack={onBack} />

      <div style={content}>
        <EventSummaryCard
          title={summaryTitle}
          startsAt={data.starts_at}
          endsAt={data.ends_at}
          venueName={venueName}
          venueAddress={data.venue?.address ?? null}
        />

        <div>
          <div style={reasonLabel}>{t('cancel.reason.label')}</div>
          <Textarea
            placeholder={t('cancel.reason.placeholder')}
            value={reason}
            onChange={(e) =>
              setReason(e.currentTarget.value.slice(0, REASON_LIMIT))
            }
            maxLength={REASON_LIMIT}
            rows={4}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.divider}`,
              minHeight: 100,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          />
          <div style={counterStyle}>
            {interp(t('cancel.reason.counter'), { len: reason.length })}
          </div>
        </div>

        {happensItems.length > 0 ? (
          <InfoListCard
            title={t('cancel.happens.title')}
            items={happensItems}
            tone="danger"
          />
        ) : null}

        {error ? (
          <div
            style={{
              ...typography.sm,
              color: colors.error,
              padding: `${spacing['8']}px ${spacing['12']}px`,
              background: colors.errorBg,
              borderRadius: radius.md,
            }}
          >
            {error}
          </div>
        ) : null}

        <Button
          fullWidth
          size="lg"
          variant="danger"
          disabled={update.isPending}
          onClick={onConfirm}
        >
          {update.isPending ? t('reschedule.submitting') : t('cancel.submit')}
        </Button>

        <Button
          fullWidth
          size="lg"
          variant="secondary"
          onClick={onBack}
          disabled={update.isPending}
        >
          {t('cancel.close')}
        </Button>
      </div>
    </div>
  );
}
