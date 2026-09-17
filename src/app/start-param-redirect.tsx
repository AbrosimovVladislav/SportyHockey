'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { apiFetch } from '@/lib/api-client';
import { savePendingPath } from '@/lib/pending-path';
import { useActiveTeamStore } from '@/store/active-team';
import type { JoinAcceptResponse } from '@/types/api';

// Обрабатывает startapp-deeplink Mini App: ссылка вида https://t.me/<bot>?startapp=<param>,
// Telegram прокидывает строку через initData.start_param / tgWebAppStartParam.
//
//   join_<token>            — инвайт команды (итерация 41) → /join/<token>.
//   ev_<eventId>_<token>    — кнопка «Записаться» под анонсом в канале (итерация 70):
//                             участник попадает сразу на страницу события; новичок по
//                             дороге вступает в команду по invite-токену (идемпотентно).
//
// Остальные start_param (team_<id>, invite_<user_id>) обрабатывает бот.

const EVENT_PARAM_RE =
  /^ev_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([A-Za-z0-9]+)$/i;

function readStartParam(): string | null {
  try {
    const raw = retrieveLaunchParams().tgWebAppStartParam;
    return typeof raw === 'string' && raw.length > 0 ? raw : null;
  } catch {
    // вне Telegram retrieveLaunchParams бросает — игнорируем.
    return null;
  }
}

// Пока deep-link события обрабатывается, экраны не рендерим: иначе layout табов
// успеет увидеть «нет команды» и мигнёт онбордингом до того, как пройдёт вступление.
export function StartParamGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const setActiveTeamId = useActiveTeamStore((s) => s.setActiveTeamId);
  // Стартуем с false и включаем в эффекте: на сервере start_param недоступен,
  // а разный первый рендер на сервере и клиенте сломал бы гидрацию.
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const raw = readStartParam();
    if (!raw) return;

    if (raw.startsWith('join_')) {
      const token = raw.slice('join_'.length);
      if (token) router.replace(`/join/${encodeURIComponent(token)}`);
      return;
    }

    const m = EVENT_PARAM_RE.exec(raw);
    if (!m) return;
    const [, eventId, token] = m;
    const target = `/events/${eventId}`;
    setResolving(true);

    void (async () => {
      try {
        const res = await apiFetch<JoinAcceptResponse>(`/api/join/${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        setActiveTeamId(res.team_id);
        if (!res.already) await qc.invalidateQueries({ queryKey: ['me'] });
      } catch {
        // Токен устарел или сеть — всё равно ведём на событие: участник его увидит,
        // а не-участник получит обычное «событие не найдено».
      }
      savePendingPath(target);
      router.replace(target);
      setResolving(false);
    })();
    // Только один раз при инициализации Mini App.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return resolving ? null : <>{children}</>;
}
