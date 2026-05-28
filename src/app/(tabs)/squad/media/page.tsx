'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { MediaGrid } from '@/components/media-grid';
import { MediaViewer } from '@/components/media-viewer';
import { DateRangeFilter } from '@/components/date-range-filter';
import { useTeamMedia, useDeleteTeamMedia } from '@/hooks/use-team-media';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatEventDateRange } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { MediaItemDto, TeamMediaItemDto } from '@/types/api';

export default function TeamMediaPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#FFFFFF');

  const me = useMe();
  const [filters, setFilters] = useState<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  });
  const media = useTeamMedia(filters);
  const remove = useDeleteTeamMedia();

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const items: TeamMediaItemDto[] = media.data?.items ?? [];

  const meId = me.data?.user.id ?? null;
  const isOrganizer = useMemo(
    () => Boolean(me.data?.memberships.some((m) => m.role === 'organizer')),
    [me.data],
  );

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/squad');
  };

  const canDelete = (item: MediaItemDto): boolean =>
    isOrganizer || (meId != null && item.uploaded_by?.id === meId);

  // В MediaViewer items типизированы как MediaItemDto — на этом экране все элементы
  // фактически расширенный TeamMediaItemDto, поэтому достаём event.id из сужения.
  const handleDelete = (item: MediaItemDto) => {
    const teamItem = item as TeamMediaItemDto;
    if (typeof window !== 'undefined' && !window.confirm(t('media.viewer.deleteConfirm'))) return;
    remove.mutate({ mediaId: teamItem.id, eventId: teamItem.event.id });
    const nextLen = items.length - 1;
    if (viewerIndex == null) return;
    if (nextLen <= 0) setViewerIndex(null);
    else if (viewerIndex >= nextLen) setViewerIndex(nextLen - 1);
  };

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

  const renderViewerHeader = (idx: number) => {
    const item = items[idx];
    if (!item) return null;
    return <EventHeaderPanel item={item} onClick={() => router.push(`/events/${item.event.id}`)} t={t} />;
  };

  return (
    <div style={root}>
      <LightHeader title={t('teamMedia.title')} onBack={onBack} />

      <div style={content}>
        <DateRangeFilter
          from={filters.from}
          to={filters.to}
          onChange={setFilters}
          fromLabel={t('teamMedia.filter.from')}
          toLabel={t('teamMedia.filter.to')}
          resetLabel={t('teamMedia.filter.reset')}
        />

        <div style={listTitleRow}>
          <span style={listTitle}>{t('teamMedia.list.title')}</span>
          <span style={countPill}>{items.length}</span>
        </div>

        {media.isLoading ? (
          <span style={{ ...typography.body, color: colors.textSecondary }}>
            {t('common.loading')}
          </span>
        ) : media.isError ? (
          <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: `${spacing['24']}px 0`,
              textAlign: 'center',
              color: colors.textTertiary,
              fontSize: 13,
            }}
          >
            {filters.from || filters.to
              ? t('teamMedia.list.emptyFiltered')
              : t('teamMedia.list.empty')}
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
          renderHeader={renderViewerHeader}
          prevAriaLabel={t('media.viewer.prev')}
          nextAriaLabel={t('media.viewer.next')}
          closeAriaLabel={t('media.viewer.close')}
          deleteAriaLabel={t('media.viewer.delete')}
          shareAriaLabel={t('media.viewer.share')}
          shareErrorLabel={t('media.viewer.shareError')}
        />
      </div>
    </div>
  );
}

// Кликабельная панель в шапке просмотрщика: название события, дата/время, площадка.
// Тап ведёт на страницу события.
function EventHeaderPanel({
  item,
  onClick,
  t,
}: {
  item: TeamMediaItemDto;
  onClick: () => void;
  t: (k: TKey) => string;
}) {
  const title =
    item.event.title && item.event.title.trim()
      ? item.event.title
      : item.event.type === 'game'
        ? t('teamMedia.eventTitle.game')
        : t('teamMedia.eventTitle.training');

  const dateRange = formatEventDateRange(item.event.starts_at, item.event.ends_at);
  const venueName = item.event.venue?.name ?? '';
  const secondLine = [dateRange, venueName].filter(Boolean).join(' · ');

  const btn: CSSProperties = {
    border: 'none',
    background: 'rgba(0,0,0,0.55)',
    color: colors.textInverse,
    borderRadius: 12,
    padding: '8px 14px',
    cursor: 'pointer',
    textAlign: 'center',
    maxWidth: '100%',
  };
  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.25,
    color: colors.textInverse,
  };
  const subStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    lineHeight: 1.3,
  };

  return (
    <button type="button" className="pressable" onClick={onClick} style={btn}>
      <div style={titleStyle}>{title}</div>
      {secondLine ? <div style={subStyle}>{secondLine}</div> : null}
    </button>
  );
}
