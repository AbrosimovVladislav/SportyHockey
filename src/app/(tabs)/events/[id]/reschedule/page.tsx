'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { CardField } from '@/components/card-field';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
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
import { useMe } from '@/hooks/use-me';
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
  title: string;
  description: string;
};

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 2000;

export default function EventReschedulePage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#FFFFFF');

  const me = useMe();
  const ev = useEvent(id);
  const venuesQuery = useVenues();
  const update = useUpdateEvent(id);

  const data = ev.data;
  const isOrganizer = useMemo(() => {
    if (!data || !me.data) return false;
    return me.data.memberships.some(
      (m) => m.team_id === data.team_id && m.role === 'organizer',
    );
  }, [data, me.data]);

  const initialForm = useMemo<FormState | null>(() => {
    if (!data) return null;
    return {
      date: toLocalDate(data.starts_at),
      time: toLocalTime(data.starts_at),
      durationStr: minutesToDurationStr(durationMinutes(data.starts_at, data.ends_at)),
      venueId: data.venue?.id ?? null,
      title: data.title ?? '',
      description: data.description ?? '',
    };
  }, [data]);

  const [form, setForm] = useState<FormState | null>(null);
  const [venueOpen, setVenueOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialForm && !form) setForm(initialForm);
  }, [initialForm, form]);

  useEffect(() => {
    if (data && me.data && !isOrganizer) {
      router.replace(`/events/${id}`);
    }
  }, [data, me.data, isOrganizer, id, router]);

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
  const venueName = data.venue?.name ?? data.venue_text ?? null;

  const notifyCount = data.attendees.filter(
    (a) => a.vote === 'going' || a.vote === 'maybe',
  ).length;
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
  const titleTrimmed = form.title.trim();
  const descriptionTrimmed = form.description.trim();
  const initialTitleTrimmed = initialForm!.title.trim();
  const initialDescriptionTrimmed = initialForm!.description.trim();
  const scheduleChanged =
    form.date !== initialForm!.date ||
    form.time !== initialForm!.time ||
    durationMins !== initialMins;
  const venueChanged = form.venueId !== initialForm!.venueId;
  const titleChanged = titleTrimmed !== initialTitleTrimmed;
  const descriptionChanged = descriptionTrimmed !== initialDescriptionTrimmed;
  const changed = scheduleChanged || venueChanged || titleChanged || descriptionChanged;

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
    if (titleChanged) {
      body.title = titleTrimmed ? titleTrimmed : null;
    }
    if (descriptionChanged) {
      body.description = descriptionTrimmed ? descriptionTrimmed : null;
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
            value={form.title}
            onChange={(e) =>
              setField('title', e.currentTarget.value.slice(0, TITLE_LIMIT))
            }
            placeholder={t('reschedule.fields.eventTitle.placeholder')}
            maxLength={TITLE_LIMIT}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.divider}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              fontSize: 17,
              fontWeight: 600,
            }}
          />
        </div>

        <div>
          <div style={fieldLabel}>{t('reschedule.fields.description')}</div>
          <Textarea
            value={form.description}
            onChange={(e) =>
              setField('description', e.currentTarget.value.slice(0, DESCRIPTION_LIMIT))
            }
            placeholder={t('reschedule.fields.description.placeholder')}
            maxLength={DESCRIPTION_LIMIT}
            rows={3}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.divider}`,
              minHeight: 88,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          />
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
          venues.map((v) => {
            const hintParts: string[] = [];
            if (v.cost_per_arena != null) {
              hintParts.push(`${v.cost_per_arena.toLocaleString('ru-RU')} ₽ аренда`);
            }
            if (v.default_cost_per_player != null) {
              hintParts.push(`${v.default_cost_per_player.toLocaleString('ru-RU')} ₽ с игрока`);
            }
            const hint = hintParts.length > 0 ? hintParts.join(' · ') : v.address ?? undefined;
            return (
              <BottomSheetOption
                key={v.id}
                label={v.name}
                hint={hint}
                active={form.venueId === v.id}
                onClick={() => {
                  setField('venueId', v.id);
                  setVenueOpen(false);
                }}
              />
            );
          })
        )}
      </BottomSheet>
    </div>
  );
}

function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
