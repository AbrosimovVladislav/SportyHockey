import type { EventDto } from '@/types/api';

const timeFmt = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const todayFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  weekday: 'short',
});

const weekDayFmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });

const dateRangeFmt = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
});

const longDateFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

// «17 мая 2026»
export function formatLongDate(iso: string): string {
  const parts = longDateFmt.formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')} ${get('month')} ${get('year')}`;
}

// «17 мая 2026» — из строки YYYY-MM-DD (локальное время, без UTC-сдвига)
export function formatLongDateLocal(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  const parts = longDateFmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')} ${get('month')} ${get('year')}`;
}

// YYYY-MM-DD + HH:mm → ISO в локальном часовом поясе
export function combineDateTime(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, (m ?? 1) - 1, d, h ?? 0, min ?? 0, 0, 0).toISOString();
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatTodaySubtitle(date: Date): string {
  // «24 мая, сб»
  const parts = todayFmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')} ${get('month')}, ${get('weekday')}`;
}

// «сб 24 мая • 19:30–21:00» либо «сб 24 мая • 19:30» если ends_at пуст
export function formatEventDateRange(startsIso: string, endsIso?: string | null): string {
  const start = new Date(startsIso);
  const parts = dateRangeFmt.formatToParts(start);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday').replace('.', '');
  const datePart = `${weekday} ${get('day')} ${get('month')}`;
  const startTime = formatTime(startsIso);
  if (!endsIso) return `${datePart} • ${startTime}`;
  return `${datePart} • ${startTime}–${formatTime(endsIso)}`;
}

export function formatWeekDate(iso: string): { date: string; day: string } {
  const d = new Date(iso);
  return {
    date: String(d.getDate()),
    day: weekDayFmt.format(d).replace('.', ''),
  };
}

type GroupedEvents = {
  today: EventDto[];
  week: EventDto[];
  later: EventDto[];
  completed: EventDto[];
};

// Возвращает диапазон [startOfDay, startOfNextDay) для переданной даты.
function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

// Считаем «эту неделю» как остаток текущей ISO-недели (пн–вс):
// все события до ближайшего воскресенья 23:59:59 включительно, исключая «сегодня».
function endOfThisWeek(now: Date): Date {
  const day = now.getDay(); // 0=вс, 1=пн … 6=сб
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const end = startOfDay(now);
  end.setDate(end.getDate() + daysUntilSunday + 1); // эксклюзивная граница = пн следующей недели 00:00
  return end;
}

export function groupEvents(events: EventDto[], now: Date = new Date()): GroupedEvents {
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekEnd = endOfThisWeek(now);
  const nowTs = now.getTime();

  const today: EventDto[] = [];
  const week: EventDto[] = [];
  const later: EventDto[] = [];
  const completed: EventDto[] = [];

  for (const ev of events) {
    const startsTs = new Date(ev.starts_at).getTime();
    const endsTs = ev.ends_at ? new Date(ev.ends_at).getTime() : startsTs;
    if (ev.status === 'completed' || endsTs < nowTs) {
      completed.push(ev);
      continue;
    }
    if (startsTs < tomorrowStart.getTime()) today.push(ev);
    else if (startsTs < weekEnd.getTime()) week.push(ev);
    else later.push(ev);
  }

  completed.sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
  );

  return { today, week, later, completed };
}
