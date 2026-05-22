'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VenueSelectSheet } from '@/components/venue-select-sheet';
import { CardField } from '@/components/card-field';
import { TypeChips } from '@/components/type-chips';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Button } from '@/components/button';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import {
  IconBack,
  IconCalendar,
  IconClock,
  IconStopwatch,
  IconWhistle,
  IconStick,
  IconLocation,
  IconSparkle,
} from '@/components/icons';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useT } from '@/hooks/use-t';
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

type FormState = {
  type: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationStr: string; // HH:mm
  venueId: string | null;
  details: string;
  arenaCost: string;
  arenaTouched: boolean;
  cost: string;
  costTouched: boolean;
  opponent: string;
};

const INITIAL_DURATION = '01:30';

const INITIAL_STATE: FormState = {
  type: 'training',
  date: '',
  time: '',
  durationStr: INITIAL_DURATION,
  venueId: null,
  details: '',
  arenaCost: '',
  arenaTouched: false,
  cost: '',
  costTouched: false,
  opponent: '',
};

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

function RubInput({ value, onChange }: { value: string; onChange: (raw: string) => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value.replace(/[^\d]/g, ''))}
        placeholder="0"
        style={{
          background: colors.bg,
          border: `1px solid ${colors.divider}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          paddingRight: 36,
          fontSize: 17,
          fontWeight: 600,
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: spacing['16'],
          top: '50%',
          transform: 'translateY(-50%)',
          color: colors.textSecondary,
          fontSize: 16,
          fontWeight: 500,
          pointerEvents: 'none',
        }}
      >
        ₽
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    margin: `${spacing['16']}px 0 ${spacing['8']}px`,
    letterSpacing: '0.01em',
  };
  return <div style={style}>{children}</div>;
}

function LightHeader({
  title,
  onBack,
  backLabel,
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
}) {
  // 3 колонки: back (40) / title (центр) / spacer (40) — title всегда строго по центру
  const wrap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: colors.bg,
    position: 'sticky',
    top: 0,
    zIndex: 5,
    minHeight: 56,
  };
  const backBtn: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: colors.bgMuted,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };
  const titleStyle: CSSProperties = {
    fontSize: 17,
    fontWeight: 700,
    margin: 0,
    color: colors.text,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  return (
    <header style={wrap}>
      <button
        type="button"
        className="pressable"
        onClick={onBack}
        style={backBtn}
        aria-label={backLabel}
      >
        <IconBack size={20} color={colors.text} />
      </button>
      <h1 style={titleStyle}>{title}</h1>
      <span aria-hidden />
    </header>
  );
}

export default function EventNewPage() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();

  const { isOrganizer, isLoading: meLoading } = useIsOrganizer();
  const venuesQuery = useVenues();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [venueOpen, setVenueOpen] = useState(false);

  useEffect(() => {
    if (!meLoading && !isOrganizer) {
      router.replace('/events');
    }
  }, [meLoading, isOrganizer, router]);

  const venues: VenueDto[] = useMemo(() => venuesQuery.data?.venues ?? [], [venuesQuery.data]);

  // Автовыбор первой площадки, если в команде ровно одна.
  useEffect(() => {
    if (form.venueId !== null) return;
    if (venues.length === 1) {
      setForm((prev) => ({ ...prev, venueId: venues[0].id }));
    }
  }, [venues, form.venueId]);

  const selectedVenue = useMemo<VenueDto | null>(
    () => venues.find((v) => v.id === form.venueId) ?? null,
    [venues, form.venueId],
  );

  // Подставляем дефолтную стоимость из арены, если юзер ещё не правил поле.
  useEffect(() => {
    if (form.costTouched) return;
    if (selectedVenue?.default_cost_per_player != null) {
      setForm((prev) => ({ ...prev, cost: String(selectedVenue.default_cost_per_player) }));
    }
  }, [selectedVenue, form.costTouched]);

  // Аналогично для оплаты арене.
  useEffect(() => {
    if (form.arenaTouched) return;
    if (selectedVenue?.cost_per_arena != null) {
      setForm((prev) => ({ ...prev, arenaCost: String(selectedVenue.cost_per_arena) }));
    }
  }, [selectedVenue, form.arenaTouched]);

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

  const onBack = () => {
    if (window.history.length > 1) router.back();
    else router.push('/events');
  };

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
    const duration = durationStrToMinutes(form.durationStr);
    if (duration <= 0) {
      setError(t('eventNew.errors.duration'));
      return;
    }

    const costNum = form.cost.trim() ? Number(form.cost) : NaN;
    const arenaNum = form.arenaCost.trim() ? Number(form.arenaCost) : NaN;

    const body: CreateEventRequest = {
      type: form.type,
      starts_at: combineDateTime(form.date, form.time),
      duration_minutes: duration,
      venue_id: form.venueId,
      title: form.details.trim() || undefined,
      cost_per_player: Number.isFinite(costNum) && costNum >= 0 ? costNum : undefined,
      arena_cost: Number.isFinite(arenaNum) && arenaNum >= 0 ? arenaNum : undefined,
      opponent_name:
        form.type === 'game' && form.opponent.trim() ? form.opponent.trim() : undefined,
    };
    createEvent.mutate(body);
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

  const dateDisplay = form.date ? formatLongDateLocal(form.date) : '';
  const durationDisplay = formatDurationDisplay(form.durationStr);

  const submitDisabled =
    createEvent.isPending ||
    !form.date ||
    !form.time ||
    !form.venueId ||
    durationStrToMinutes(form.durationStr) <= 0;

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
  };

  const content: CSSProperties = {
    padding: `0 ${spacing['16']}px ${BOTTOM_NAV_HEIGHT + spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <div style={root}>
      <LightHeader title={t('eventNew.title')} onBack={onBack} backLabel={t('common.back')} />

      <div style={content}>
        <SectionLabel>{t('eventNew.sections.type')}</SectionLabel>
        <TypeChips
          options={typeOptions}
          activeId={form.type}
          onChange={(id) => set('type', id as EventType)}
        />

        <SectionLabel>{t('eventNew.sections.schedule')}</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <div style={{ position: 'relative' }}>
            <CardField
              icon={<IconCalendar size={20} color={colors.iconFg} />}
              label={t('eventNew.fields.date')}
              value={dateDisplay}
              placeholder={t('eventNew.fields.datePlaceholder')}
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
                value={form.time}
                placeholder={t('eventNew.fields.timePlaceholder')}
                showChevron={false}
              />
              <HiddenNativeInput
                type="time"
                value={form.time}
                onChange={(v) => set('time', v)}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <CardField
                icon={<IconStopwatch size={20} color={colors.iconFg} />}
                label={t('eventNew.fields.duration')}
                value={durationDisplay}
                placeholder={t('eventNew.fields.timePlaceholder')}
                showChevron={false}
              />
              <HiddenNativeInput
                type="time"
                value={form.durationStr}
                onChange={(v) => set('durationStr', v)}
                step={300}
              />
            </div>
          </div>
        </div>

        {form.type === 'game' ? (
          <>
            <SectionLabel>{t('eventNew.sections.opponent')}</SectionLabel>
            <Input
              type="text"
              value={form.opponent}
              onChange={(e) => set('opponent', e.currentTarget.value)}
              placeholder={t('eventNew.fields.opponent.placeholder')}
              maxLength={100}
              style={{
                background: colors.bg,
                border: `1px solid ${colors.divider}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                fontSize: 17,
                fontWeight: 600,
              }}
            />
          </>
        ) : null}

        <SectionLabel>{t('eventNew.sections.details')}</SectionLabel>
        <Textarea
          placeholder={t('eventNew.fields.details.placeholder')}
          value={form.details}
          onChange={(e) => set('details', e.currentTarget.value)}
          maxLength={2000}
          rows={3}
          style={{
            background: colors.bg,
            border: `1px solid ${colors.divider}`,
            minHeight: 88,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        />

        <SectionLabel>{t('eventNew.sections.venue')}</SectionLabel>
        <CardField
          icon={<IconLocation size={20} color={colors.iconFg} />}
          label={t('eventNew.sections.venue')}
          value={selectedVenue?.name ?? ''}
          placeholder={t('eventNew.fields.venue.placeholder')}
          onClick={() => setVenueOpen(true)}
        />

        <SectionLabel>{t('eventNew.sections.arenaCost')}</SectionLabel>
        <RubInput
          value={form.arenaCost}
          onChange={(raw) => setForm((prev) => ({ ...prev, arenaCost: raw, arenaTouched: true }))}
        />

        <SectionLabel>{t('eventNew.sections.cost')}</SectionLabel>
        <RubInput
          value={form.cost}
          onChange={(raw) => setForm((prev) => ({ ...prev, cost: raw, costTouched: true }))}
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

        <Button
          fullWidth
          size="lg"
          disabled={submitDisabled}
          onClick={onSubmit}
          style={{ background: colors.headerBg, marginTop: spacing['24'] }}
        >
          <IconSparkle size={18} color={colors.textInverse} />
          {createEvent.isPending ? t('eventNew.submitting') : t('eventNew.submit')}
        </Button>
      </div>

      <VenueSelectSheet
        open={venueOpen}
        onClose={() => setVenueOpen(false)}
        venues={venues}
        activeId={form.venueId}
        onSelect={(id) => set('venueId', id)}
      />
    </div>
  );
}
