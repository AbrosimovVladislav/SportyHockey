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

  const today: EventDto[] = [];
  const week: EventDto[] = [];
  const later: EventDto[] = [];

  for (const ev of events) {
    const t = new Date(ev.starts_at).getTime();
    if (t < todayStart.getTime()) continue;
    if (t < tomorrowStart.getTime()) today.push(ev);
    else if (t < weekEnd.getTime()) week.push(ev);
    else later.push(ev);
  }

  return { today, week, later };
}
