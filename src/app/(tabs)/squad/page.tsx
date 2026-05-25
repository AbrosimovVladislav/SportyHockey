'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { SearchInput } from '@/components/search-input';
import { SectionHeader } from '@/components/section-header';
import { PlayerRow } from '@/components/player-row';
import { AttendanceRing } from '@/components/attendance-ring';
import { EmptyState } from '@/components/empty-state';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { IconPlus, IconChevronDown } from '@/components/icons';
import { SquadLinesTab } from './lines-tab';
import { SquadSidesTab } from './sides-tab';
import { useT } from '@/hooks/use-t';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerPosition, TeamMember } from '@/types/api';

type TabId = 'list' | 'lines' | 'sides';
type FilterId = 'all' | PlayerPosition;
type SortId = 'attendance' | 'name' | 'number';

export default function SquadPage() {
  const t = useT();
  const q = useTeamMembers();
  const { isOrganizer } = useIsOrganizer();
  const [tab, setTab] = useState<TabId>('list');
  const [filter, setFilter] = useState<FilterId>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortId>('attendance');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const members = q.data?.members ?? [];

  const tabs = [
    { id: 'list', label: t('squad.tabs.list') },
    { id: 'lines', label: t('squad.tabs.lines') },
    { id: 'sides', label: t('squad.tabs.sides') },
  ];

  const counts = useMemo(
    () => ({
      all: members.length,
      forward: members.filter((m) => m.position === 'forward').length,
      defender: members.filter((m) => m.position === 'defender').length,
      goalie: members.filter((m) => m.position === 'goalie').length,
    }),
    [members],
  );

  const groups = useMemo(() => {
    const byFilter = filter === 'all' ? members : members.filter((m) => m.position === filter);
    const query = search.trim().toLowerCase();
    const searched = query
      ? byFilter.filter((m) => formatName(m).toLowerCase().includes(query))
      : byFilter;
    const sorted = [...searched].sort((a, b) => sortMembers(a, b, sort));
    return {
      main: sorted.filter((m) => m.tier === 'main'),
      reserve: sorted.filter((m) => m.tier === 'reserve'),
      total: searched.length,
    };
  }, [members, filter, search, sort]);

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bg,
    color: colors.text,
    paddingBottom: spacing['32'] + BOTTOM_NAV_HEIGHT,
  };

  const searchRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
    padding: `${spacing['12']}px ${spacing['16']}px`,
  };

  return (
    <div style={root}>
      <LightHeader
        title={t('squad.title')}
        right={
          isOrganizer ? (
            <AddButton label={t('squad.fabLabel')} onClick={() => alert(t('squad.soon.add'))} />
          ) : undefined
        }
      />

      <ContentTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />

      {tab === 'list' ? (
        <ListView
          q={q}
          groups={groups}
          counts={counts}
          membersTotal={members.length}
          filter={filter}
          setFilter={setFilter}
          search={search}
          setSearch={setSearch}
          sort={sort}
          setSortSheetOpen={setSortSheetOpen}
          searchRow={searchRow}
          onSelect={() => alert(t('squad.soon.profile'))}
          t={t}
        />
      ) : tab === 'lines' ? (
        <SquadLinesTab members={members} canEdit={isOrganizer} />
      ) : (
        <SquadSidesTab members={members} canEdit={isOrganizer} />
      )}

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
    </div>
  );
}

type Groups = { main: TeamMember[]; reserve: TeamMember[]; total: number };
type Counts = { all: number; forward: number; defender: number; goalie: number };

type ListViewProps = {
  q: ReturnType<typeof useTeamMembers>;
  groups: Groups;
  counts: Counts;
  membersTotal: number;
  filter: FilterId;
  setFilter: (id: FilterId) => void;
  search: string;
  setSearch: (v: string) => void;
  sort: SortId;
  setSortSheetOpen: (open: boolean) => void;
  searchRow: CSSProperties;
  onSelect: (userId: string) => void;
  t: (k: TKey) => string;
};

function ListView({
  q,
  groups,
  counts,
  membersTotal,
  filter,
  setFilter,
  search,
  setSearch,
  sort,
  setSortSheetOpen,
  searchRow,
  onSelect,
  t,
}: ListViewProps) {
  if (q.isLoading) {
    return <StatusText text={t('common.loading')} color={colors.textSecondary} />;
  }
  if (q.error || !q.data) {
    return <StatusText text={t('common.error')} color={colors.error} />;
  }

  const filterOptions = [
    { id: 'all', label: t('squad.filters.all'), count: counts.all },
    { id: 'forward', label: t('squad.filters.forward'), count: counts.forward },
    { id: 'defender', label: t('squad.filters.defender'), count: counts.defender },
    { id: 'goalie', label: t('squad.filters.goalie'), count: counts.goalie },
  ];

  return (
    <>
      <FilterChips
        options={filterOptions}
        activeId={filter}
        onChange={(id) => setFilter(id as FilterId)}
      />

      <div style={searchRow}>
        <SearchInput value={search} onChange={setSearch} placeholder={t('squad.search.placeholder')} />
        <SortButton label={sortButtonLabel(t, sort)} onClick={() => setSortSheetOpen(true)} />
      </div>

      {groups.total === 0 ? (
        <EmptyState title={membersTotal === 0 ? t('squad.empty') : t('squad.emptyFiltered')} />
      ) : (
        <>
          {groups.main.length > 0 ? (
            <Group title={t('squad.group.main')} members={groups.main} onSelect={onSelect} t={t} />
          ) : null}
          {groups.reserve.length > 0 ? (
            <Group
              title={t('squad.group.reserve')}
              members={groups.reserve}
              onSelect={onSelect}
              t={t}
            />
          ) : null}
        </>
      )}
    </>
  );
}

function Group({
  title,
  members,
  onSelect,
  t,
}: {
  title: string;
  members: TeamMember[];
  onSelect: (userId: string) => void;
  t: (k: TKey) => string;
}) {
  return (
    <div>
      <SectionHeader title={title} variant="group" />
      {members.map((m, i) => (
        <PlayerRow
          key={m.user_id}
          name={formatName(m)}
          subtitle={subtitleFor(m, t)}
          photoUrl={m.avatar_url ?? m.photo_url}
          onClick={() => onSelect(m.user_id)}
          right={<AttendanceRing rate={m.attendance_rate} />}
          isLast={i === members.length - 1}
        />
      ))}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  const btn: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: colors.primary,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" style={btn} onClick={onClick} aria-label={label}>
      <IconPlus size={20} color={colors.textInverse} />
    </button>
  );
}

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  const btn: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['6'],
    padding: `0 ${spacing['12']}px`,
    minHeight: 44,
    background: colors.bgMuted,
    borderRadius: radius.md,
    border: 'none',
    color: colors.text,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" style={btn} onClick={onClick}>
      {label}
      <IconChevronDown size={14} color={colors.textSecondary} />
    </button>
  );
}

function StatusText({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['20']}px ${spacing['20']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}

function sortOptionList(t: (k: TKey) => string): { id: SortId; label: string }[] {
  return [
    { id: 'attendance', label: t('squad.sort.attendance') },
    { id: 'name', label: t('squad.sort.name') },
    { id: 'number', label: t('squad.sort.number') },
  ];
}

function sortButtonLabel(t: (k: TKey) => string, sort: SortId): string {
  if (sort === 'attendance') return t('squad.sort.button.attendance');
  if (sort === 'name') return t('squad.sort.button.name');
  return t('squad.sort.button.number');
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
  if (sort === 'attendance') {
    const ar = a.attendance_rate;
    const br = b.attendance_rate;
    if (ar == null && br == null) return compareNames(a, b);
    if (ar == null) return 1;
    if (br == null) return -1;
    return br - ar || compareNames(a, b);
  }
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
