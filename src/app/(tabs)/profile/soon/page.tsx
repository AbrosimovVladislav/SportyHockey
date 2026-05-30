'use client';

import { Suspense, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';

// Универсальная заглушка для пунктов профиля до их реальной реализации
// (итерации 44–46). Принимает ?title=... — короткий ключ из i18n или
// напрямую готовую строку, чтобы заголовок шапки совпадал с лейблом пункта.
function SoonContent() {
  const t = useT();
  const router = useRouter();
  const sp = useSearchParams();
  useTgHeader(colors.bg);

  const titleKey = sp.get('title') ?? 'myProfile.soon.title';
  const title = isMyProfileKey(titleKey) ? t(titleKey) : titleKey;

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['12'],
    padding: `${spacing['32']}px ${spacing['16']}px`,
    margin: spacing['16'],
    background: colors.bgWarm,
    borderRadius: radius.lg,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 200px)`,
  };

  return (
    <div style={root}>
      <LightHeader title={title} onBack={() => router.push('/profile')} />
      <div style={wrap}>
        <span style={{ ...typography.bodyBold, color: colors.text }}>
          {t('myProfile.soon.heading')}
        </span>
        <span
          style={{
            ...typography.body,
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          {t('myProfile.soon.body')}
        </span>
      </div>
    </div>
  );
}

export default function SoonPage() {
  return (
    <Suspense>
      <SoonContent />
    </Suspense>
  );
}

// Защита: принимаем только заранее известные `myProfile.*` ключи в качестве
// title, чтобы случайно не передать произвольное значение в TKey-протокол.
function isMyProfileKey(key: string): key is TKey {
  return key.startsWith('myProfile.');
}
