'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { VenueSelectSheet } from '@/components/venue-select-sheet';
import { CardField } from '@/components/card-field';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { EventSummaryCard } from '@/components/event-summary-card';
import { InfoListCard } from '@/components/info-list-card';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconCalendar,
  IconClock,
  IconStopwatch,
  IconLocation,
  IconPeople,
  IconStick,
  IconRuble,
  IconSparkle,
} from '@/components/icons';
import { useEvent } from '@/hooks/use-event';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useVenues } from '@/hooks/use-venues';
import { useUpdateEvent } from '@/hooks/use-update-event';
import { ApiError } from '@/lib/api-client';
import { combineDateTime } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { UpdateEventRequest, VenueDto } from '@/types/api';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function durationMinutes(startsIso: string, endsIso: string | null): number {
  if (!endsIso) return 90;
  return Math.max(0, Math.round((new Date(endsIso).getTime() - new Date(startsIso).getTime()) / 60_000));
}

function minutesToDurationStr(mins: number): string {
  if (!mins) return '01:30';
  return `${pad2(Math.floor(mins / 60))}:${pad2(mins % 60)}`;
}

function durationStrToMinutes(s: string): number {
  if (!s) return 0;
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatDurationDisplay(s: string): string {
  const mins = durationStrToMinutes(s);
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ч`);
  if (m > 0) parts.push(`${m} мин`);
  return parts.join(' ');
}

function formatLongDateFromLocal(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(y ?? 0, (m ?? 1) - 1, d ?? 1));
}

function HiddenNativeInput({
  type,
  value,
  onChange,
  step,
}: {
  type: 'date' | 'time';
  value: string;
  onChange: (v: string) => void;
  step?: number;
}) {
  const style: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    border: 0,
    padding: 0,
    background: 'transparent',
    color: 'transparent',
    fontSize: 16,
  };
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      step={step}
      style={style}
      aria-hidden
    />
  );
}

type FormState = {
  date: string;
  time: string;
  durationStr: string;
  venueId: string | null;
  details: string;
  // Числовые поля как string — чтобы корректно различать «пусто» и 0.
  // Парсятся в number при отправке.
  costPerPlayer: string;
  arenaCost: string;
};

const DETAILS_LIMIT = 1000;

export default function EventReschedulePage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#FFFFFF');

  const ev = useEvent(id);
  const venuesQuery = useVenues();
  const update = useUpdateEvent(id);

  const data = ev.data;
  const { isOrganizer, isLoading: meLoading } = useIsOrganizer(data?.team_id);

  const initialForm = useMemo<FormState | null>(() => {
    if (!data) return null;
    return {
      date: toLocalDate(data.starts_at),
      time: toLocalTime(data.starts_at),
      durationStr: minutesToDurationStr(durationMinutes(data.starts_at, data.ends_at)),
      venueId: data.venue?.id ?? null,
      details: data.details ?? '',
      costPerPlayer: data.cost_per_player != null ? String(data.cost_per_player) : '',
      arenaCost: data.arena_cost != null ? String(data.arena_cost) : '',
    };
  }, [data]);

  const [form, setForm] = useState<FormState | null>(null);
  const [venueOpen, setVenueOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialForm && !form) setForm(initialForm);
  }, [initialForm, form]);

  useEffect(() => {
    if (data && !meLoading && !isOrganizer) {
      router.replace(`/events/${id}`);
    }
  }, [data, meLoading, isOrganizer, id, router]);

  const venues: VenueDto[] = venuesQuery.data?.venues ?? [];
  const selectedVenue =
    venues.find((v) => v.id === (form?.venueId ?? null)) ?? null;

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
  const sectionLabel: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    margin: `${spacing['8']}px 0 ${spacing['4']}px`,
  };
  const fieldLabel: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: spacing['4'],
  };

  if (ev.isLoading || !data || !form) {
    return (
      <div style={root}>
        <LightHeader title={t('reschedule.title')} onBack={onBack} />
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
        <LightHeader title={t('reschedule.title')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('media.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }
  if (data.status !== 'scheduled') {
    return (
      <div style={root}>
        <LightHeader title={t('reschedule.title')} onBack={onBack} />
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
  const summaryTitle = data.title?.trim()
    ? data.title
    : isGame
      ? t('reschedule.summary.game')
      : t('reschedule.summary.training');
  const venueName = data.venue?.name ?? null;

  const notifyCount = data.attendees.filter((a) => a.vote === 'going').length;
  const paymentsTouched = data.payments.paid_count + data.payments.partial_count > 0;

  const changesItems = [
    notifyCount > 0
      ? {
          icon: <IconPeople size={16} color={colors.iconFg} />,
          title: interp(t('reschedule.changes.notify'), { count: notifyCount }),
          subtitle: t('reschedule.changes.notifyHint'),
        }
      : null,
    {
      icon: <IconStick size={16} color={colors.iconFg} />,
      title: t('reschedule.changes.votes'),
      subtitle: t('reschedule.changes.votesHint'),
    },
    paymentsTouched
      ? {
          icon: <IconRuble size={16} color={colors.iconFg} />,
          title: t('reschedule.changes.payments'),
          subtitle: t('reschedule.changes.paymentsHint'),
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => (prev ? { ...prev, [k]: v } : prev));

  const durationMins = durationStrToMinutes(form.durationStr);
  const initialMins = durationStrToMinutes(initialForm!.durationStr);
  const detailsTrimmed = form.details.trim();
  const initialDetailsTrimmed = initialForm!.details.trim();
  const scheduleChanged =
    form.date !== initialForm!.date ||
    form.time !== initialForm!.time ||
    durationMins !== initialMins;
  const venueChanged = form.venueId !== initialForm!.venueId;
  const detailsChanged = detailsTrimmed !== initialDetailsTrimmed;
  // Поля «Взнос» и «Стоимость аренды» — сравниваем как числа (или null,
  // если поле очищено). Парсим один раз для submit и для detection.
  const costPerPlayerParsed = parseMoneyString(form.costPerPlayer);
  const arenaCostParsed = parseMoneyString(form.arenaCost);
  const initialCostPerPlayer = data.cost_per_player ?? null;
  const initialArenaCost = data.arena_cost ?? null;
  const costPerPlayerChanged = costPerPlayerParsed !== initialCostPerPlayer;
  const arenaCostChanged = arenaCostParsed !== initialArenaCost;
  const changed =
    scheduleChanged ||
    venueChanged ||
    detailsChanged ||
    costPerPlayerChanged ||
    arenaCostChanged;

  const valid =
    Boolean(form.date) && Boolean(form.time) && durationMins > 0 && Boolean(form.venueId);

  const submitDisabled = update.isPending || !valid || !changed;

  const onSubmit = () => {
    if (!form.venueId) return;
    setError(null);
    const body: UpdateEventRequest = {};
    if (scheduleChanged) {
      body.starts_at = combineDateTime(form.date, form.time);
      body.duration_minutes = durationMins;
    }
    if (venueChanged) {
      body.venue_id = form.venueId;
    }
    if (detailsChanged) {
      body.details = detailsTrimmed ? detailsTrimmed : null;
    }
    if (costPerPlayerChanged) {
      body.cost_per_player = costPerPlayerParsed;
    }
    if (arenaCostChanged) {
      body.arena_cost = arenaCostParsed;
    }
    update.mutate(body, {
      onSuccess: () => router.replace(`/events/${id}`),
      onError: (e) =>
        setError(e instanceof ApiError ? e.message : t('common.error')),
    });
  };

  return (
    <div style={root}>
      <LightHeader title={t('reschedule.title')} onBack={onBack} />

      <div style={content}>
        <EventSummaryCard
          title={summaryTitle}
          startsAt={data.starts_at}
          endsAt={data.ends_at}
          venueName={venueName}
          venueAddress={data.venue?.address ?? null}
        />

        <div style={sectionLabel}>{t('reschedule.sections.newTime')}</div>

        <div style={{ position: 'relative' }}>
          <CardField
            icon={<IconCalendar size={20} color={colors.iconFg} />}
            label={t('reschedule.fields.newDate')}
            value={form.date ? formatLongDateFromLocal(form.date) : ''}
            placeholder={t('eventNew.fields.datePlaceholder')}
          />
          <HiddenNativeInput
            type="date"
            value={form.date}
            onChange={(v) => setField('date', v)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['8'] }}>
          <div style={{ position: 'relative' }}>
            <CardField
              icon={<IconClock size={20} color={colors.iconFg} />}
              label={t('reschedule.fields.startTime')}
              value={form.time}
              placeholder={t('eventNew.fields.timePlaceholder')}
              showChevron={false}
            />
            <HiddenNativeInput
              type="time"
              value={form.time}
              onChange={(v) => setField('time', v)}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <CardField
              icon={<IconStopwatch size={20} color={colors.iconFg} />}
              label={t('reschedule.fields.duration')}
              value={formatDurationDisplay(form.durationStr)}
              placeholder={t('eventNew.fields.timePlaceholder')}
              showChevron={false}
            />
            <HiddenNativeInput
              type="time"
              value={form.durationStr}
              onChange={(v) => setField('durationStr', v)}
              step={300}
            />
          </div>
        </div>

        <CardField
          icon={<IconLocation size={20} color={colors.iconFg} />}
          label={t('reschedule.fields.venue')}
          value={selectedVenue?.name ?? ''}
          placeholder={t('eventNew.fields.venue.placeholder')}
          onClick={() => setVenueOpen(true)}
        />

        <div style={sectionLabel}>{t('reschedule.sections.details')}</div>

        <div>
          <div style={fieldLabel}>{t('reschedule.fields.eventTitle')}</div>
          <Input
            type="text"
            value={form.details}
            onChange={(e) =>
              setField('details', e.currentTarget.value.slice(0, DETAILS_LIMIT))
            }
            placeholder={t('reschedule.fields.eventTitle.placeholder')}
            maxLength={DETAILS_LIMIT}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.divider}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              fontSize: 17,
              fontWeight: 600,
            }}
          />
        </div>

        {/* Финансовые поля — взнос игрока и стоимость аренды (v0.5, итерация 51.1).
            Оба опциональные. Пустое значение шлётся как null — это значит «не указана». */}
        <div style={sectionLabel}>{t('reschedule.sections.money')}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['8'] }}>
          <div>
            <div style={fieldLabel}>{t('reschedule.fields.costPerPlayer')}</div>
            <Input
              type="text"
              inputMode="numeric"
              value={form.costPerPlayer}
              onChange={(e) =>
                setField('costPerPlayer', e.currentTarget.value.replace(/[^\d]/g, ''))
              }
              placeholder="0"
            />
          </div>
          <div>
            <div style={fieldLabel}>{t('reschedule.fields.arenaCost')}</div>
            <Input
              type="text"
              inputMode="numeric"
              value={form.arenaCost}
              onChange={(e) =>
                setField('arenaCost', e.currentTarget.value.replace(/[^\d]/g, ''))
              }
              placeholder="0"
            />
          </div>
        </div>

        <InfoListCard
          title={t('reschedule.changes.title')}
          items={changesItems}
        />

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
          disabled={submitDisabled}
          onClick={onSubmit}
          style={{ background: colors.headerBg, marginTop: spacing['8'] }}
        >
          <IconSparkle size={18} color={colors.textInverse} />
          {update.isPending ? t('reschedule.submitting') : t('reschedule.submit')}
        </Button>
      </div>

      <VenueSelectSheet
        open={venueOpen}
        onClose={() => setVenueOpen(false)}
        venues={venues}
        activeId={form.venueId}
        onSelect={(id) => setField('venueId', id)}
      />
    </div>
  );
}

function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

// Пустая строка → null (поле очищено), валидное число → number.
// Невалидный ввод (не-числовое) — возвращаем null, чтобы не передавать NaN.
function parseMoneyString(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
