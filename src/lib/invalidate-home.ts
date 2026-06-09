import type { QueryClient } from '@tanstack/react-query';

// Хелпер для синхронизации главной (v0.6, итерация 66.1). На главной висят
// три зависящих от server-state ключа:
//   • ['next-event']       — ближайшее событие + going_count / seats_left;
//   • ['home-actions']     — last_past_event / last_past_game / pending_requests;
//   • ['dashboard-stats']  — top_players / last_game / team_summary (включая balance).
//
// Любая мутация, которая может изменить эти разрезы (голосование, отметка явки,
// создание / отмена / удаление события, добавление гола или штрафа, изменение
// финансов, обработка заявок), вызывает `invalidateHome(qc)` в `onSuccess` /
// `onSettled`. Так после действия — возврат на главную, и цифры свежие, без
// перезагрузки приложения.
//
// Параметр `flags` опциональный — если для конкретной мутации точно известно,
// что какой-то из ключей не двигается, его можно отключить (минимум сетевых
// запросов). По умолчанию инвалидируем все три.
export function invalidateHome(
  qc: QueryClient,
  flags?: { nextEvent?: boolean; homeActions?: boolean; dashboardStats?: boolean },
): void {
  const f = { nextEvent: true, homeActions: true, dashboardStats: true, ...flags };
  if (f.nextEvent) qc.invalidateQueries({ queryKey: ['next-event'] });
  if (f.homeActions) qc.invalidateQueries({ queryKey: ['home-actions'] });
  if (f.dashboardStats) qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
}
