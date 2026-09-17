'use client';

import { useEffect } from 'react';
import { requestWriteAccess, retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { useMe } from '@/hooks/use-me';
import { useSaveWriteAccess } from '@/hooks/use-write-access';

// Разрешение боту писать в личку (итерация 70).
//
// Кто открыл Mini App по ссылке из канала и ни разу не писал боту, личных сообщений
// от бота не получит — Telegram это запрещает. Лечится нативным окном
// «Разрешить боту писать вам?» (requestWriteAccess, Bot API 6.9+). Признак «уже
// разрешил» приходит в initData как user.allows_write_to_pm.
//
// Спрашиваем при первом открытии любым путём; при отказе — не чаще раза в 3 дня.

const STATE_KEY = 'sh:write-access'; // 'granted' — сервер уже знает, что разрешено
const ASKED_AT_KEY = 'sh:write-access-asked-at';
const RETRY_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
const ASK_DELAY_MS = 1200; // даём приложению отрисоваться и войти в fullscreen

function alreadyAllowed(): boolean {
  try {
    const user = retrieveLaunchParams().tgWebAppData?.user as
      | { allows_write_to_pm?: boolean; allowsWriteToPm?: boolean }
      | undefined;
    return user?.allows_write_to_pm === true || user?.allowsWriteToPm === true;
  } catch {
    return false; // вне Telegram
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // хранилище недоступно — спросим ещё раз в следующий заход
  }
}

export function WriteAccessPrompt() {
  const me = useMe();
  const save = useSaveWriteAccess();
  const ready = Boolean(me.data);

  useEffect(() => {
    if (!ready) return;

    if (alreadyAllowed()) {
      if (read(STATE_KEY) !== 'granted') {
        save.mutate(true, { onSuccess: () => write(STATE_KEY, 'granted') });
      }
      return;
    }

    const askedAt = Number(read(ASKED_AT_KEY) ?? 0);
    if (askedAt && Date.now() - askedAt < RETRY_AFTER_MS) return;

    const timer = window.setTimeout(() => {
      if (!requestWriteAccess.isAvailable()) return;
      write(ASKED_AT_KEY, String(Date.now()));
      requestWriteAccess()
        .then((status) => {
          const allowed = status === 'allowed';
          save.mutate(allowed, {
            onSuccess: () => {
              if (allowed) write(STATE_KEY, 'granted');
            },
          });
        })
        .catch(() => {
          // окно закрыли или метод недоступен — повторим по таймауту RETRY_AFTER_MS
        });
    }, ASK_DELAY_MS);
    return () => window.clearTimeout(timer);
    // Зависим только от ready: эффект срабатывает один раз, когда профиль загружен
    // (повторный запуск в StrictMode безопасен — таймер снимается в cleanup).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return null;
}
