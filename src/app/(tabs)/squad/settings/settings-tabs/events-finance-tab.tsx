'use client';

import { useState, type CSSProperties } from 'react';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import { IconCalendar, IconTag, IconCreditCard, IconBell } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useUpdateTeamSettings } from '@/hooks/use-update-team-settings';
import { useVenues } from '@/hooks/use-venues';
import { formatRub } from '@/lib/format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { TeamSettingsDto } from '@/types/api';
import { SectionHeader } from './section-header';

// Вкладка «События и финансы»: дефолтная арена + стоимости + плашка
// «уведомления появятся позже» (в этой итерации без тогглов).

type SheetMode =
  | { kind: 'venue' }
  | { kind: 'event_cost' }
  | { kind: 'player_fee' }
  | null;

type Props = { settings: TeamSettingsDto | null };

export function EventsFinanceTab({ settings }: Props) {
  const t = useT();
  const update = useUpdateTeamSettings();
  const venuesQ = useVenues();
  const [sheet, setSheet] = useState<SheetMode>(null);
  const [amountDraft, setAmountDraft] = useState('');

  function openAmount(mode: 'event_cost' | 'player_fee') {
    const current = mode === 'event_cost'
      ? settings?.default_event_cost
      : settings?.default_player_fee;
    setAmountDraft(current != null ? String(current) : '');
    setSheet({ kind: mode });
  }

  function openVenue() {
    setSheet({ kind: 'venue' });
  }

  async function pickVenue(venueId: string | null) {
    setSheet(null);
    await update.mutateAsync({ body: { default_venue_id: venueId } });
  }

  async function saveAmount() {
    if (!sheet || sheet.kind === 'venue') return;
    const raw = amountDraft.replace(/[^0-9.]/g, '').trim();
    const num = raw === '' ? null : Number(raw);
    if (num != null && (Number.isNaN(num) || num < 0)) return;
    if (sheet.kind === 'event_cost') {
      await update.mutateAsync({ body: { default_event_cost: num } });
    } else {
      await update.mutateAsync({ body: { default_player_fee: num } });
    }
    setSheet(null);
  }

  async function clearAmount() {
    if (!sheet || sheet.kind === 'venue') return;
    if (sheet.kind === 'event_cost') {
      await update.mutateAsync({ body: { default_event_cost: null } });
    } else {
      await update.mutateAsync({ body: { default_player_fee: null } });
    }
    setSheet(null);
  }

  const venueLabel = settings?.default_venue?.name ?? t('teamSettings.events.defaultVenue.empty');
  const costLabel = settings?.default_event_cost != null
    ? `${formatRub(settings.default_event_cost)} ₽`
    : t('teamSettings.events.amountEmpty');
  const feeLabel = settings?.default_player_fee != null
    ? `${formatRub(settings.default_player_fee)} ₽`
    : t('teamSettings.events.amountEmpty');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['20'] }}>
      <section>
        <SectionHeader>{t('teamSettings.events.section.events')}</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <ListRow
            icon={<IconCalendar size={20} color={colors.iconFg} />}
            title={t('teamSettings.events.defaultVenue')}
            subtitle={venueLabel}
            onClick={openVenue}
          />
          <ListRow
            icon={<IconTag size={20} color={colors.iconFg} />}
            title={t('teamSettings.events.defaultCost')}
            subtitle={costLabel}
            onClick={() => openAmount('event_cost')}
          />
          <ListRow
            icon={<IconCreditCard size={20} color={colors.iconFg} />}
            title={t('teamSettings.events.defaultFee')}
            subtitle={feeLabel}
            onClick={() => openAmount('player_fee')}
          />
        </div>
      </section>

      <section>
        <SectionHeader>{t('teamSettings.events.section.notifications')}</SectionHeader>
        <Card variant="surface" padding={spacing['16']}>
          <div style={{ display: 'flex', gap: spacing['12'], alignItems: 'flex-start' }}>
            <div style={iconBubble}>
              <IconBell size={20} color={colors.iconFg} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={stubTitle}>{t('teamSettings.notifications.stub.title')}</div>
              <div style={stubSubtitle}>
                {t('teamSettings.notifications.stub.subtitle')}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <BottomSheet
        open={sheet?.kind === 'venue'}
        onClose={() => setSheet(null)}
        title={t('teamSettings.events.venueSheet.title')}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <BottomSheetOption
            label={t('teamSettings.events.venueSheet.none')}
            active={settings?.default_venue == null}
            onClick={() => void pickVenue(null)}
          />
          {(venuesQ.data?.venues ?? []).map((v) => (
            <BottomSheetOption
              key={v.id}
              label={v.name}
              hint={v.address ?? undefined}
              active={settings?.default_venue?.id === v.id}
              onClick={() => void pickVenue(v.id)}
            />
          ))}
          {venuesQ.data && venuesQ.data.venues.length === 0 ? (
            <div style={{ ...stubSubtitle, padding: spacing['12'] }}>
              {t('teamSettings.events.venueSheet.empty')}
            </div>
          ) : null}
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet?.kind === 'event_cost' || sheet?.kind === 'player_fee'}
        onClose={() => setSheet(null)}
        title={
          sheet?.kind === 'event_cost'
            ? t('teamSettings.events.defaultCost')
            : t('teamSettings.events.defaultFee')
        }
      >
        <input
          type="text"
          inputMode="numeric"
          value={amountDraft}
          onChange={(e) => setAmountDraft(e.target.value)}
          placeholder={t('teamSettings.events.amountSheet.placeholder')}
          autoFocus
          style={amountInput}
        />
        <div style={{ display: 'flex', gap: spacing['8'] }}>
          <button
            type="button"
            className="pressable"
            onClick={() => void clearAmount()}
            style={secondaryButton}
          >
            {t('teamSettings.events.amountSheet.clear')}
          </button>
          <button
            type="button"
            className="pressable"
            onClick={() => void saveAmount()}
            disabled={update.isPending}
            style={primaryButton}
          >
            {t('teamSettings.save')}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

const iconBubble: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: radius.md,
  background: colors.iconBg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const stubTitle: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: colors.text,
};

const stubSubtitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: colors.textSecondary,
  marginTop: 4,
  lineHeight: 1.4,
};

const amountInput: CSSProperties = {
  width: '100%',
  padding: `${spacing['12']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  fontSize: 16,
  marginBottom: spacing['12'],
  background: colors.bgMuted,
  color: colors.text,
};

const primaryButton: CSSProperties = {
  flex: 1,
  padding: `${spacing['12']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  border: 'none',
  background: colors.primary,
  color: colors.textInverse,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButton: CSSProperties = {
  flex: 1,
  padding: `${spacing['12']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  border: 'none',
  background: colors.bgMuted,
  color: colors.textSecondary,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};
