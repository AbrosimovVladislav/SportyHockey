'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Button } from '@/components/button';
import { MemberForm, emptyMemberForm, splitName, type MemberFormValue } from '@/components/member-form';
import { useMe } from '@/hooks/use-me';
import { useTeamMember } from '@/hooks/use-team-member';
import { useUpdateMe, UploadError } from '@/hooks/use-update-me';
import { useUpdateMyMembership } from '@/hooks/use-update-my-membership';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

// Редактирование личного профиля игрока (v0.4, итерация 44).
// Переиспользует ту же MemberForm, что и /squad/[user_id]/edit для
// организатора. Личные поля (имя, аватар, телефон, telegram, дата рождения,
// шейп) идут в PATCH /api/me. Командные (номер, амплуа, слот, капитанство,
// tier) — в PATCH /api/me/membership.
export default function MyProfileEditPage() {
  const t = useT();
  const router = useRouter();
  const me = useMe();
  // Командные поля для дефолтных значений: они хранятся в team_memberships
  // и приходят в общий TeamMember через useTeamMember(me.user.id).
  // Если активной команды нет — командной формы не будет, форма деградирует.
  const myId = me.data?.user.id ?? '';
  const memberQ = useTeamMember(myId);
  const updateMe = useUpdateMe();
  const updateMembership = useUpdateMyMembership();
  useTgHeader(colors.bg);

  const [form, setForm] = useState<MemberFormValue>(emptyMemberForm());
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    const u = me.data?.user;
    if (!u) return;
    initRef.current = true;
    const member = memberQ.data?.member;
    setForm({
      name: [u.first_name, u.last_name].filter(Boolean).join(' '),
      birthDate: u.birth_date ?? '',
      phone: u.contact_phone ?? '',
      telegram: u.username ?? '',
      number: member?.jersey_number != null ? String(member.jersey_number) : '',
      position: member?.position ?? null,
      slotRole: member?.slot_role ?? null,
      shoots: u.shoots,
      captaincy: member?.captaincy ?? 'none',
      tier: member?.tier ?? 'main',
    });
  }, [me.data?.user, memberQ.data?.member]);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/profile');
  };

  const dismissKeyboard = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const onSave = async () => {
    setError(null);
    const { first, last } = splitName(form.name);
    const n = form.number.trim() === '' ? null : Number.parseInt(form.number, 10);
    try {
      await updateMe.mutateAsync({
        body: {
          first_name: first || null,
          last_name: last || null,
          birth_date: form.birthDate || null,
          shoots: form.shoots,
          username: form.telegram,
          contact_phone: form.phone,
        },
        photo,
      });
      // Командные поля — только если игрок в команде.
      if (memberQ.data?.member) {
        await updateMembership.mutateAsync({
          jersey_number: n != null && !Number.isNaN(n) ? n : null,
          position: form.position,
          slot_role: form.position === 'goalie' ? 'g' : form.slotRole,
          captaincy: form.captaincy,
          tier: form.tier,
        });
      }
      onBack();
    } catch (e) {
      if (e instanceof UploadError) setError(e.message);
      else if (e instanceof Error) setError(e.message);
      else setError(t('common.error'));
    }
  };

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };

  if (me.isLoading || (!me.data && !me.error)) {
    return (
      <div style={root}>
        <LightHeader title={t('myProfile.edit.title')} onBack={onBack} />
        <Status text={t('common.loading')} color={colors.textSecondary} />
      </div>
    );
  }
  if (me.error || !me.data) {
    return (
      <div style={root}>
        <LightHeader title={t('myProfile.edit.title')} onBack={onBack} />
        <Status text={t('common.error')} color={colors.error} />
      </div>
    );
  }

  const u = me.data.user;
  const saving = updateMe.isPending || updateMembership.isPending;

  return (
    <div style={root}>
      <LightHeader title={t('myProfile.edit.title')} onBack={onBack} />
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
          currentAvatarUrl={u.avatar_url ?? u.photo_url}
          variant="full"
          t={t}
        />

        {error ? (
          <div style={{ ...typography.sm, color: colors.error }}>{error}</div>
        ) : null}

        <div style={{ ...typography.sm, color: colors.textSecondary, textAlign: 'center' }}>
          {t('myProfile.edit.hint')}
        </div>

        <Button variant="primary" size="lg" fullWidth disabled={saving} onClick={onSave}>
          {t('myProfile.edit.save')}
        </Button>
      </div>
    </div>
  );
}

function Status({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ padding: `${spacing['24']}px ${spacing['16']}px` }}>
      <span style={{ ...typography.body, color }}>{text}</span>
    </div>
  );
}
