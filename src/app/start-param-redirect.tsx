'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

// Обрабатывает startapp-deeplink (итерация 41 — инвайты команды).
// Если Mini App запущен ссылкой вида https://t.me/<bot>?startapp=join_<token>,
// Telegram прокидывает строку через initData.start_param. Здесь — один раз
// при монтировании — проверяем префикс и переходим на /join/<token>.
//
// Все остальные start_param (включая team_<id> и invite_<user_id>) обрабатывает
// бот — он шлёт игроку обычное сообщение/кнопку, а сам Mini App не редиректит.
export function StartParamRedirect() {
  const router = useRouter();
  useEffect(() => {
    try {
      const params = retrieveLaunchParams();
      const raw = params.tgWebAppStartParam;
      if (typeof raw !== 'string' || raw.length === 0) return;
      if (!raw.startsWith('join_')) return;
      const token = raw.slice('join_'.length);
      if (!token) return;
      router.replace(`/join/${encodeURIComponent(token)}`);
    } catch {
      // вне Telegram retrieveLaunchParams бросает — игнорируем.
    }
    // Только один раз при инициализации Mini App.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
