'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { IconSearch, IconCalendar, IconLocation } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { eventLabel } from '@/lib/event-label';
import { formatEventDateRange } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { EventDto } from '@/types/api';

// Bottomsheet для ввода/правки аренды льда. Аренда всегда привязана к событию —
// в `finance_transactions` это запись type='expense', category='arena', с
// обязательным event_id. Поле "площадка" — это `description` транзакции
// (отдельной колонки venue_id у транзакций нет на v0.5).
//
// Sheet открывается из двух мест:
//   - quick-action «Аренда» на хабе `/money` (mode='create' без initial)
//   - кнопка «Оплатить аренду» на странице события `/events/[id]` (mode='create' с initial,
//     поля заполнены из выбранного события)
// Из ленты `/money/transactions` тап по арена-карточке открывает sheet в mode='edit'.

export type ArenaInitial = {
  // Если задан — это режим редактирования существующей транзакции.
  // Если null — это create-с-предзаполнением (из страницы события).
  id?: string;
  event_id: string | null;
  amount: number | null;
  occurred_on: string; // YYYY-MM-DD
  description: string | null; // название площадки
};

export type ArenaFormValue = {
  event_id: string;
  amount: number;
  occurred_on: string;
  description: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial: ArenaInitial | null;
  events: EventDto[];
  onSubmit: (value: ArenaFormValue) => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string | null;
};

export function ArenaSheet({
  open,
  onClose,
  mode,
  initial,
  events,
  onSubmit,
  onDelete,
  isSaving,
  isDeleting,
  error,
}: Props) {
  const t = useT();
  const isEdit = mode === 'edit';

  const [eventId, setEventId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(todayIso());
  const [venue, setVenue] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Наполняем поля при открытии. initial может быть либо edit-транзакцией,
  // либо create-prefill'ом со страницы события (без id, но с event_id).
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setEventId(initial.event_id);
      setAmount(initial.amount != null ? String(initial.amount) : '');
      setDate(initial.occurred_on);
      setVenue(initial.description ?? '');
    } else {
      setEventId(null);
      setAmount('');
      setDate(todayIso());
      setVenue('');
    }
    setPickerOpen(false);
    setConfirmOpen(false);
    setLocalError(null);
  }, [open, initial]);

  const selectedEvent = useMemo(
    () => (eventId ? events.find((e) => e.id === eventId) ?? null : null),
    [eventId, events],
  );

  // При смене события в picker'е перезаполняем venue/amount/date из нового.
  // Простой паттерн: overwrite — пользователь может откорректировать руками.
  // Не дёргается на первом open (initial-эффект выше пишет всё за раз).
  const handlePickEvent = (id: string) => {
    setPickerOpen(false);
    setEventId(id);
    const e = events.find((x) => x.id === id);
    if (!e) return;
    setVenue(e.venue?.name ?? '');
    setAmount(e.arena_cost != null ? String(e.arena_cost) : '');
    setDate(isoFromDateTime(e.starts_at));
  };

  const submit = () => {
    setLocalError(null);
    if (!eventId) {
      setLocalError(t('money.sheet.arena.errorEmptyEvent'));
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setLocalError(t('money.sheet.arena.errorEmptyAmount'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setLocalError(t('money.sheet.arena.errorBadDate'));
      return;
    }
    onSubmit({
      event_id: eventId,
      amount: n,
      occurred_on: date,
      description: venue.trim() ? venue.trim() : null,
    });
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
    setConfirmOpen(false);
  };

  // Дата в будущем — показываем баннер про «попадёт в Аренды этого месяца».
  const isFutureDate = date > todayIso();

  const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: spacing['6'],
  };

  const fieldBlock: CSSProperties = { marginBottom: spacing['12'] };

  const selectBtn: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: colors.bgMuted,
    border: 'none',
    borderRadius: radius.md,
    width: '100%',
    minHeight: 48,
    cursor: 'pointer',
    color: colors.text,
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'left',
  };

  const placeholderText: CSSProperties = {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: 500,
  };

  const errorBox: CSSProperties = {
    fontSize: 13,
    color: colors.error,
    background: colors.errorBg,
    padding: `${spacing['8']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    marginBottom: spacing['12'],
  };

  const noticeBox: CSSProperties = {
    fontSize: 13,
    color: colors.warning,
    background: colors.warningBg,
    padding: `${spacing['8']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    marginBottom: spacing['12'],
  };

  const finalError = error ?? localError;

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={isEdit ? t('money.sheet.arena.editTitle') : t('money.sheet.arena.createTitle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Событие */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.arena.eventLabel')}</div>
            <button
              type="button"
              className="pressable"
              style={selectBtn}
              onClick={() => setPickerOpen(true)}
            >
              <IconCalendar size={18} color={colors.iconFg} />
              {selectedEvent ? (
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}
                  >
                    {eventLabel(selectedEvent)}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textSecondary }}>
                    {formatEventDateRange(selectedEvent.starts_at, selectedEvent.ends_at)}
                  </span>
                </span>
              ) : (
                <span style={placeholderText}>{t('money.sheet.arena.eventPlaceholder')}</span>
              )}
            </button>
          </div>

          {/* Площадка (название) */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.arena.venueLabel')}</div>
            <Input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.currentTarget.value)}
              placeholder={t('money.sheet.arena.venuePlaceholder')}
              maxLength={200}
            />
          </div>

          {/* Сумма */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.arena.amountLabel')}</div>
            <div style={{ position: 'relative' }}>
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value.replace(/[^\d]/g, ''))}
                placeholder="0"
                style={{
                  background: colors.bg,
                  border: `1.5px solid ${colors.error}`,
                  paddingRight: 36,
                  fontSize: 22,
                  fontWeight: 700,
                  color: colors.error,
                }}
              />
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: spacing['16'],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.error,
                  fontSize: 18,
                  fontWeight: 600,
                  pointerEvents: 'none',
                }}
              >
                ₽
              </span>
            </div>
          </div>

          {/* Дата */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.arena.dateLabel')}</div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
            />
          </div>

          {isFutureDate ? (
            <div style={noticeBox}>{t('money.sheet.arena.futureDateHint')}</div>
          ) : null}

          {finalError ? <div style={errorBox}>{finalError}</div> : null}

          <div style={{ display: 'flex', gap: spacing['8'], marginTop: spacing['8'] }}>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              {t('money.sheet.arena.cancel')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={submit}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? t('money.sheet.arena.saving') : t('money.sheet.arena.save')}
            </Button>
          </div>

          {isEdit && onDelete ? (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => setConfirmOpen(true)}
              disabled={isSaving || isDeleting}
              style={{ color: colors.error, marginTop: spacing['8'] }}
            >
              {isDeleting ? t('money.sheet.arena.deleting') : t('money.sheet.arena.delete')}
            </Button>
          ) : null}
        </div>
      </BottomSheet>

      <EventPicker
        open={pickerOpen}
        events={events}
        currentId={eventId}
        searchPlaceholder={t('money.sheet.arena.eventSearch')}
        emptyText={t('money.sheet.arena.eventEmpty')}
        title={t('money.sheet.arena.eventLabel')}
        onPick={handlePickEvent}
        onClose={() => setPickerOpen(false)}
      />

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('money.sheet.arena.deleteConfirmTitle')}
      >
        <div style={{ fontSize: 14, color: colors.textSecondary, marginBottom: spacing['16'] }}>
          {t('money.sheet.arena.deleteConfirmBody')}
        </div>
        <div style={{ display: 'flex', gap: spacing['8'] }}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => setConfirmOpen(false)}
            disabled={isDeleting}
          >
            {t('money.sheet.arena.cancel')}
          </Button>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting
              ? t('money.sheet.arena.deleting')
              : t('money.sheet.arena.deleteConfirmCta')}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Вложенный picker событий — список с поиском по названию и сопернику.
// События сортируются по starts_at desc (последние сверху).
// ─────────────────────────────────────────────────────────────────────────────

type PickerProps = {
  open: boolean;
  title: string;
  events: EventDto[];
  currentId: string | null;
  searchPlaceholder: string;
  emptyText: string;
  onPick: (id: string) => void;
  onClose: () => void;
};

function EventPicker({
  open,
  title,
  events,
  currentId,
  searchPlaceholder,
  emptyText,
  onPick,
  onClose,
}: PickerProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const sorted = useMemo(
    () =>
      events
        .slice()
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()),
    [events],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((e) => {
      const lbl = eventLabel(e).toLowerCase();
      const venue = (e.venue?.name ?? '').toLowerCase();
      return lbl.includes(q) || venue.includes(q);
    });
  }, [sorted, query]);

  const row = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: active ? colors.primaryLight : 'transparent',
    border: 'none',
    borderRadius: radius.md,
    width: '100%',
    minHeight: 56,
    cursor: 'pointer',
    color: active ? colors.primary : colors.text,
    fontSize: 15,
    fontWeight: active ? 700 : 500,
    textAlign: 'left',
  });

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div style={{ position: 'relative', marginBottom: spacing['8'] }}>
        <IconSearch
          size={18}
          color={colors.textSecondary}
          style={{
            position: 'absolute',
            left: spacing['12'],
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder={searchPlaceholder}
          style={{ paddingLeft: 38 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '55dvh', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: spacing['16'], color: colors.textSecondary, fontSize: 14 }}>
            {emptyText}
          </div>
        ) : (
          filtered.map((e) => {
            const active = e.id === currentId;
            return (
              <button
                key={e.id}
                type="button"
                className="pressable"
                style={row(active)}
                onClick={() => onPick(e.id)}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: active ? colors.primary : colors.bgMuted,
                    color: active ? colors.textInverse : colors.iconFg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  <IconLocation size={18} color="currentColor" />
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}
                  >
                    {eventLabel(e)}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: active ? colors.primary : colors.textSecondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatEventDateRange(e.starts_at, e.ends_at)}
                    {e.venue?.name ? ` · ${e.venue.name}` : ''}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Из ISO-строки события достаём день в локальном времени (YYYY-MM-DD).
function isoFromDateTime(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
