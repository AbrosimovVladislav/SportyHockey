type NamedPerson = {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

export function formatName(p: NamedPerson, fallback = '—'): string {
  const parts = [p.first_name, p.last_name].filter((v): v is string => Boolean(v));
  const joined = parts.join(' ').trim();
  return joined || p.username || fallback;
}
