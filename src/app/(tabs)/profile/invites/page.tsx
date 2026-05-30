'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { ContentTabs } from '@/components/content-tabs';
import { Button } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { IconChevronDown, IconUserCheck } from '@/components/icons';
import { useMyInvites, useDecideMyInvite } from '@/hooks/use-my-invites';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { MyInviteItem } from '@/types/api';
import type { TKey } from '@/i18n/ru';

type TabId = 'all' | 'in' | 'out';

function InvitesContent() {
  const t = useT();
  const router = useRouter();
  const sp = useSearchParams();
  const initialTab: TabId = sp.get('tab') === 'out' ? 'out' : sp.get('tab') === 'in' ? 'in' : 'all';
  const [tab, setTab] = useState<TabId>(initialTab);
  const q = useMyInvites();
  useTgHeader(colors.bg);

  const items = q.data?.items ?? [];
  const filtered = useMemo(() => {
    if (tab === 'in') return items.filter((i) => i.kind === 'invite');
    if (tab === 'out') return items.filter((i) => i.kind === 'request');
    return items;
  }, [items, tab]);

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: spacing['16'],
    paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
  };

  const tabs = [
    { id: 'all', label: t('myProfile.invites.tabs.all') },
    { id: 'in', label: t('myProfile.invites.tabs.in') },
    { id: 'out', label: t('myProfile.invites.tabs.out') },
  ];

  return (
    <div style={root}>
      <LightHeader title={t('myProfile.invites.title')} onBack={() => router.push('/profile')} />
      <ContentTabs tabs={tabs} activeId={tab} onChange={(id) => setTab(id as TabId)} />
      <div style={content}>
        {tab !== 'in' ? (
          <Button size="lg" fullWidth onClick={() => router.push('/profile/invites/new')}>
            {t('myProfile.invites.cta.apply')}
          </Button>
        ) : null}

        {q.isLoading ? (
          <Status text={t('common.loading')} color={colors.textSecondary} />
        ) : q.error ? (
          <Status text={t('common.error')} color={colors.error} />
        ) : filtered.length === 0 ? (
          <EmptyBox
            text={
              tab === 'in'
                ? t('myProfile.invites.empty.in')
                : tab === 'out'
                  ? t('myProfile.invites.empty.out')
                  : t('myProfile.invites.empty.all')
            }
          />
        ) : (
          filtered.map((it) => <InviteCard key={it.id} item={it} t={t} />)
        )}
      </div>
    </div>
  );
}

export default function MyInvitesPage() {
  return (
    <Suspense>
      <InvitesContent />
    </Suspense>
  );
}

function Status({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing['12'],
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${spacing['32']}px ${spacing['16']}px`,
        background: colors.bgWarm,
        borderRadius: radius.lg,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: colors.bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconUserCheck size={24} color={colors.iconMuted} />
      </div>
      <span style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
        {text}
      </span>
    </div>
  );
}

function InviteCard({ item, t }: { item: MyInviteItem; t: (k: TKey) => string }) {
  const decide = useDecideMyInvite();
  const [open, setOpen] = useState(false);

  const expandable = item.kind === 'invite' && item.status === 'pending';
  const typeLabel =
    item.kind === 'invite' ? t('myProfile.invites.type.invite') : t('myProfile.invites.type.request');

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
    padding: spacing['16'],
    background: colors.bg,
    borderRadius: radius.lg,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
  };

  return (
    <div style={wrap}>
      <button
        type="button"
        className={expandable ? 'pressable' : undefined}
        onClick={expandable ? () => setOpen((v) => !v) : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['12'],
          background: 'none',
          border: 'none',
          padding: 0,
          width: '100%',
          textAlign: 'left',
          cursor: expandable ? 'pointer' : 'default',
        }}
      >
        <Avatar src={item.team_logo_url} name={item.team_name} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...typography.bodyBold, color: colors.text }}>{item.team_name}</div>
          <div style={{ marginTop: spacing['6'] }}>
            <TypeBadge label={typeLabel} kind={item.kind} />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: spacing['8'],
            flexShrink: 0,
          }}
        >
          <StatusChip status={item.status} t={t} />
          {expandable ? (
            <span
              style={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
                display: 'inline-flex',
              }}
            >
              <IconChevronDown size={14} color={colors.textSecondary} />
            </span>
          ) : null}
        </div>
      </button>

      {expandable && open ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
          <div style={{ height: 1, background: colors.line }} />
          <div style={{ ...typography.sm, color: colors.text }}>
            {t('myProfile.invites.invite.body')}
          </div>
          <div style={{ display: 'flex', gap: spacing['8'] }}>
            <Button
              size="lg"
              fullWidth
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: item.id, action: 'approve' })}
            >
              {t('myProfile.invites.accept')}
            </Button>
            <Button
              variant="dangerOutline"
              size="lg"
              fullWidth
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: item.id, action: 'reject' })}
            >
              {t('myProfile.invites.reject')}
            </Button>
          </div>
        </div>
      ) : null}

      {!expandable ? (
        <div style={{ ...typography.sm, color: colors.textSecondary }}>
          {commentFor(item, t)}
        </div>
      ) : null}
    </div>
  );
}

function commentFor(item: MyInviteItem, t: (k: TKey) => string): string {
  if (item.kind === 'invite') {
    if (item.status === 'approved') return t('myProfile.invites.invite.approved');
    if (item.status === 'rejected') return t('myProfile.invites.invite.rejected');
    return t('myProfile.invites.invite.body');
  }
  if (item.status === 'approved') return t('myProfile.invites.request.approved');
  if (item.status === 'rejected') return t('myProfile.invites.request.rejected');
  return t('myProfile.invites.request.pending');
}

function TypeBadge({ label, kind }: { label: string; kind: MyInviteItem['kind'] }) {
  const palette =
    kind === 'invite'
      ? { bg: colors.primaryLight, fg: colors.primary }
      : { bg: colors.bgMuted, fg: colors.textSecondary };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${spacing['4']}px ${spacing['8']}px`,
        borderRadius: radius.pill,
        background: palette.bg,
        color: palette.fg,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function StatusChip({ status, t }: { status: MyInviteItem['status']; t: (k: TKey) => string }) {
  const palette =
    status === 'pending'
      ? { bg: colors.warningBg, fg: colors.warningText }
      : status === 'approved'
        ? { bg: colors.successBg, fg: colors.successText }
        : { bg: colors.errorBg, fg: colors.errorText };
  const label =
    status === 'pending'
      ? t('myProfile.invites.status.pending')
      : status === 'approved'
        ? t('myProfile.invites.status.approved')
        : t('myProfile.invites.status.rejected');
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${spacing['4']}px ${spacing['10']}px`,
        borderRadius: radius.pill,
        background: palette.bg,
        color: palette.fg,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
