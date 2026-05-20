'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { MediaUploadCard } from '@/components/media-upload-card';
import { MediaGrid } from '@/components/media-grid';
import { MediaViewer } from '@/components/media-viewer';
import { IconChevronDown } from '@/components/icons';
import { useEvent } from '@/hooks/use-event';
import { useEventMedia } from '@/hooks/use-event-media';
import { useUploadMedia, UploadError } from '@/hooks/use-upload-media';
import { useDeleteMedia } from '@/hooks/use-delete-media';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { ApiError } from '@/lib/api-client';
import { formatEventDateRange } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { MediaItemDto } from '@/types/api';

export default function EventMediaPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  useTgHeader('#FFFFFF');

  const me = useMe();
  const ev = useEvent(id);
  const media = useEventMedia(id);
  const upload = useUploadMedia(id);
  const remove = useDeleteMedia(id);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meId = me.data?.user.id ?? null;
  const isOrganizer = useMemo(() => {
    if (!ev.data || !me.data) return false;
    return me.data.memberships.some(
      (m) => m.team_id === ev.data!.team_id && m.role === 'organizer',
    );
  }, [ev.data, me.data]);

  const items: MediaItemDto[] = media.data?.items ?? [];

  const root: CSSProperties = {
    background: colors.bg,
    minHeight: '100dvh',
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };
  const content: CSSProperties = {
    padding: `${spacing['12']}px ${spacing['16']}px 0`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['16'],
  };
  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/events/${id}`);
  };

  if (ev.isLoading || !ev.data) {
    return (
      <div style={root}>
        <LightHeader title={t('media.title.training')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        </div>
      </div>
    );
  }
  if (ev.isError) {
    return (
      <div style={root}>
        <LightHeader title={t('media.title.training')} onBack={onBack} />
        <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
          <span style={{ ...typography.body, color: colors.error }}>
            {t('media.errors.notFound')}
          </span>
        </div>
      </div>
    );
  }

  const data = ev.data;
  const isGame = data.type === 'game';
  const title = isGame ? t('media.title.game') : t('media.title.training');
  const venueName = data.venue?.name ?? data.venue_text ?? '';
  const subtitleText = [
    formatEventDateRange(data.starts_at, data.ends_at),
    venueName,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleUpload = (files: File[]) => {
    setError(null);
    upload.mutate(files, {
      onError: (e) =>
        setError(
          e instanceof ApiError || e instanceof UploadError
            ? e.message
            : t('media.upload.error'),
        ),
    });
  };

  const handleDelete = (item: MediaItemDto) => {
    if (typeof window !== 'undefined' && !window.confirm(t('media.viewer.deleteConfirm'))) {
      return;
    }
    const nextLen = items.length - 1;
    remove.mutate(item.id);
    if (viewerIndex == null) return;
    if (nextLen <= 0) setViewerIndex(null);
    else if (viewerIndex >= nextLen) setViewerIndex(nextLen - 1);
  };

  const canDelete = (item: MediaItemDto) =>
    isOrganizer || (meId != null && item.uploaded_by?.id === meId);

  const listHeader: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  const listTitleRow: CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    gap: spacing['8'],
  };
  const listTitle: CSSProperties = {
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
  };
  const countPill: CSSProperties = {
    minWidth: 22,
    height: 22,
    padding: '0 8px',
    borderRadius: 11,
    background: colors.bgMuted,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontVariantNumeric: 'tabular-nums',
  };
  const sortChip: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: colors.textSecondary,
    background: 'transparent',
    border: 'none',
    padding: '6px 0',
    cursor: 'default',
  };

  return (
    <div style={root}>
      <LightHeader title={title} subtitle={subtitleText} onBack={onBack} />

      <div style={content}>
        <MediaUploadCard
          title={t('media.upload.title')}
          hint={t('media.upload.hint')}
          buttonLabel={t('media.upload.button')}
          busyLabel={t('media.upload.busy')}
          busy={upload.isPending}
          onFiles={handleUpload}
        />

        {error ? (
          <div
            style={{
              ...typography.sm,
              color: colors.error,
              padding: `${spacing['8']}px ${spacing['12']}px`,
              background: colors.errorBg,
              borderRadius: radius.md,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={listHeader}>
          <div style={listTitleRow}>
            <span style={listTitle}>{t('media.list.title')}</span>
            <span style={countPill}>{items.length}</span>
          </div>
          <span style={sortChip}>
            {t('media.list.sortNewest')}
            <IconChevronDown size={12} color={colors.textSecondary} />
          </span>
        </div>

        {media.isLoading ? (
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: `${spacing['24']}px 0`,
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: 13,
            }}
          >
            {t('media.list.empty')}
          </div>
        ) : (
          <MediaGrid items={items} onOpen={(i) => setViewerIndex(i)} />
        )}

        <MediaViewer
          open={viewerIndex !== null}
          items={items}
          index={viewerIndex ?? 0}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          canDelete={canDelete}
          onDelete={handleDelete}
          prevAriaLabel={t('media.viewer.prev')}
          nextAriaLabel={t('media.viewer.next')}
          closeAriaLabel={t('media.viewer.close')}
          deleteAriaLabel={t('media.viewer.delete')}
        />
      </div>
    </div>
  );
}
