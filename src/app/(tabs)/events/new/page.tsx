'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DarkHeader } from '@/components/dark-header';
import { BackButton } from '@/components/back-button';
import { TypeChips } from '@/components/type-chips';
import { CardField } from '@/components/card-field';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { Textarea } from '@/components/textarea';
import { Button } from '@/components/button';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconCalendar,
  IconClock,
  IconStopwatch,
  IconWhistle,
  IconStick,
  IconLocation,
  IconRuble,
  IconCheckCircle,
  IconSparkle,
  IconInfo,
} from '@/components/icons';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useVenues } from '@/hooks/use-venues';
import { apiFetch, ApiError } from '@/lib/api-client';
import { combineDateTime, formatLongDateLocal } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type {
  CreateEventRequest,
  CreateEventResponse,
  EventType,
  VenueDto,
} from '@/types/api';
import type { TKey } from '@/i18n/ru';

type FormState = {
  type: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  venueId: string | null;
  details: string;
};

const DURATION_OPTIONS: ReadonlyArray<{ value: number; key: TKey }> = [
  { value: 60, key: 'eventNew.duration.60' },
  { value: 90, key: 'eventNew.duration.90' },
  { value: 120, key: 'eventNew.duration.120' },
  { value: 150, key: 'eventNew.duration.150' },
  { value: 180, key: 'eventNew.duration.180' },
];

const INITIAL_STATE: FormState = {
  type: 'training',
  date: '',
  time: '',
  duration: 60,
  venueId: null,
  details: '',
};

function SectionLabel({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: colors.text,
    margin: `${spacing['16']}px 0 ${spacing['8']}px`,
  };
  return <span style={style}>{children}</span>;
}

function HiddenNativeInput({
  type,
  value,
  onChange,
}: {
  type: 'date' | 'time';
  value: string;
  onChange: (v: string) => void;
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
      style={style}
      aria-hidden
    />
  );
}

export default function EventNewPage() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  useTgHeader('#233F30');

  const me = useMe();
  const venuesQuery = useVenues();

  const isOrganizer = useMemo(
    () => me.data?.memberships.some((m) => m.role === 'organizer') ?? false,
    [me.data],
  );

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [durationOpen, setDurationOpen] = useState(false);
  const [venueOpen, setVenueOpen] = useState(false);

  useEffect(() => {
    if (me.data && !isOrganizer) {
      router.replace('/events');
    }
  }, [me.data, isOrganizer, router]);

  // Автовыбор первой площадки, если в команде ровно одна
  const venues: VenueDto[] = venuesQuery.data?.venues ?? [];
  useEffect(() => {
    if (form.venueId !== null) return;
    if (venues.length === 1) setForm((prev) => ({ ...prev, venueId: venues[0].id }));
  }, [venues, form.venueId]);

  const selectedVenue = useMemo<VenueDto | null>(
    () => venues.find((v) => v.id === form.venueId) ?? null,
    [venues, form.venueId],
  );

  const createEvent = useMutation<CreateEventResponse, ApiError, CreateEventRequest>({
    mutationFn: (body) =>
      apiFetch<CreateEventResponse>('/api/events', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      router.replace('/events');
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : t('common.error')),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = () => {
    setError(null);
    if (!form.date) {
      setError(t('eventNew.errors.date'));
      return;
    }
    if (!form.time) {
      setError(t('eventNew.errors.time'));
      return;
    }
    if (!form.venueId) {
      setError(t('eventNew.errors.venue'));
      return;
    }

    const body: CreateEventRequest = {
      type: form.type,
      starts_at: combineDateTime(form.date, form.time),
      duration_minutes: form.duration,
      venue_id: form.venueId,
      title: form.details.trim() || undefined,
    };
    createEvent.mutate(body);
  };

  const sheet: CSSProperties = {
    background: colors.bgWarm,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 140px)`,
    padding: `${spacing['4']}px ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
  };

  const typeOptions = [
    {
      id: 'training' as const,
      label: t('eventNew.type.training'),
      icon: (color: string) => <IconWhistle size={20} color={color} />,
    },
    {
      id: 'game' as const,
      label: t('eventNew.type.game'),
      icon: (color: string) => <IconStick size={20} color={color} />,
    },
  ];

  const durationKey: TKey =
    DURATION_OPTIONS.find((o) => o.value === form.duration)?.key ?? 'eventNew.duration.60';
  const durationLabel = t(durationKey);

  const dateDisplay = form.date ? formatLongDateLocal(form.date) : '';
  const timeDisplay = form.time || '';

  const costDisplay = selectedVenue?.default_cost_per_player != null
    ? `${selectedVenue.default_cost_per_player.toLocaleString('ru-RU')} ₽`
    : '';

  const submitDisabled =
    createEvent.isPending || !form.date || !form.time || !form.venueId;

  return (
    <div style={{ background: colors.headerBg, minHeight: '100dvh' }}>
      <DarkHeader
        role={t('eventNew.role')}
        title={t('eventNew.title')}
        left={<BackButton ariaLabel={t('schedule.backLabel')} />}
      />

      <div style={sheet}>
        <SectionLabel>{t('eventNew.sections.type')}</SectionLabel>
        <TypeChips
          options={typeOptions}
          activeId={form.type}
          onChange={(id) => set('type', id as EventType)}
        />

        <SectionLabel>{t('eventNew.sections.schedule')}</SectionLabel>
        <div style={{ position: 'relative', marginBottom: spacing['8'] }}>
          <CardField
            icon={<IconCalendar size={20} color={colors.iconFg} />}
            label={t('eventNew.fields.date')}
            value={dateDisplay}
            placeholder={t('eventNew.fields.datePlaceholder')}
            showChevron
          />
          <HiddenNativeInput
            type="date"
            value={form.date}
            onChange={(v) => set('date', v)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing['8'] }}>
          <div style={{ position: 'relative' }}>
            <CardField
              icon={<IconClock size={20} color={colors.iconFg} />}
              label={t('eventNew.fields.startTime')}
              value={timeDisplay}
              placeholder={t('eventNew.fields.timePlaceholder')}
              showChevron
            />
            <HiddenNativeInput
              type="time"
              value={form.time}
              onChange={(v) => set('time', v)}
            />
          </div>
          <CardField
            icon={<IconStopwatch size={20} color={colors.iconFg} />}
            label={t('eventNew.fields.duration')}
            value={durationLabel}
            onClick={() => setDurationOpen(true)}
          />
        </div>

        <SectionLabel>{t('eventNew.sections.details')}</SectionLabel>
        <Textarea
          placeholder={`${t('eventNew.fields.details.placeholder1')}\n${t('eventNew.fields.details.placeholder2')}`}
          value={form.details}
          onChange={(e) => set('details', e.currentTarget.value)}
          maxLength={2000}
          rows={3}
          style={{ background: colors.bg, minHeight: 92 }}
        />

        <SectionLabel>{t('eventNew.sections.venue')}</SectionLabel>
        <CardField
          icon={<IconLocation size={20} color={colors.iconFg} />}
          label={t('eventNew.sections.venue')}
          value={selectedVenue?.name ?? ''}
          placeholder={t('eventNew.fields.venue.placeholder')}
          onClick={() => setVenueOpen(true)}
        />

        <SectionLabel>{t('eventNew.sections.cost')}</SectionLabel>
        <CardField
          icon={<IconRuble size={20} color={colors.iconFg} />}
          label={costDisplay || t('eventNew.cost.placeholder')}
          value={t('eventNew.cost.auto')}
          showChevron={false}
          right={
            selectedVenue?.default_cost_per_player != null ? (
              <IconCheckCircle size={22} color={colors.success} />
            ) : (
              <IconInfo size={18} color={colors.textTertiary} />
            )
          }
        />

        {error ? (
          <div
            style={{
              ...typography.sm,
              color: colors.error,
              marginTop: spacing['12'],
              padding: `${spacing['8']}px ${spacing['12']}px`,
              background: colors.errorBg,
              borderRadius: radius.md,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ flex: 1 }} />

        <Button
          fullWidth
          size="lg"
          disabled={submitDisabled}
          onClick={onSubmit}
          style={{ background: colors.headerBg, marginTop: spacing['20'] }}
        >
          <IconSparkle size={18} color={colors.textInverse} />
          {createEvent.isPending ? t('eventNew.submitting') : t('eventNew.submit')}
        </Button>
      </div>

      <BottomSheet
        open={durationOpen}
        onClose={() => setDurationOpen(false)}
        title={t('eventNew.sheet.duration.title')}
      >
        {DURATION_OPTIONS.map((o) => (
          <BottomSheetOption
            key={o.value}
            label={t(o.key)}
            active={form.duration === o.value}
            onClick={() => {
              set('duration', o.value);
              setDurationOpen(false);
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        open={venueOpen}
        onClose={() => setVenueOpen(false)}
        title={t('eventNew.sheet.venue.title')}
      >
        {venues.length === 0 ? (
          <div
            style={{
              padding: `${spacing['16']}px ${spacing['4']}px`,
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            {t('eventNew.empty.venues')}
          </div>
        ) : (
          venues.map((v) => (
            <BottomSheetOption
              key={v.id}
              label={v.name}
              hint={
                v.default_cost_per_player != null
                  ? `${v.default_cost_per_player.toLocaleString('ru-RU')} ₽ с игрока`
                  : v.address ?? undefined
              }
              active={form.venueId === v.id}
              onClick={() => {
                set('venueId', v.id);
                setVenueOpen(false);
              }}
            />
          ))
        )}
      </BottomSheet>
    </div>
  );
}
