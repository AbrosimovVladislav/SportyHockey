'use client';

import { retrieveRawInitData } from '@telegram-apps/sdk-react';

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
    throw new ApiError(res.status, text || res.statusText);
  }

  return (await res.json()) as T;
}
