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

// Заглушка для подэкранов раздела «Деньги» (срез / балансы / операции /
// аналитика) до их реализации в итерациях 51–54. Принимает ?title=<i18n-ключ>
// или произвольную строку, чтобы заголовок шапки совпадал с лейблом пункта,
// с которого попали.
function MoneySoonContent() {
  const t = useT();
  const router = useRouter();
  const sp = useSearchParams();
  useTgHeader(colors.bg);

  const titleParam = sp.get('title');
  const title = titleParam && isMoneyKey(titleParam) ? t(titleParam) : titleParam ?? t('money.soon.title');

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
      <LightHeader title={title} onBack={() => router.push('/money')} />
      <div style={wrap}>
        <span style={{ ...typography.bodyBold, color: colors.text }}>
          {t('money.soon.heading')}
        </span>
        <span
          style={{
            ...typography.body,
            color: colors.textSecondary,
            textAlign: 'center',
            maxWidth: 320,
          }}
        >
          {t('money.soon.body')}
        </span>
      </div>
    </div>
  );
}

export default function MoneySoonPage() {
  return (
    <Suspense>
      <MoneySoonContent />
    </Suspense>
  );
}

function isMoneyKey(key: string): key is TKey {
  return key.startsWith('money.');
}
