'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Button } from '@/components/button';
import { CardField } from '@/components/card-field';
import { BottomSheet } from '@/components/bottom-sheet';
import { IconCheckCircle } from '@/components/icons';
import { MemberForm, emptyMemberForm, type MemberFormValue } from '@/components/member-form';
import { useTeamMember } from '@/hooks/use-team-member';
import { useUpdateMember } from '@/hooks/use-update-member';
import { useDeleteMember } from '@/hooks/use-delete-member';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

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

  const [form, setForm] = useState<MemberFormValue>(emptyMemberForm());
  const [photo, setPhoto] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const initRef = useRef(false);
  useEffect(() => {
    if (!member || initRef.current) return;
    initRef.current = true;
    setForm({
      name: [member.first_name, member.last_name].filter(Boolean).join(' '),
      birthDate: member.birth_date ?? '',
      phone: member.contact_phone ?? '',
      whatsapp: member.contact_whatsapp ?? '',
      telegram: member.username ?? '',
      number: member.jersey_number != null ? String(member.jersey_number) : '',
      position: member.position,
      slotRole: member.slot_role,
      shoots: member.shoots,
      captaincy: member.captaincy,
      tier: member.tier,
    });
  }, [member]);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(`/squad/${userId}`);
  };

  // Тап по пустой области закрывает клавиатуру — у цифровых полей iOS нет своей кнопки «Готово».
  const dismissKeyboard = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const onSave = () => {
    const trimmed = form.name.trim();
    const sp = trimmed.indexOf(' ');
    const first = sp === -1 ? trimmed : trimmed.slice(0, sp);
    const last = sp === -1 ? '' : trimmed.slice(sp + 1).trim();
    const n = form.number.trim() === '' ? null : Number.parseInt(form.number, 10);
    update.mutate(
      {
        body: {
          first_name: first || null,
          last_name: last || null,
          birth_date: form.birthDate || null,
          shoots: form.shoots,
          username: form.telegram,
          contact_phone: form.phone,
          contact_whatsapp: form.whatsapp,
          jersey_number: n != null && !Number.isNaN(n) ? n : null,
          position: form.position,
          slot_role: form.position === 'goalie' ? 'g' : form.slotRole,
          captaincy: form.captaincy,
          tier: form.tier,
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
        <MemberForm
          value={form}
          onChange={setForm}
          photo={photo}
          onPhotoChange={setPhoto}
          currentAvatarUrl={member.avatar_url ?? member.photo_url}
          variant="full"
          t={t}
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
          onClick={() => setConfirmDelete(true)}
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

      <BottomSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t('editMember.deleteTitle')}
      >
        <div style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing['16'] }}>
          {t('editMember.deleteText')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            disabled={del.isPending}
            onClick={() => del.mutate(undefined, { onSuccess: () => router.replace('/squad/roster') })}
          >
            {t('editMember.deleteCta')}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setConfirmDelete(false)}>
            {t('editMember.cancel')}
          </Button>
        </div>
      </BottomSheet>
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
