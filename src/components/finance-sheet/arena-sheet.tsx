'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { VenueSelectSheet } from '@/components/venue-select-sheet';
import { IconSearch, IconCalendar, IconLocation } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { eventLabel } from '@/lib/event-label';
import { formatEventDateRange } from '@/lib/event-format';
import { formatMoney } from '@/lib/format-money';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { EventDto, VenueDto } from '@/types/api';

// Bottomsheet для ввода/правки аренды льда (v0.5, итерации 51 + 51.1 + 58).
// Аренда в ledger-формате — это transfer team → venue. Возможны два режима:
//   • привязка к событию: venue вычисляется из event.venue, заблокирован;
//   • депозит площадке: событие не выбрано, venue выбирается свободно.
// На сервере отказ с 409, если оплата события превысит arena_cost — здесь
// зеркалим эту проверку локально для лучшей подсказки.
//
// Sheet открывается из трёх мест:
//   - quick-action «Аренда» на хабе `/money` (mode='create' без initial)
//   - кнопка «Оплатить аренду» на странице события `/events/[id]` (mode='create' + initial)
//   - тап по карточке аренды в `/money/transactions` (mode='edit' + initial с id)

export type ArenaInitial = {
  // Если задан — это режим редактирования существующей транзакции.
  // Если null — это create-с-предзаполнением (со страницы события).
  id?: string;
  event_id: string | null;
  amount: number | null;
  occurred_on: string; // YYYY-MM-DD
  description: string | null; // название площадки (для матча в picker'е по имени)
};

export type ArenaFormValue = {
  // null — депозит площадке без привязки к событию.
  event_id: string | null;
  // Площадка обязательна всегда — либо из выбранного события, либо вручную.
  venue_id: string;
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
  venues: VenueDto[];
  // Текущая касса команды (on_hand). Используем для подсказки и блокировки
  // сохранения, если сумма аренды превышает доступный остаток. Если не
  // передано — подсказку не показываем (например, баланс ещё грузится).
  availableOnHand?: number | null;
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
  venues,
  availableOnHand,
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
  const [venueId, setVenueId] = useState<string | null>(null);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [venuePickerOpen, setVenuePickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Наполняем поля при открытии. initial может быть либо edit-транзакцией,
  // либо create-prefill'ом со страницы события (без id, но с event_id).
  // venueId резолвится из description: ищем площадку с таким именем в справочнике.
  // Если в БД лежит старая «свободная» запись без матча — venueId остаётся null,
  // и пользователь обязан перевыбрать площадку перед сохранением.
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setEventId(initial.event_id);
      setAmount(initial.amount != null ? String(initial.amount) : '');
      setDate(initial.occurred_on);
      setVenueId(matchVenueByName(initial.description, venues));
    } else {
      setEventId(null);
      setAmount('');
      setDate(todayIso());
      setVenueId(null);
    }
    setEventPickerOpen(false);
    setVenuePickerOpen(false);
    setConfirmOpen(false);
    setLocalError(null);
  }, [open, initial, venues]);

  const selectedEvent = useMemo(
    () => (eventId ? events.find((e) => e.id === eventId) ?? null : null),
    [eventId, events],
  );
  const selectedVenue = useMemo(
    () => (venueId ? venues.find((v) => v.id === venueId) ?? null : null),
    [venueId, venues],
  );

  // При смене события в picker'е перезаполняем venue/amount из нового. Дату
  // оплаты НЕ трогаем: занимающийся бухгалтерией пользователь ставит «дату
  // оплаты», а не «дату события» — это сегодняшний день, а не дата матча.
  // Выбор «Без события» (id=null) переводит sheet в режим депозита: venue
  // не сбрасываем (если уже выбран — оставляем), amount тоже остаётся как был.
  const handlePickEvent = (id: string | null) => {
    setEventPickerOpen(false);
    setEventId(id);
    if (id === null) return;
    const e = events.find((x) => x.id === id);
    if (!e) return;
    setVenueId(e.venue?.id ?? null);
    setAmount(e.arena_cost != null ? String(e.arena_cost) : '');
  };

  // Максимальная сумма аренды с учётом текущей кассы. Расход уменьшает кассу
  // только если дата ≤ сегодня (будущие платежи в on_hand не лезут). При
  // редактировании старый вклад этой же транзакции уже «сидит» в кассе — после
  // правки он откатывается и заменяется новым, поэтому к лимиту добавляем
  // старую сумму, если она тоже была сегодняшней или прошлой.
  const today = todayIso();
  const oldImpact =
    isEdit && initial?.id && initial.amount != null && initial.occurred_on <= today
      ? Number(initial.amount)
      : 0;
  const counts = date <= today;
  const maxAmount =
    availableOnHand != null && counts ? availableOnHand + oldImpact : null;

  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const overLimit = maxAmount != null && validAmount && parsedAmount > maxAmount;
  const shortfall = overLimit && maxAmount != null ? parsedAmount - maxAmount : 0;

  // Зеркало серверной 409 на переплату события. Если событие выбрано и у него
  // есть arena_cost > 0 — суммарная оплата (текущая в БД минус oldImpact, если
  // редактируем эту же запись) + введённая сумма не должна превышать стоимость.
  const eventArenaCost = selectedEvent?.arena_cost ?? 0;
  const eventArenaPaid = selectedEvent?.arena_paid_amount ?? 0;
  // При edit'е существующая транзакция уже учтена в arena_paid_amount события,
  // вычитаем её, чтобы не сравнивать с самой собой. На странице события (новая
  // запись с initial.id=undefined) вычитать нечего.
  const ownContribution = isEdit && initial?.id ? Number(initial.amount ?? 0) : 0;
  const eventRemaining =
    selectedEvent && eventArenaCost > 0
      ? Math.max(0, eventArenaCost - (eventArenaPaid - ownContribution))
      : null;
  const overEvent =
    eventRemaining != null && validAmount && parsedAmount > eventRemaining;
  const eventOverflowAmount =
    overEvent && eventRemaining != null ? parsedAmount - eventRemaining : 0;

  const submit = () => {
    setLocalError(null);
    if (!venueId || !selectedVenue) {
      setLocalError(t('money.sheet.arena.errorEmptyVenue'));
      return;
    }
    if (!validAmount) {
      setLocalError(t('money.sheet.arena.errorEmptyAmount'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setLocalError(t('money.sheet.arena.errorBadDate'));
      return;
    }
    if (overLimit && maxAmount != null) {
      setLocalError(
        t('money.sheet.arena.errorInsufficient').replace(
          '{available}',
          formatMoney(Math.max(0, maxAmount)),
        ),
      );
      return;
    }
    if (overEvent) {
      setLocalError(t('money.sheet.arena.errorEventOverpaid'));
      return;
    }
    onSubmit({
      event_id: eventId,
      venue_id: venueId,
      amount: parsedAmount,
      occurred_on: date,
      description: selectedVenue.name,
    });
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
    setConfirmOpen(false);
  };

  // Дата в будущем — показываем баннер про запланированную аренду.
  const isFutureDate = date > todayIso();

  // Когда событие выбрано — venue вычисляется из него и блокируется. В режиме
  // депозита venue свободно выбирается. Это исключает рассинхрон «выбрано
  // событие на площадке А, но в venue стоит площадка Б».
  const venueLocked = !!eventId;

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

  const lockedBtn: CSSProperties = {
    ...selectBtn,
    cursor: 'default',
    opacity: 0.85,
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
          {/* Событие — опциональное. Если не выбрано, sheet работает в режиме
              депозита площадке (venue выбирается ниже свободно). */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.arena.eventLabel')}</div>
            <button
              type="button"
              className="pressable"
              style={selectBtn}
              onClick={() => setEventPickerOpen(true)}
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
                <span style={placeholderText}>
                  {t('money.sheet.arena.eventPlaceholderDeposit')}
                </span>
              )}
            </button>
          </div>

          {/* Площадка. Когда событие выбрано — берётся из event.venue и
              блокируется. В режиме депозита — picker открывается по тапу. */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.arena.venueLabel')}</div>
            <button
              type="button"
              className={venueLocked ? undefined : 'pressable'}
              style={venueLocked ? lockedBtn : selectBtn}
              onClick={() => {
                if (venueLocked) return;
                setVenuePickerOpen(true);
              }}
              aria-disabled={venueLocked}
            >
              <IconLocation size={18} color={colors.iconFg} />
              {selectedVenue ? (
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
                    {selectedVenue.name}
                  </span>
                  {selectedVenue.address ? (
                    <span style={{ fontSize: 12, color: colors.textSecondary }}>
                      {selectedVenue.address}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span style={placeholderText}>{t('money.sheet.arena.venuePlaceholder')}</span>
              )}
            </button>
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
            {overEvent && eventRemaining != null ? (
              <div
                style={{
                  marginTop: spacing['6'],
                  fontSize: 12,
                  fontWeight: 500,
                  color: colors.error,
                }}
              >
                {t('money.sheet.arena.eventOverpaidHint')
                  .replace('{overflow}', formatMoney(eventOverflowAmount))
                  .replace('{remaining}', formatMoney(eventRemaining))}
              </div>
            ) : maxAmount != null ? (
              <div
                style={{
                  marginTop: spacing['6'],
                  fontSize: 12,
                  fontWeight: 500,
                  color: overLimit ? colors.error : colors.textSecondary,
                }}
              >
                {overLimit
                  ? t('money.sheet.arena.shortfall').replace(
                      '{amount}',
                      formatMoney(shortfall),
                    )
                  : t('money.sheet.arena.availableOnHand').replace(
                      '{amount}',
                      formatMoney(Math.max(0, maxAmount)),
                    )}
              </div>
            ) : null}
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
        open={eventPickerOpen}
        events={events}
        currentId={eventId}
        searchPlaceholder={t('money.sheet.arena.eventSearch')}
        emptyText={t('money.sheet.arena.eventEmpty')}
        title={t('money.sheet.arena.eventLabel')}
        depositLabel={t('money.sheet.arena.eventDeposit')}
        statusLabels={{
          paid: t('money.sheet.arena.eventStatus.paid'),
          unpaid: t('money.sheet.arena.eventStatus.unpaid'),
        }}
        onPick={handlePickEvent}
        onClose={() => setEventPickerOpen(false)}
      />

      <VenueSelectSheet
        open={venuePickerOpen}
        onClose={() => setVenuePickerOpen(false)}
        venues={venues}
        activeId={venueId}
        onSelect={(id) => setVenueId(id)}
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
// Вложенный picker событий — список с поиском по названию и площадке.
// События сортируются по starts_at desc. У каждой строки виден чип статуса
// оплаты аренды: зелёный «Оплачено», серый «Не оплачено», ничего — если
// arena_cost не задан (нет цены, нечего оплачивать).
// Первой строкой всегда «Без события — депозит площадке» — это переключение
// sheet'а в режим депозита.
// ─────────────────────────────────────────────────────────────────────────────

type PickerProps = {
  open: boolean;
  title: string;
  events: EventDto[];
  currentId: string | null;
  searchPlaceholder: string;
  emptyText: string;
  depositLabel: string;
  statusLabels: { paid: string; unpaid: string };
  onPick: (id: string | null) => void;
  onClose: () => void;
};

function EventPicker({
  open,
  title,
  events,
  currentId,
  searchPlaceholder,
  emptyText,
  depositLabel,
  statusLabels,
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

  const depositActive = currentId === null;

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
      {/* Опция «депозит» всегда видна — даже при поиске. Она не «выбирает
          событие», а явно отказывается от привязки. */}
      <button
        type="button"
        className="pressable"
        style={row(depositActive)}
        onClick={() => onPick(null)}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: depositActive ? colors.primary : colors.bgMuted,
            color: depositActive ? colors.textInverse : colors.iconFg,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden
        >
          <IconLocation size={18} color="currentColor" />
        </span>
        <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{depositLabel}</span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '55dvh', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: spacing['16'], color: colors.textSecondary, fontSize: 14 }}>
            {emptyText}
          </div>
        ) : (
          filtered.map((e) => {
            const active = e.id === currentId;
            const status = paymentStatus(e);
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
                {status !== 'none' ? <StatusChip status={status} labels={statusLabels} /> : null}
              </button>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
}

// Маленький чип статуса оплаты аренды для строки события в picker'е.
function StatusChip({
  status,
  labels,
}: {
  status: 'paid' | 'unpaid';
  labels: { paid: string; unpaid: string };
}) {
  const bg = status === 'paid' ? colors.successBg : colors.bgMuted;
  const fg = status === 'paid' ? colors.successDark : colors.textSecondary;
  const css: CSSProperties = {
    padding: `${spacing['2']}px ${spacing['8']}px`,
    borderRadius: radius.pill,
    background: bg,
    color: fg,
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  };
  return <span style={css}>{status === 'paid' ? labels.paid : labels.unpaid}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type EventPaymentStatus = 'paid' | 'unpaid' | 'none';

function paymentStatus(e: EventDto): EventPaymentStatus {
  const cost = e.arena_cost ?? 0;
  if (cost <= 0) return 'none';
  return e.arena_paid_amount >= cost ? 'paid' : 'unpaid';
}

function matchVenueByName(name: string | null, venues: VenueDto[]): string | null {
  if (!name) return null;
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return null;
  const hit = venues.find((v) => v.name.trim().toLowerCase() === trimmed);
  return hit?.id ?? null;
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
