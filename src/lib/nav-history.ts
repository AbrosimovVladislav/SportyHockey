// Навигация «Назад» внутри Mini App.
//
// window.history.length в WebView Telegram ненадёжен: он бывает > 1 уже на первом
// экране, и тогда router.back() при прямом входе (deep-link «Записаться», перезагрузка,
// редирект через replace) просто ничего не делал. Поэтому сами ведём стек экранов
// сессии: «назад» по истории — только если мы видели, как пользователь сюда пришёл
// изнутри приложения; иначе — переход на логического родителя экрана.
//
// Ошибка определения всегда в безопасную сторону: вместо history.back() уйдём на родителя.

type BackRouter = { back: () => void; replace: (href: string) => void };

let stack: string[] = [];
let pos = -1;
let lastLength = 0;
let popped = false;

// Вызывается при каждой смене pathname (см. NavigationTracker).
export function trackNavigation(pathname: string): void {
  if (typeof window === 'undefined') return;
  const length = window.history.length;

  if (pos < 0) {
    stack = [pathname];
    pos = 0;
  } else if (popped) {
    // Системное «назад/вперёд»: сверяемся со своим стеком.
    if (stack[pos - 1] === pathname) pos -= 1;
    else if (stack[pos + 1] === pathname) pos += 1;
    else stack[pos] = pathname;
  } else if (length > lastLength) {
    // push: история выросла.
    stack = [...stack.slice(0, pos + 1), pathname];
    pos += 1;
  } else {
    // replace (или push, который не увеличил историю) — считаем заменой текущего экрана.
    stack[pos] = pathname;
  }
  popped = false;
  lastLength = length;
}

export function markPopState(): void {
  popped = true;
}

export function goBackOr(router: BackRouter, fallback: string): void {
  if (pos > 0) router.back();
  else router.replace(fallback);
}
