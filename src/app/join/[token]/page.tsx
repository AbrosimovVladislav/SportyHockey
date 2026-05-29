'use client';

import { useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Avatar } from '@/components/avatar';
import { LightHeader } from '@/components/light-header';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { useJoinPreview, useAcceptInvite } from '@/hooks/use-join-by-token';
import { ApiError } from '@/lib/api-client';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

// Страница приёма инвайта по постоянному токену команды (итерация 41).
// Загружает превью (название, логотип), показывает большую карточку и
// одну кнопку — присоединиться. Если игрок уже в команде — кнопка ведёт на /squad.

export default function JoinByTokenPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  useTgHeader('#FFFFFF');

  const previewQ = useJoinPreview(token);
  const accept = useAcceptInvite(token);
  const [error, setError] = useState<string | null>(null);

  const team = previewQ.data?.team;
  const already = previewQ.data?.already ?? false;

  async function onAccept() {
    setError(null);
    try {
      await accept.mutateAsync();
      router.push('/squad');
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError(t('join.error'));
    }
  }

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bg,
    display: 'flex',
    flexDirection: 'column',
  };

  const content: CSSProperties = {
    padding: `${spacing['32']}px ${spacing['16']}px ${spacing['24']}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['24'],
    flex: 1,
  };

  if (previewQ.isLoading) {
    return (
      <div style={root}>
        <LightHeader title={t('join.title')} onBack={() => router.push('/')} />
        <div style={{ ...content, justifyContent: 'center' }}>
          <span style={{ color: colors.textSecondary }}>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (previewQ.error || !team) {
    return (
      <div style={root}>
        <LightHeader title={t('join.title')} onBack={() => router.push('/')} />
        <div style={{ ...content, justifyContent: 'center', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
            {t('join.notFound.title')}
          </h2>
          <p style={{ margin: 0, color: colors.textSecondary }}>
            {t('join.notFound.body')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={root}>
      <LightHeader title={t('join.title')} onBack={() => router.push('/')} />
      <div style={content}>
        <Avatar src={team.logo_url} name={team.name} size={96} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: 15 }}>
            {t('join.subtitle')}
          </p>
          <h1 style={{ margin: 0, marginTop: spacing['8'], fontSize: 24, fontWeight: 800 }}>
            {team.name}
          </h1>
        </div>
        {error ? <div style={errorLine}>{error}</div> : null}
        {already ? (
          <button
            type="button"
            className="pressable"
            onClick={() => router.push('/squad')}
            style={ctaButton}
          >
            {t('join.already.cta')}
          </button>
        ) : (
          <button
            type="button"
            className="pressable"
            onClick={() => void onAccept()}
            disabled={accept.isPending}
            style={ctaButton}
          >
            {t('join.cta')}
          </button>
        )}
        {already ? (
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>
            {t('join.already.title')}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const ctaButton: CSSProperties = {
  width: '100%',
  padding: `${spacing['16']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  border: 'none',
  background: colors.primary,
  color: colors.textInverse,
  fontSize: 16,
  fontWeight: 800,
  cursor: 'pointer',
};

const errorLine: CSSProperties = {
  fontSize: 13,
  color: colors.error,
  textAlign: 'center',
};
