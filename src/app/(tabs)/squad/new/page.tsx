'use client';

import { useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import { shareURL } from '@telegram-apps/sdk-react';
import { LightHeader } from '@/components/light-header';
import { BOTTOM_NAV_HEIGHT } from '@/components/bottom-nav';
import { Button } from '@/components/button';
import { BottomSheet } from '@/components/bottom-sheet';
import { Switch } from '@/components/switch';
import { MemberForm, emptyMemberForm, type MemberFormValue } from '@/components/member-form';
import { useCreateMember } from '@/hooks/use-create-member';
import { useT } from '@/hooks/use-t';
import { useTgHeader } from '@/hooks/use-tg-header';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

export default function NewPlayerPage() {
  const t = useT();
  const router = useRouter();
  const create = useCreateMember();
  useTgHeader(colors.bg);

  const [form, setForm] = useState<MemberFormValue>(emptyMemberForm());
  const [photo, setPhoto] = useState<File | null>(null);
  const [invite, setInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/squad/roster');
  };

  const dismissKeyboard = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  };

  const onCreate = () => {
    const trimmed = form.name.trim();
    const sp = trimmed.indexOf(' ');
    const first = sp === -1 ? trimmed : trimmed.slice(0, sp);
    const last = sp === -1 ? '' : trimmed.slice(sp + 1).trim();
    const n = form.number.trim() === '' ? null : Number.parseInt(form.number, 10);
    create.mutate(
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
          invite,
        },
        photo,
      },
      {
        onSuccess: (res) => {
          if (res.invite_link) setInviteLink(res.invite_link);
          else onBack();
        },
      },
    );
  };

  // Нативный шит «Поделиться»: ссылка уже в сообщении, орг выбирает игрока из списка.
  const onShare = () => {
    if (!inviteLink) return;
    try {
      if (shareURL.isAvailable()) {
        shareURL(inviteLink, t('newMember.shareText'));
        return;
      }
    } catch {
      // вне Telegram — падаем в копирование
    }
    void onCopy();
  };

  const onCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const root: CSSProperties = { minHeight: '100dvh', background: colors.bg };
  const canSave = form.name.trim().length > 0 && !create.isPending;

  return (
    <div style={root}>
      <LightHeader title={t('newMember.title')} onBack={onBack} />

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
          variant="full"
          t={t}
        />

        <div
          style={{
            background: colors.bg,
            borderRadius: radius.lg,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
            padding: spacing['16'],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing['12'] }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...typography.bodyBold, color: colors.text }}>{t('newMember.invite')}</div>
            </div>
            <Switch checked={invite} onChange={setInvite} ariaLabel={t('newMember.invite')} />
          </div>
          <div style={{ ...typography.sm, color: colors.textSecondary, marginTop: spacing['8'] }}>
            {t('newMember.inviteHint')}
          </div>
        </div>

        {create.error ? (
          <div style={{ ...typography.sm, color: colors.error }}>{create.error.message}</div>
        ) : null}

        <Button variant="primary" size="lg" fullWidth disabled={!canSave} onClick={onCreate}>
          {t('newMember.save')}
        </Button>
      </div>

      <BottomSheet
        open={inviteLink !== null}
        onClose={() => {
          setInviteLink(null);
          onBack();
        }}
        title={t('newMember.createdTitle')}
      >
        <div style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing['16'] }}>
          {t('newMember.inviteText')}
        </div>
        {inviteLink ? (
          <div
            style={{
              ...typography.sm,
              color: colors.text,
              background: colors.bgMuted,
              borderRadius: radius.md,
              padding: spacing['12'],
              marginBottom: spacing['12'],
              wordBreak: 'break-all',
            }}
          >
            {inviteLink}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <Button variant="primary" size="lg" fullWidth onClick={onShare}>
            {t('newMember.send')}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onCopy}>
            {copied ? t('newMember.linkCopied') : t('newMember.copyLink')}
          </Button>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={() => {
              setInviteLink(null);
              onBack();
            }}
          >
            {t('newMember.done')}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
