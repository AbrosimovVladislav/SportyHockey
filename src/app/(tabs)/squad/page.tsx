'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/components/screen';
import { Card } from '@/components/card';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { FAB } from '@/components/fab';
import { EmptyState } from '@/components/empty-state';
import { PlayerRow } from '@/components/player-row';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { IconChevronRight } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerPosition, TeamMember } from '@/types/api';

type TabId = 'list' | 'lines' | 'sides';
type FilterId = 'all' | PlayerPosition;
type SortId = 'name' | 'number';

export default function SquadPage() {
  const t = useT();
  const router = useRouter();
  const q = useTeamMembers();
  const { isOrganizer } = useIsOrganizer();
  const [tab, setTab] = useState<TabId>('list');
  const [filter, setFilter] = useState<FilterId>('all');
  const [sort, setSort] = useState<SortId>('name');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const tabs = [
    { id: 'list', label: t('squad.tabs.list') },
    { id: 'lines', label: t('squad.tabs.lines') },
    { id: 'sides', label: t('squad.tabs.sides') },
  ];

  const members = q.data?.members ?? [];

  const visible = useMemo<TeamMember[]>(() => {
    const filtered = filter === 'all' ? members : members.filter((m) => m.position === filter);
    return [...filtered].sort((a, b) => sortMembers(a, b, sort));
  }, [members, filter, sort]);

  const teamTitle = q.data?.team.name ?? t('squad.title');

  return (
    <Screen title={teamTitle}>
      <ContentTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'list' ? (
        <ListView
          q={q}
          visible={visible}
          membersTotal={members.length}
          filter={filter}
          setFilter={setFilter}
          sort={sort}
          setSortSheetOpen={setSortSheetOpen}
          router={router}
          t={t}
        />
      ) : tab === 'lines' ? (
        <SoonStub
          title={t('squad.tabs.lines.soonTitle')}
          description={t('squad.tabs.lines.soonDescription')}
        />
      ) : (
        <SoonStub
          title={t('squad.tabs.sides.soonTitle')}
          description={t('squad.tabs.sides.soonDescription')}
        />
      )}

      {isOrganizer && tab === 'list' ? (
        <FAB
          variant="dark"
          ariaLabel={t('squad.fabLabel')}
          onClick={() => router.push('/squad/new')}
        />
      ) : null}

      <BottomSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title={t('squad.sort.title')}
      >
        {sortOptionList(t).map((o) => (
          <BottomSheetOption
            key={o.id}
            label={o.label}
            active={sort === o.id}
            onClick={() => {
              setSort(o.id);
              setSortSheetOpen(false);
            }}
          />
        ))}
      </BottomSheet>
    </Screen>
  );
}

type ListViewProps = {
  q: ReturnType<typeof useTeamMembers>;
  visible: TeamMember[];
  membersTotal: number;
  filter: FilterId;
  setFilter: (id: FilterId) => void;
  sort: SortId;
  setSortSheetOpen: (open: boolean) => void;
  router: ReturnType<typeof useRouter>;
  t: (k: TKey) => string;
};

function ListView({
  q,
  visible,
  membersTotal,
  filter,
  setFilter,
  sort,
  setSortSheetOpen,
  router,
  t,
}: ListViewProps) {
  if (q.isLoading) {
    return (
      <span style={{ ...typography.body, color: colors.textSecondary }}>
        {t('common.loading')}
      </span>
    );
  }
  if (q.error || !q.data) {
    return <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>;
  }

  const filterOptions = [
    { id: 'all', label: t('squad.filters.all') },
    { id: 'forward', label: t('squad.filters.forward') },
    { id: 'defender', label: t('squad.filters.defender') },
    { id: 'goalie', label: t('squad.filters.goalie') },
  ];
  const sortOptions = sortOptionList(t);
  const sortLabel = sortOptions.find((o) => o.id === sort)?.label ?? '';

  return (
    <>
      <FilterChips
        options={filterOptions}
        activeId={filter}
        onChange={(id) => setFilter(id as FilterId)}
      />

      {visible.length === 0 ? (
        <EmptyState title={membersTotal === 0 ? t('squad.empty') : t('squad.emptyFiltered')} />
      ) : (
        <>
          <SortBar
            count={visible.length}
            sortLabel={sortLabel}
            onSortClick={() => setSortSheetOpen(true)}
          />
          <Card variant="surface" padding={0}>
            {visible.map((m, i) => (
              <PlayerRow
                key={m.user_id}
                name={formatName(m)}
                subtitle={subtitleFor(m, t)}
                photoUrl={m.avatar_url ?? m.photo_url}
                onClick={() => router.push(`/squad/${m.user_id}`)}
                right={<IconChevronRight size={18} color={colors.textTertiary} />}
                isLast={i === visible.length - 1}
              />
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function SoonStub({ title, description }: { title: string; description: string }) {
  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: `${spacing['40']}px ${spacing['16']}px`,
    gap: spacing['8'],
  };
  return (
    <div style={wrap}>
      <span style={{ ...typography.h3, color: colors.text }}>{title}</span>
      <span style={{ ...typography.body, color: colors.textSecondary, maxWidth: 320 }}>
        {description}
      </span>
    </div>
  );
}

function SortBar({
  count,
  sortLabel,
  onSortClick,
}: {
  count: number;
  sortLabel: string;
  onSortClick: () => void;
}) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing['12']}px ${spacing['4']}px ${spacing['8']}px`,
  };
  const countStyle: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
  };
  const btn: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['4'],
    padding: `${spacing['6']}px ${spacing['10']}px`,
    background: 'transparent',
    color: colors.text,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  };
  return (
    <div style={wrap}>
      <span style={countStyle}>{count}</span>
      <button type="button" className="pressable" onClick={onSortClick} style={btn}>
        {sortLabel}
        <IconChevronRight size={16} color={colors.text} />
      </button>
    </div>
  );
}

function sortOptionList(t: (k: TKey) => string): { id: SortId; label: string }[] {
  return [
    { id: 'name', label: t('squad.sort.name') },
    { id: 'number', label: t('squad.sort.number') },
  ];
}

function subtitleFor(m: TeamMember, t: (k: TKey) => string): string | undefined {
  const parts: string[] = [];
  if (m.jersey_number != null) parts.push(`#${m.jersey_number}`);
  if (m.position) parts.push(positionLabel(t, m.position));
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function positionLabel(t: (k: TKey) => string, pos: PlayerPosition): string {
  if (pos === 'forward') return t('squad.position.forward');
  if (pos === 'defender') return t('squad.position.defender');
  return t('squad.position.goalie');
}

function sortMembers(a: TeamMember, b: TeamMember, sort: SortId): number {
  if (sort === 'number') {
    const an = a.jersey_number;
    const bn = b.jersey_number;
    if (an == null && bn == null) return compareNames(a, b);
    if (an == null) return 1;
    if (bn == null) return -1;
    return an - bn || compareNames(a, b);
  }
  return compareNames(a, b);
}

function compareNames(a: TeamMember, b: TeamMember): number {
  return formatName(a).localeCompare(formatName(b), 'ru');
}
