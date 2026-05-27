// Подстановка переменных в шаблон вида "Пришло {showed} из {total}".
export function interp(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

// Форматирование рублей с разрядами по российской локали (1 234).
export function formatRub(n: number): string {
  return n.toLocaleString('ru-RU');
}
