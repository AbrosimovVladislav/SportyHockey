'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Screen } from '@/components/screen';
import { Card } from '@/components/card';
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

type FilterId = 'all' | PlayerPosition;
type SortId = 'name' | 'number';

export default function SquadPage() {
  const t = useT();
  const router = useRouter();
  const q = useTeamMembers();
  const { isOrganizer } = useIsOrganizer();
  const [filter, setFilter] = useState<FilterId>('all');
  const [sort, setSort] = useState<SortId>('name');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const members = q.data?.members ?? [];

  const visible = useMemo<TeamMember[]>(() => {
    const filtered = filter === 'all' ? members : members.filter((m) => m.position === filter);
    return [...filtered].sort((a, b) => sortMembers(a, b, sort));
  }, [members, filter, sort]);

  if (q.isLoading) {
    return (
      <Screen title={t('squad.title')}>
        <span style={{ ...typography.body, color: colors.textSecondary }}>
          {t('common.loading')}
        </span>
      </Screen>
    );
  }
  if (q.error || !q.data) {
    return (
      <Screen title={t('squad.title')}>
        <span style={{ ...typography.body, color: colors.error }}>{t('common.error')}</span>
      </Screen>
    );
  }

  const filterOptions = [
    { id: 'all', label: t('squad.filters.all') },
    { id: 'forward', label: t('squad.filters.forward') },
    { id: 'defender', label: t('squad.filters.defender') },
    { id: 'goalie', label: t('squad.filters.goalie') },
  ];

  const sortOptions: { id: SortId; label: string }[] = [
    { id: 'name', label: t('squad.sort.name') },
    { id: 'number', label: t('squad.sort.number') },
  ];
  const sortLabel = sortOptions.find((o) => o.id === sort)?.label ?? '';

  return (
    <Screen title={q.data.team.name}>
      <FilterChips
        options={filterOptions}
        activeId={filter}
        onChange={(id) => setFilter(id as FilterId)}
      />

      {visible.length === 0 ? (
        <EmptyState title={members.length === 0 ? t('squad.empty') : t('squad.emptyFiltered')} />
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

      {isOrganizer ? (
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
        {sortOptions.map((o) => (
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
