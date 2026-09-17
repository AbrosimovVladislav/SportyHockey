// Целевой путь deep-link'а, который должен пережить онбординг (итерация 70).
//
// Новичок жмёт «Записаться» под анонсом в канале → вступает в команду → сначала
// подтверждает профиль в онбординге → и только потом попадает на страницу события.
// Путь лежит в sessionStorage: выходы онбординга читают его (peek), а очищает
// layout табов — когда человек реально оказался внутри приложения.

const KEY = 'sh:next-path';

export function savePendingPath(path: string): void {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // приватный режим / хранилище недоступно — просто откроется главная
  }
}

// Только внутренние пути приложения; всё остальное игнорируем.
export function peekPendingPath(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v && v.startsWith('/') && !v.startsWith('//') ? v : null;
  } catch {
    return null;
  }
}

export function clearPendingPath(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // нечего чистить
  }
}
