'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DarkHeader } from '@/components/dark-header';
import { BackButton } from '@/components/back-button';
import { FilterChips } from '@/components/filter-chips';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Button } from '@/components/button';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { apiFetch, ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { CreateEventRequest, CreateEventResponse, EventType } from '@/types/api';

type FormState = {
  type: EventType;
  startsAt: string; // datetime-local
  endsAt: string;
  title: string;
  venue: string;
  cost: string;
  description: string;
};

const INITIAL_STATE: FormState = {
  type: 'training',
  startsAt: '',
  endsAt: '',
  title: '',
  venue: '',
  cost: '',
  description: '',
};

function localToIso(value: string): string {
  // datetime-local («2026-05-17T19:30») → ISO с локальным offset
  // new Date(value).toISOString() даёт UTC, бэк принимает Z (zod offset:true)
  return new Date(value).toISOString();
}

export default function EventNewPage() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  useTgHeader('#233F30');

  const me = useMe();
  const isOrganizer = useMemo(
    () => me.data?.memberships.some((m) => m.role === 'organizer') ?? false,
    [me.data],
  );

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me.data && !isOrganizer) {
      router.replace('/events');
    }
  }, [me.data, isOrganizer, router]);

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

  const onSubmit = () => {
    setError(null);

    if (!form.startsAt) {
      setError(t('eventNew.errors.startsAt'));
      return;
    }
    if (form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError(t('eventNew.errors.endsBeforeStart'));
      return;
    }

    const body: CreateEventRequest = {
      type: form.type,
      starts_at: localToIso(form.startsAt),
      ends_at: form.endsAt ? localToIso(form.endsAt) : null,
      title: form.title.trim() || undefined,
      venue_text: form.venue.trim() || undefined,
      cost_per_player: form.cost ? Number(form.cost) : undefined,
      description: form.description.trim() || undefined,
    };

    createEvent.mutate(body);
  };

  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 140px)`,
    padding: `${spacing['20']}px ${spacing['20']}px ${BOTTOM_NAV_HEIGHT + spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };

  const label: CSSProperties = {
    ...typography.smBold,
    color: colors.text,
    marginBottom: spacing['6'],
    display: 'block',
  };

  const field: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  };

  const typeOptions = [
    { id: 'training', label: t('eventNew.type.training') },
    { id: 'game', label: t('eventNew.type.game') },
  ];

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ background: colors.headerBg, minHeight: '100dvh' }}>
      <DarkHeader
        role={t('eventNew.role')}
        title={t('eventNew.title')}
        left={<BackButton ariaLabel={t('schedule.backLabel')} />}
      />

      <div style={sheet}>
        <div style={field}>
          <span style={label}>{t('eventNew.type.label')}</span>
          <FilterChips
            options={typeOptions}
            activeId={form.type}
            onChange={(id) => set('type', id as EventType)}
          />
        </div>

        <div style={field}>
          <span style={label}>{t('eventNew.startsAt.label')}</span>
          <Input
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => set('startsAt', e.currentTarget.value)}
          />
        </div>

        <div style={field}>
          <span style={label}>{t('eventNew.endsAt.label')}</span>
          <Input
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => set('endsAt', e.currentTarget.value)}
          />
        </div>

        <div style={field}>
          <span style={label}>{t('eventNew.title.label')}</span>
          <Input
            type="text"
            placeholder={t('eventNew.title.placeholder')}
            value={form.title}
            onChange={(e) => set('title', e.currentTarget.value)}
            maxLength={100}
          />
        </div>

        <div style={field}>
          <span style={label}>{t('eventNew.venue.label')}</span>
          <Input
            type="text"
            placeholder={t('eventNew.venue.placeholder')}
            value={form.venue}
            onChange={(e) => set('venue', e.currentTarget.value)}
            maxLength={200}
          />
        </div>

        <div style={field}>
          <span style={label}>{t('eventNew.cost.label')}</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            placeholder={t('eventNew.cost.placeholder')}
            value={form.cost}
            onChange={(e) => set('cost', e.currentTarget.value)}
          />
        </div>

        <div style={field}>
          <span style={label}>{t('eventNew.description.label')}</span>
          <Textarea
            placeholder={t('eventNew.description.placeholder')}
            value={form.description}
            onChange={(e) => set('description', e.currentTarget.value)}
            maxLength={2000}
          />
        </div>

        {error ? (
          <span style={{ ...typography.sm, color: colors.error }}>{error}</span>
        ) : null}

        <Button
          fullWidth
          size="lg"
          disabled={createEvent.isPending}
          onClick={onSubmit}
        >
          {createEvent.isPending ? t('eventNew.submitting') : t('eventNew.submit')}
        </Button>
      </div>
    </div>
  );
}
