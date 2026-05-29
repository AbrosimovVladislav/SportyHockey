'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { BottomSheet } from '@/components/bottom-sheet';
import { MediaGrid } from '@/components/media-grid';
import { MediaViewer } from '@/components/media-viewer';
import { MediaUploadCard } from '@/components/media-upload-card';
import { DateRangeFilter } from '@/components/date-range-filter';
import { IconChevronDown } from '@/components/icons';
import {
  useTeamMedia,
  useDeleteTeamMedia,
  useUploadTeamMedia,
} from '@/hooks/use-team-media';
import { UploadError } from '@/hooks/use-upload-media';
import { useMe } from '@/hooks/use-me';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { ApiError } from '@/lib/api-client';
import { formatEventDateRange } from '@/lib/event-format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
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
  const upload = useUploadTeamMedia();

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  const handleDelete = (item: MediaItemDto) => {
    const teamItem = item as TeamMediaItemDto;
    if (typeof window !== 'undefined' && !window.confirm(t('media.viewer.deleteConfirm'))) return;
    remove.mutate({ mediaId: teamItem.id, eventId: teamItem.event?.id ?? null });
    const nextLen = items.length - 1;
    if (viewerIndex == null) return;
    if (nextLen <= 0) setViewerIndex(null);
    else if (viewerIndex >= nextLen) setViewerIndex(nextLen - 1);
  };

  const handleUpload = (files: File[]) => {
    setUploadError(null);
    upload.mutate(files, {
      onError: (e) =>
        setUploadError(
          e instanceof ApiError || e instanceof UploadError ? e.message : t('media.upload.error'),
        ),
    });
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
  const filterChip = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: active ? colors.primary : colors.textSecondary,
    background: 'transparent',
    border: 'none',
    padding: '6px 0',
    cursor: 'pointer',
  });

  const filterActive = Boolean(filters.from || filters.to);
  const filterLabel = filterChipLabel(filters, t);

  const renderViewerHeader = (idx: number) => {
    const item = items[idx];
    if (!item || !item.event) return null;
    const event = item.event;
    return (
      <EventHeaderPanel
        item={item}
        event={event}
        onClick={() => router.push(`/events/${event.id}`)}
        t={t}
      />
    );
  };

  return (
    <div style={root}>
      <LightHeader title={t('teamMedia.title')} onBack={onBack} />

      <div style={content}>
        <MediaUploadCard
          title={t('media.upload.title')}
          hint={t('media.upload.hint')}
          buttonLabel={t('media.upload.button')}
          busyLabel={t('media.upload.busy')}
          busy={upload.isPending}
          onFiles={handleUpload}
        />

        {uploadError ? (
          <div
            style={{
              ...typography.sm,
              color: colors.error,
              padding: `${spacing['8']}px ${spacing['12']}px`,
              background: colors.errorBg,
              borderRadius: radius.md,
            }}
          >
            {uploadError}
          </div>
        ) : null}

        <div style={listHeader}>
          <div style={listTitleRow}>
            <span style={listTitle}>{t('teamMedia.list.title')}</span>
            <span style={countPill}>{items.length}</span>
          </div>
          <button
            type="button"
            className="pressable"
            onClick={() => setFilterOpen(true)}
            style={filterChip(filterActive)}
          >
            {filterLabel}
            <IconChevronDown size={12} color={filterActive ? colors.primary : colors.textSecondary} />
          </button>
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
            {filterActive ? t('teamMedia.list.emptyFiltered') : t('teamMedia.list.empty')}
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

        <BottomSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title={t('teamMedia.filter.sheetTitle')}
        >
          <DateRangeFilter
            from={filters.from}
            to={filters.to}
            onChange={setFilters}
            fromLabel={t('teamMedia.filter.from')}
            toLabel={t('teamMedia.filter.to')}
            resetLabel={t('teamMedia.filter.reset')}
          />
        </BottomSheet>
      </div>
    </div>
  );
}

// Кликабельная панель в шапке просмотрщика: название события, дата/время, площадка.
// Тап ведёт на страницу события.
function EventHeaderPanel({
  event,
  onClick,
  t,
}: {
  item: TeamMediaItemDto;
  event: NonNullable<TeamMediaItemDto['event']>;
  onClick: () => void;
  t: (k: TKey) => string;
}) {
  const title =
    event.title && event.title.trim()
      ? event.title
      : event.type === 'game'
        ? t('teamMedia.eventTitle.game')
        : t('teamMedia.eventTitle.training');

  const dateRange = formatEventDateRange(event.starts_at, event.ends_at);
  const venueName = event.venue?.name ?? '';
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

// Краткое отображение диапазона в чипе фильтра: «От 27.05», «До 30.05»,
// «27.05 – 30.05» или нейтральный лейбл «Фильтр», если оба поля пустые.
function filterChipLabel(
  f: { from: string | null; to: string | null },
  t: (k: TKey) => string,
): string {
  if (!f.from && !f.to) return t('teamMedia.filter.chip');
  if (f.from && f.to) return `${shortDate(f.from)} – ${shortDate(f.to)}`;
  if (f.from) return `${t('teamMedia.filter.from')} ${shortDate(f.from)}`;
  return `${t('teamMedia.filter.to')} ${shortDate(f.to!)}`;
}

function shortDate(iso: string): string {
  // iso = YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}`;
}
