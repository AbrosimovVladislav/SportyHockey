// Пустую строку трактуем как «очищено» → null.
export function normStr(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === '' ? null : t;
}

// Telegram-ник: принимаем «@nick», «nick» или ссылку «https://t.me/nick» — храним голый ник.
export function normTelegramUsername(v: string | null | undefined): string | null {
  const t = normStr(v);
  if (t == null) return null;
  let nick = t;
  const slash = nick.lastIndexOf('/');
  if (slash !== -1) nick = nick.slice(slash + 1); // из t.me/nick → nick
  if (nick.startsWith('@')) nick = nick.slice(1);
  nick = nick.trim();
  return nick === '' ? null : nick;
}
