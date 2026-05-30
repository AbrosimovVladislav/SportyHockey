'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Avatar } from '@/components/avatar';
import { AvatarCropper } from '@/components/avatar-cropper';
import { Input } from '@/components/input';
import { CardField } from '@/components/card-field';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import {
  IconGame,
  IconLocation,
  IconStick,
  IconTrophy,
  IconPeople,
  IconImage,
  IconChevronRight,
} from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { MemberTier, PlayerCaptaincy, PlayerPosition, PlayerShoots, PlayerSlotRole } from '@/types/api';

type T = (k: TKey) => string;
type SheetId = 'amplua' | 'position' | 'shoots' | 'captaincy' | 'tier';
type Variant = 'full' | 'onboarding';

// Единое значение формы игрока — переиспользуется в создании, редактировании и онбординге.
export type MemberFormValue = {
  name: string;
  birthDate: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  number: string;
  position: PlayerPosition | null;
  slotRole: PlayerSlotRole | null;
  shoots: PlayerShoots | null;
  captaincy: PlayerCaptaincy;
  tier: MemberTier;
};

// «Имя Фамилия» → first/last (первое слово — имя, остальное — фамилия).
export function splitName(name: string): { first: string; last: string } {
  const trimmed = name.trim();
  const sp = trimmed.indexOf(' ');
  const first = sp === -1 ? trimmed : trimmed.slice(0, sp);
  const last = sp === -1 ? '' : trimmed.slice(sp + 1).trim();
  return { first, last };
}

export function emptyMemberForm(): MemberFormValue {
  return {
    name: '',
    birthDate: '',
    phone: '',
    whatsapp: '',
    telegram: '',
    number: '',
    position: null,
    slotRole: null,
    shoots: null,
    captaincy: 'none',
    tier: 'main',
  };
}

const SLOT_BY_POS: Record<PlayerPosition, PlayerSlotRole[]> = {
  forward: ['c', 'lw', 'rw'],
  defender: ['ld', 'rd'],
  goalie: ['g'],
};
const AMPLUA_LABEL: Record<PlayerPosition, TKey> = {
  forward: 'editMember.amplua.forward',
  defender: 'editMember.amplua.defender',
  goalie: 'editMember.amplua.goalie',
};
const SLOT_LABEL: Record<PlayerSlotRole, TKey> = {
  c: 'editMember.pos.c',
  lw: 'editMember.pos.lw',
  rw: 'editMember.pos.rw',
  ld: 'editMember.pos.ld',
  rd: 'editMember.pos.rd',
  g: 'editMember.amplua.goalie',
};
const SHOOTS_LABEL: Record<PlayerShoots, TKey> = {
  left: 'editMember.shoots.left',
  right: 'editMember.shoots.right',
};
const CAPTAINCY_LABEL: Record<PlayerCaptaincy, TKey> = {
  none: 'editMember.cap.none',
  assistant: 'editMember.cap.assistant',
  captain: 'editMember.cap.captain',
};
const TIER_LABEL: Record<MemberTier, TKey> = {
  main: 'editMember.tier.main',
  reserve: 'editMember.tier.reserve',
};

type Props = {
  value: MemberFormValue;
  onChange: (next: MemberFormValue) => void;
  photo: File | null;
  onPhotoChange: (f: File | null) => void;
  currentAvatarUrl?: string | null;
  variant?: Variant;
  // Скрыть командные блоки (Роль/Капитанство, Tier). Использует личный режим
  // редактирования (/profile/edit): эти поля задаёт организатор, не сам игрок.
  hideTeamFields?: boolean;
  t: T;
};

export function MemberForm({
  value,
  onChange,
  photo,
  onPhotoChange,
  currentAvatarUrl,
  variant = 'full',
  hideTeamFields = false,
  t,
}: Props) {
  const full = variant === 'full';
  const [preview, setPreview] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<SheetId | null>(null);

  const set = <K extends keyof MemberFormValue>(key: K, v: MemberFormValue[K]) => {
    onChange({ ...value, [key]: v });
  };

  useEffect(() => {
    if (photo) return;
    setPreview(null); // фото сбросили извне
  }, [photo]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const onCropDone = (cropped: File) => {
    if (preview) URL.revokeObjectURL(preview);
    onPhotoChange(cropped);
    setPreview(URL.createObjectURL(cropped));
    setCropFile(null);
  };

  const pickAmplua = (p: PlayerPosition) => {
    onChange({
      ...value,
      position: p,
      slotRole:
        p === 'goalie' ? 'g' : value.slotRole && SLOT_BY_POS[p].includes(value.slotRole) ? value.slotRole : null,
    });
    setSheet(null);
  };

  const displayName = value.name || t('editMember.namePlaceholder');
  const showPosition = value.position === 'forward' || value.position === 'defender';

  return (
    <>
      {full ? (
        <>
          <PhotoPicker
            src={preview ?? currentAvatarUrl}
            name={value.name || ' '}
            label={t('editMember.changePhoto')}
            onPick={(file) => setCropFile(file)}
          />
          {/* Базовая информация: имя и дата рождения. */}
          <Field label={t('editMember.name')}>
            <Input
              value={value.name}
              placeholder={t('editMember.namePlaceholder')}
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>
          <Field label={t('editMember.birthDate')}>
            <Input type="date" value={value.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          </Field>
          {/* Три контакта подряд: телефон, Telegram, WhatsApp. */}
          <Field label={t('editMember.phone')}>
            <Input
              type="tel"
              inputMode="tel"
              value={value.phone}
              placeholder={t('editMember.phonePlaceholder')}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>
          <Field label={t('editMember.telegram')}>
            <Input
              value={value.telegram}
              placeholder={t('editMember.telegramPlaceholder')}
              onChange={(e) => set('telegram', e.target.value)}
            />
          </Field>
          <Field label={t('editMember.whatsapp')}>
            <Input
              type="tel"
              inputMode="tel"
              value={value.whatsapp}
              placeholder={t('editMember.whatsappPlaceholder')}
              onChange={(e) => set('whatsapp', e.target.value)}
            />
          </Field>
          {/* Игровой номер — между контактами и игровым профилем. */}
          <Field label={t('editMember.number')}>
            <Input
              inputMode="numeric"
              value={value.number}
              placeholder={t('editMember.numberPlaceholder')}
              onChange={(e) => set('number', e.target.value.replace(/\D/g, '').slice(0, 3))}
            />
          </Field>

          <div
            style={{
              background: colors.bg,
              borderRadius: radius.lg,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
              padding: spacing['16'],
            }}
          >
            <div style={{ ...typography.smBold, color: colors.text, marginBottom: spacing['12'] }}>
              {t('editMember.gameProfile')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
              <Select
                icon={<IconGame size={22} color={colors.iconFg} />}
                label={t('editMember.amplua')}
                value={value.position ? t(AMPLUA_LABEL[value.position]) : t('editMember.notSet')}
                onClick={() => setSheet('amplua')}
              />
              {showPosition ? (
                <Select
                  icon={<IconLocation size={22} color={colors.iconFg} />}
                  label={t('editMember.position')}
                  value={value.slotRole ? t(SLOT_LABEL[value.slotRole]) : t('editMember.notSet')}
                  onClick={() => setSheet('position')}
                />
              ) : null}
              <Select
                icon={<IconStick size={22} color={colors.iconFg} />}
                label={t('editMember.shoots')}
                value={value.shoots ? t(SHOOTS_LABEL[value.shoots]) : t('editMember.notSet')}
                onClick={() => setSheet('shoots')}
              />
            </div>
          </div>

          {hideTeamFields ? null : (
            <>
              <Select
                icon={<IconTrophy size={22} color={colors.iconFg} />}
                label={t('editMember.role')}
                value={t(CAPTAINCY_LABEL[value.captaincy])}
                onClick={() => setSheet('captaincy')}
              />
              <Select
                icon={<IconPeople size={22} color={colors.iconFg} />}
                label={t('editMember.tier')}
                value={t(TIER_LABEL[value.tier])}
                onClick={() => setSheet('tier')}
              />
            </>
          )}
        </>
      ) : (
        <>
          <Field label={t('editMember.name')}>
            <Input
              value={value.name}
              placeholder={t('editMember.namePlaceholder')}
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>
          <Field label={t('editMember.birthDate')}>
            <Input type="date" value={value.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          </Field>
          <Select
            icon={<IconStick size={22} color={colors.iconFg} />}
            label={t('editMember.shoots')}
            value={value.shoots ? t(SHOOTS_LABEL[value.shoots]) : t('editMember.notSet')}
            onClick={() => setSheet('shoots')}
          />
        </>
      )}

      <BottomSheet open={sheet !== null} onClose={() => setSheet(null)} title={sheetTitle(sheet, t)}>
        {sheet === 'amplua'
          ? (['forward', 'defender', 'goalie'] as const).map((p) => (
              <BottomSheetOption key={p} label={t(AMPLUA_LABEL[p])} active={value.position === p} onClick={() => pickAmplua(p)} />
            ))
          : null}
        {sheet === 'position' && value.position && value.position !== 'goalie'
          ? SLOT_BY_POS[value.position].map((s) => (
              <BottomSheetOption
                key={s}
                label={t(SLOT_LABEL[s])}
                active={value.slotRole === s}
                onClick={() => {
                  set('slotRole', s);
                  setSheet(null);
                }}
              />
            ))
          : null}
        {sheet === 'shoots'
          ? (['left', 'right'] as const).map((s) => (
              <BottomSheetOption
                key={s}
                label={t(SHOOTS_LABEL[s])}
                active={value.shoots === s}
                onClick={() => {
                  set('shoots', s);
                  setSheet(null);
                }}
              />
            ))
          : null}
        {sheet === 'captaincy'
          ? (['none', 'assistant', 'captain'] as const).map((c) => (
              <BottomSheetOption
                key={c}
                label={t(CAPTAINCY_LABEL[c])}
                active={value.captaincy === c}
                onClick={() => {
                  set('captaincy', c);
                  setSheet(null);
                }}
              />
            ))
          : null}
        {sheet === 'tier'
          ? (['main', 'reserve'] as const).map((ti) => (
              <BottomSheetOption
                key={ti}
                label={t(TIER_LABEL[ti])}
                active={value.tier === ti}
                onClick={() => {
                  set('tier', ti);
                  setSheet(null);
                }}
              />
            ))
          : null}
      </BottomSheet>

      {cropFile ? (
        <AvatarCropper
          file={cropFile}
          title={t('editMember.cropTitle')}
          hint={t('editMember.cropHint')}
          doneLabel={t('editMember.cropDone')}
          cancelLabel={t('editMember.cancel')}
          onCancel={() => setCropFile(null)}
          onDone={onCropDone}
        />
      ) : null}
    </>
  );
}

function sheetTitle(sheet: SheetId | null, t: T): string {
  switch (sheet) {
    case 'amplua':
      return t('editMember.amplua');
    case 'position':
      return t('editMember.position');
    case 'shoots':
      return t('editMember.shoots');
    case 'captaincy':
      return t('editMember.role');
    case 'tier':
      return t('editMember.tier');
    default:
      return '';
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ ...typography.smBold, color: colors.textSecondary, marginBottom: spacing['8'] }}>
        {label}
      </div>
      {children}
    </label>
  );
}

function Select({
  icon,
  label,
  value,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <CardField
      icon={icon}
      label={label}
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing['6'] }}>
          <span style={{ ...typography.bodyBold, color: colors.text }}>{value}</span>
          <IconChevronRight />
        </div>
      }
      onClick={onClick}
    />
  );
}

function PhotoPicker({
  src,
  name,
  label,
  onPick,
}: {
  src?: string | null;
  name: string;
  label: string;
  onPick: (file: File) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: spacing['8'] }}>
      <label
        className="pressable"
        aria-label={label}
        style={{ position: 'relative', cursor: 'pointer', display: 'inline-block' }}
      >
        <Avatar src={src} name={name} size={96} />
        <span
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: colors.primary,
            border: `2px solid ${colors.bg}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconImage size={16} color={colors.textInverse} />
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  );
}
