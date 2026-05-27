'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { DarkHeader } from '@/components/dark-header';
import { FAB } from '@/components/fab';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ContentTabs } from '@/components/content-tabs';
import { FilterChips } from '@/components/filter-chips';
import { SectionHeader } from '@/components/section-header';
import { PlayerRow } from '@/components/player-row';
import { AttendanceRing } from '@/components/attendance-ring';
import { EmptyState } from '@/components/empty-state';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { IconChevronDown } from '@/components/icons';
import { SquadLinesTab } from './lines-tab';
import { SquadSidesTab } from './sides-tab';
import { useT } from '@/hooks/use-t';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useIsOrganizer } from '@/hooks/use-is-organizer';
import { useTgHeader } from '@/hooks/use-tg-header';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { PlayerPosition, TeamMember } from '@/types/api';

type TabId = 'list' | 'lines' | 'sides';
type FilterId = PlayerPosition | null;
type SortId = 'attendance' | 'name' | 'number';

export default function SquadPage() {
  const t = useT();
  const router = useRouter();
  useTgHeader('#233F30');
  const q = useTeamMembers();
  const { isOrganizer } = useIsOrganizer();
  const [tab, setTab] = useState<TabId>('list');
  const [filter, setFilter] = useState<FilterId>(null);
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
      forward: members.filter((m) => m.position === 'forward').length,
      defender: members.filter((m) => m.position === 'defender').length,
      goalie: members.filter((m) => m.position === 'goalie').length,
    }),
    [members],
  );

  const groups = useMemo(() => {
    const byFilter = filter === null ? members : members.filter((m) => m.position === filter);
    const sorted = [...byFilter].sort((a, b) => sortMembers(a, b, sort));
    return {
      main: sorted.filter((m) => m.tier === 'main'),
      reserve: sorted.filter((m) => m.tier === 'reserve'),
      all: sorted,
      total: byFilter.length,
    };
  }, [members, filter, sort]);

  const root: CSSProperties = {
    minHeight: '100dvh',
    background: colors.bg,
  };

  const sheet: CSSProperties = {
    background: colors.bg,
    borderRadius: '24px 24px 0 0',
    marginTop: -12,
    position: 'relative',
    zIndex: 2,
    minHeight: `calc(100dvh - ${BOTTOM_NAV_HEIGHT}px - 140px)`,
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  return (
    <div style={root}>
      <DarkHeader title={t('squad.title')} imageSrc="/team.png" />

      <div style={sheet}>
        <ContentTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />

        {tab === 'list' ? (
          <ListView
            q={q}
            groups={groups}
            counts={counts}
            membersTotal={members.length}
            isOrganizer={isOrganizer}
            filter={filter}
            setFilter={setFilter}
            sort={sort}
            setSortSheetOpen={setSortSheetOpen}
            onSelect={(userId) => router.push(`/squad/${userId}`)}
            t={t}
          />
        ) : tab === 'lines' ? (
          <SquadLinesTab members={members} canEdit />
        ) : (
          <SquadSidesTab members={members} canEdit />
        )}
      </div>

      {isOrganizer && tab === 'list' ? (
        <FAB
          variant="dark"
          ariaLabel={t('squad.fabLabel')}
          onClick={() => router.push('/squad/new')}
          bottom={BOTTOM_NAV_HEIGHT + 24}
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
    </div>
  );
}

type Groups = { main: TeamMember[]; reserve: TeamMember[]; all: TeamMember[]; total: number };
type Counts = { forward: number; defender: number; goalie: number };

type ListViewProps = {
  q: ReturnType<typeof useTeamMembers>;
  groups: Groups;
  counts: Counts;
  membersTotal: number;
  isOrganizer: boolean;
  filter: FilterId;
  setFilter: (id: FilterId) => void;
  sort: SortId;
  setSortSheetOpen: (open: boolean) => void;
  onSelect: (userId: string) => void;
  t: (k: TKey) => string;
};

function ListView({
  q,
  groups,
  counts,
  membersTotal,
  isOrganizer,
  filter,
  setFilter,
  sort,
  setSortSheetOpen,
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
    { id: 'forward', label: t('squad.filters.forward'), count: counts.forward },
    { id: 'defender', label: t('squad.filters.defender'), count: counts.defender },
    { id: 'goalie', label: t('squad.filters.goalie'), count: counts.goalie },
  ];

  return (
    <>
      <FilterChips
        options={filterOptions}
        activeId={filter ?? ''}
        onChange={(id) => setFilter(filter === id ? null : (id as PlayerPosition))}
        trailing={
          <SortButton label={sortButtonLabel(t, sort)} onClick={() => setSortSheetOpen(true)} />
        }
      />

      {groups.total === 0 ? (
        <EmptyState title={membersTotal === 0 ? t('squad.empty') : t('squad.emptyFiltered')} />
      ) : isOrganizer ? (
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
      ) : (
        // Игрок не видит деления основа/резерв — единый список «Состав».
        <Group title={t('squad.group.all')} members={groups.all} onSelect={onSelect} t={t} />
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
      <SectionHeader title={title} subtitle={String(members.length)} variant="group" />
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

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  const btn: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['4'],
    padding: `${spacing['6']}px ${spacing['10']}px`,
    background: colors.cardSchedule,
    borderRadius: radius.xl,
    border: 'none',
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 600,
    lineHeight: '18px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
  return (
    <button type="button" className="pressable" style={btn} onClick={onClick}>
      {label}
      <IconChevronDown size={13} color={colors.textSecondary} />
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
