'use client';

import { retrieveRawInitData } from '@telegram-apps/sdk-react';
import { getActiveTeamIdSnapshot } from '@/store/active-team';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let initData = '';
  try {
    initData = retrieveRawInitData() ?? '';
  } catch {
    // вне Telegram — initData пустой; сервер вернёт 401
  }

  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const baseHeaders: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' };

  const activeTeamId = getActiveTeamIdSnapshot();
  if (activeTeamId) baseHeaders['X-Team-Id'] = activeTeamId;

  const res = await fetch(path, {
    ...init,
    headers: {
      ...baseHeaders,
      ...init?.headers,
      Authorization: `tma ${initData}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, extractErrorMessage(text, res.statusText));
  }

  return (await res.json()) as T;
}

// Сервер всегда отдаёт ошибки как `{ error: '…' }`. Старый код возвращал
// клиенту сырое тело — пользователю в bottomsheet попадала строка вида
// `{"error":"…"}`. Парсим JSON и достаём поле; на не-JSON остаёмся на тексте.
function extractErrorMessage(text: string, fallback: string): string {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      const err = (parsed as { error: unknown }).error;
      if (typeof err === 'string' && err) return err;
    }
  } catch {
    // не-JSON ответ — оставляем как есть.
  }
  return text;
}

export async function apiFetchBlob(path: string, init?: RequestInit): Promise<Blob> {
  let initData = '';
  try {
    initData = retrieveRawInitData() ?? '';
  } catch {
    // вне Telegram — initData пустой; сервер вернёт 401
  }

  const activeTeamId = getActiveTeamIdSnapshot();
  const extraHeaders: Record<string, string> = activeTeamId
    ? { 'X-Team-Id': activeTeamId }
    : {};

  const res = await fetch(path, {
    ...init,
    headers: {
      ...extraHeaders,
      ...init?.headers,
      Authorization: `tma ${initData}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, extractErrorMessage(text, res.statusText));
  }

  return await res.blob();
}
