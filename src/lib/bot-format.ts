import 'server-only';

// Общее форматирование текстов бота (личные карточки и анонсы в канал).
//
// Сервер живёт в UTC, поэтому дату и время события всегда форматируем в часовом
// поясе команды (`teams.timezone`). Пока пояс команды не известен — запасной.

export const FALLBACK_TIMEZONE = 'Europe/Moscow';

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('ru-RU', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimezone(tz: string | null | undefined): string {
  return tz && isValidTimezone(tz) ? tz : FALLBACK_TIMEZONE;
}

// «чт, 18 сентября · 21:00–22:30»
export function formatEventDateLine(
  startsIso: string,
  endsIso: string | null,
  timezone: string | null | undefined,
): string {
  const timeZone = resolveTimezone(timezone);
  const dateFmt = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    timeZone,
  });
  const timeFmt = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  });
  const starts = new Date(startsIso);
  const base = `${dateFmt.format(starts)} · ${timeFmt.format(starts)}`;
  return endsIso ? `${base}–${timeFmt.format(new Date(endsIso))}` : base;
}

export function formatRub(n: number): string {
  return n.toLocaleString('ru-RU');
}

// Экранирование пользовательского текста для parse_mode: 'HTML'.
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
