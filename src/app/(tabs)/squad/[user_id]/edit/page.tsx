'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Avatar } from '@/components/avatar';
import { AvatarCropper } from '@/components/avatar-cropper';
import { Input } from '@/components/input';
import { CardField } from '@/components/card-field';
import { Button } from '@/components/button';
import { BottomSheet, BottomSheetOption } from '@/components/bottom-sheet';
import {
  IconGame,
  IconLocation,
  IconStick,
  IconTrophy,
  IconPeople,
  IconCheckCircle,
  IconImage,
  IconChevronRight,
} from '@/components/icons';
import { useTeamMember } from '@/hooks/use-team-member';
import { useUpdateMember } from '@/hooks/use-update-member';
import { useDeleteMember } from '@/hooks/use-delete-member';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import type { TKey } from '@/i18n/ru';
import type { MemberTier, PlayerCaptaincy, PlayerPosition, PlayerShoots, PlayerSlotRole } from '@/types/api';

type T = (k: TKey) => string;
type SheetId = 'amplua' | 'position' | 'shoots' | 'captaincy' | 'tier' | 'delete';

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

export default function EditPlayerPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ user_id: string }>();
  const userId = params?.user_id ?? '';
  const memberQ = useTeamMember(userId);
  const update = useUpdateMember(userId);
  const del = useDeleteMember(userId);
  useTgHeader(colors.bg);

  const member = memberQ.data?.member;

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState<PlayerPosition | null>(null);
  const [slotRole, setSlotRole] = useState<PlayerSlotRole | null>(null);
  const [shoots, setShoots] = useState<PlayerShoots | null>(null);
  const [captaincy, setCaptaincy] = useState<PlayerCaptaincy>('none');
  const [tier, setTier] = useState<MemberTier>('main');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initRef = useRef(false);
  useEffect(() => {
    if (!member || initRef.current) return;
    initRef.current = true;
    setName([member.first_name, member.last_name].filter(Boolean).join(' '));
    setBirthDate(member.birth_date ?? '');
    setPhone(member.contact_phone ?? '');
    setNumber(member.jersey_number != null ? String(member.jersey_number) : '');
    setPosition(member.position);
    setSlotRole(member.slot_role);
    setShoots(member.shoots);
    setCaptaincy(member.captaincy);
    setTier(member.tier);
  }, [member]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/squad/${userId}`);
  };

  // Выбранный файл сначала отправляем в кадрировщик, а уже его результат — в превью/загрузку.
  const onPickFile = (file: File | null) => {
    if (!file) return;
    setCropFile(file);
  };

  const onCropDone = (cropped: File) => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(cropped);
    setPreview(URL.createObjectURL(cropped));
    setCropFile(null);
  };

  // Тап по пустой области закрывает клавиатуру — у цифровых полей iOS нет своей кнопки «Готово».
  const dismissKeyboard = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const pickAmplua = (p: PlayerPosition) => {
    setPosition(p);
    setSlotRole((prev) =>
      p === 'goalie' ? 'g' : prev && SLOT_BY_POS[p].includes(prev) ? prev : null,
    );
    setSheet(null);
  };

  const onSave = () => {
    const trimmed = name.trim();
    const sp = trimmed.indexOf(' ');
    const first = sp === -1 ? trimmed : trimmed.slice(0, sp);
    const last = sp === -1 ? '' : trimmed.slice(sp + 1).trim();
    const n = number.trim() === '' ? null : Number.parseInt(number, 10);
    update.mutate(
      {
        body: {
          first_name: first || null,
          last_name: last || null,
          birth_date: birthDate || null,
          shoots,
          contact_phone: phone,
          jersey_number: n != null && !Number.isNaN(n) ? n : null,
          position,
          slot_role: position === 'goalie' ? 'g' : slotRole,
          captaincy,
          tier,
        },
        photo,
      },
      { onSuccess: onBack },
    );
  };

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };

  if (memberQ.isLoading || (!member && !memberQ.error)) {
    return (
      <div style={root}>
        <LightHeader title={t('editMember.title')} onBack={onBack} />
        <Status text={t('common.loading')} color={colors.textSecondary} />
      </div>
    );
  }
  if (memberQ.error || !member) {
    return (
      <div style={root}>
        <LightHeader title={t('editMember.title')} onBack={onBack} />
        <Status text={t('common.error')} color={colors.error} />
      </div>
    );
  }

  const displayName = name || [member.first_name, member.last_name].filter(Boolean).join(' ');
  const showPosition = position === 'forward' || position === 'defender';

  return (
    <div style={root}>
      <LightHeader title={t('editMember.title')} onBack={onBack} />

      <div
        onPointerDown={dismissKeyboard}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing['16'],
          padding: spacing['16'],
          paddingBottom: BOTTOM_NAV_HEIGHT + spacing['24'],
        }}
      >
        <PhotoPicker
          src={preview ?? member.avatar_url ?? member.photo_url}
          name={displayName}
          label={t('editMember.changePhoto')}
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            onPickFile(e.target.files?.[0] ?? null);
            e.target.value = ''; // позволяем выбрать тот же файл повторно
          }}
        />

        <Field label={t('editMember.name')}>
          <Input
            value={name}
            placeholder={t('editMember.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t('editMember.birthDate')}>
          <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </Field>
        <Field label={t('editMember.phone')}>
          <Input
            type="tel"
            inputMode="tel"
            value={phone}
            placeholder={t('editMember.phonePlaceholder')}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label={t('editMember.number')}>
          <Input
            inputMode="numeric"
            value={number}
            placeholder={t('editMember.numberPlaceholder')}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 3))}
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
              value={position ? t(AMPLUA_LABEL[position]) : t('editMember.notSet')}
              onClick={() => setSheet('amplua')}
            />
            {showPosition ? (
              <Select
                icon={<IconLocation size={22} color={colors.iconFg} />}
                label={t('editMember.position')}
                value={slotRole ? t(SLOT_LABEL[slotRole]) : t('editMember.notSet')}
                onClick={() => setSheet('position')}
              />
            ) : null}
            <Select
              icon={<IconStick size={22} color={colors.iconFg} />}
              label={t('editMember.shoots')}
              value={shoots ? t(SHOOTS_LABEL[shoots]) : t('editMember.notSet')}
              onClick={() => setSheet('shoots')}
            />
          </div>
        </div>

        <Select
          icon={<IconTrophy size={22} color={colors.iconFg} />}
          label={t('editMember.role')}
          value={t(CAPTAINCY_LABEL[captaincy])}
          onClick={() => setSheet('captaincy')}
        />
        <Select
          icon={<IconPeople size={22} color={colors.iconFg} />}
          label={t('editMember.tier')}
          value={t(TIER_LABEL[tier])}
          onClick={() => setSheet('tier')}
        />

        <CardField
          icon={<IconCheckCircle size={22} color={colors.iconFg} />}
          label={t('editMember.account')}
          showChevron={false}
          right={
            <Badge
              text={member.is_placeholder ? t('editMember.accountWithout') : t('editMember.accountWith')}
              muted={member.is_placeholder}
            />
          }
        >
          <div style={{ ...typography.sm, color: colors.textSecondary, marginTop: 2 }}>
            {t('editMember.accountHint')}
          </div>
        </CardField>

        {update.error ? (
          <div style={{ ...typography.sm, color: colors.error }}>{update.error.message}</div>
        ) : null}

        <Button variant="primary" size="lg" fullWidth disabled={update.isPending} onClick={onSave}>
          {t('editMember.save')}
        </Button>
        <button
          type="button"
          className="pressable"
          onClick={() => setSheet('delete')}
          style={{
            background: 'none',
            border: 'none',
            color: colors.error,
            ...typography.bodyBold,
            minHeight: 44,
            cursor: 'pointer',
          }}
        >
          {t('editMember.delete')}
        </button>
      </div>

      <BottomSheet open={sheet !== null && sheet !== 'delete'} onClose={() => setSheet(null)} title={sheetTitle(sheet, t)}>
        {sheet === 'amplua'
          ? (['forward', 'defender', 'goalie'] as const).map((p) => (
              <BottomSheetOption key={p} label={t(AMPLUA_LABEL[p])} active={position === p} onClick={() => pickAmplua(p)} />
            ))
          : null}
        {sheet === 'position' && position && position !== 'goalie'
          ? SLOT_BY_POS[position].map((s) => (
              <BottomSheetOption
                key={s}
                label={t(SLOT_LABEL[s])}
                active={slotRole === s}
                onClick={() => {
                  setSlotRole(s);
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
                active={shoots === s}
                onClick={() => {
                  setShoots(s);
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
                active={captaincy === c}
                onClick={() => {
                  setCaptaincy(c);
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
                active={tier === ti}
                onClick={() => {
                  setTier(ti);
                  setSheet(null);
                }}
              />
            ))
          : null}
      </BottomSheet>

      <BottomSheet open={sheet === 'delete'} onClose={() => setSheet(null)} title={t('editMember.deleteTitle')}>
        <div style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing['16'] }}>
          {t('editMember.deleteText')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            disabled={del.isPending}
            onClick={() => del.mutate(undefined, { onSuccess: () => router.replace('/squad') })}
          >
            {t('editMember.deleteCta')}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setSheet(null)}>
            {t('editMember.cancel')}
          </Button>
        </div>
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
    </div>
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
  onClick,
}: {
  src?: string | null;
  name: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: spacing['8'] }}>
      <button
        type="button"
        className="pressable"
        onClick={onClick}
        aria-label={label}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
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
      </button>
    </div>
  );
}

function Badge({ text, muted }: { text: string; muted: boolean }) {
  return (
    <span
      style={{
        ...typography.smBold,
        color: muted ? colors.textSecondary : colors.successText,
        background: muted ? colors.bgMuted : colors.successBg,
        padding: `${spacing['6']}px ${spacing['12']}px`,
        borderRadius: radius.pill,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function Status({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}
