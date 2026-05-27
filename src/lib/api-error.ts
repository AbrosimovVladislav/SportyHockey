import 'server-only';
import { NextResponse } from 'next/server';
import { AuthError } from '@/lib/auth';

/**
 * Единый разбор ошибок серверных роутов.
 *
 * AuthError → её статус (401/403) и сообщение. Любая другая ошибка → 500.
 *
 * На этапе MVP намеренно отдаём текст причины наружу: так на стенде сразу видно,
 * что сломалось, и можно быстро чинить. Полную ошибку дополнительно логируем.
 */
export function handleRouteError(e: unknown): Response {
  if (e instanceof AuthError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error('[api] unhandled error:', e);
  const message = e instanceof Error ? e.message : 'Внутренняя ошибка сервера';
  return NextResponse.json({ error: message }, { status: 500 });
}
