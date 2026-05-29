'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Card } from '@/components/card';
import { ListRow } from '@/components/list-row';
import { BottomSheet } from '@/components/bottom-sheet';
import { IconBadgeCheck, IconImage } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { useUpdateTeamSettings, UploadError } from '@/hooks/use-update-team-settings';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { TeamSettingsDto } from '@/types/api';
import { SectionHeader } from './section-header';

// Вкладка «Общее»: название, логотип, командная фотография.
// Кропа нет — изображения грузятся как есть.

const LOGO_PREVIEW = 36;

type Props = { settings: TeamSettingsDto | null };

export function GeneralTab({ settings }: Props) {
  const t = useT();
  const update = useUpdateTeamSettings();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const name = settings?.name ?? '';
  const logoUrl = settings?.logo_url ?? null;
  const photoUrl = settings?.photo_url ?? null;

  function openNameSheet() {
    setNameDraft(name);
    setEditingName(true);
  }

  async function submitName() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === name) {
      setEditingName(false);
      return;
    }
    try {
      await update.mutateAsync({ body: { name: trimmed } });
      setEditingName(false);
    } catch {
      // Ошибки PATCH'а ловит верхний обработчик; сама форма остаётся открытой.
    }
  }

  async function pickAndUpload(kind: 'logo' | 'photo', file: File | null | undefined) {
    if (!file) return;
    setUploadError(null);
    try {
      await update.mutateAsync({ body: {}, upload: { kind, file } });
    } catch (e) {
      if (e instanceof UploadError) {
        setUploadError(e.message);
      } else {
        setUploadError(t('teamSettings.uploadError'));
      }
    }
  }

  const logoRight: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['8'],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['20'] }}>
      <section>
        <SectionHeader>{t('teamSettings.general.section.team')}</SectionHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          <ListRow
            icon={<IconBadgeCheck size={20} color={colors.iconFg} />}
            title={t('teamSettings.general.name')}
            subtitle={name}
            onClick={openNameSheet}
          />
          <ListRow
            icon={<IconImage size={20} color={colors.iconFg} />}
            title={t('teamSettings.general.logo')}
            onClick={() => logoInputRef.current?.click()}
            right={
              <div style={logoRight}>
                <LogoPreview src={logoUrl} />
              </div>
            }
            showChevron={false}
          />
        </div>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = '';
            void pickAndUpload('logo', f);
          }}
        />
      </section>

      <section>
        <SectionHeader>{t('teamSettings.general.section.appearance')}</SectionHeader>
        <Card variant="surface" padding={spacing['16']}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: colors.text,
              marginBottom: spacing['12'],
            }}
          >
            {t('teamSettings.general.photo')}
          </div>
          <PhotoPreview src={photoUrl} placeholder={t('teamSettings.general.photo.empty')} />
          <button
            type="button"
            className="pressable"
            onClick={() => photoInputRef.current?.click()}
            style={{
              marginTop: spacing['12'],
              width: '100%',
              padding: `${spacing['12']}px ${spacing['16']}px`,
              borderRadius: radius.md,
              border: 'none',
              background: colors.bgMuted,
              color: colors.primary,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('teamSettings.general.photo.change')}
          </button>
          {uploadError ? (
            <div
              style={{
                marginTop: spacing['8'],
                fontSize: 13,
                color: colors.error,
              }}
            >
              {uploadError}
            </div>
          ) : null}
        </Card>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = '';
            void pickAndUpload('photo', f);
          }}
        />
      </section>

      <BottomSheet
        open={editingName}
        onClose={() => setEditingName(false)}
        title={t('teamSettings.name.sheet.title')}
      >
        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder={t('teamSettings.name.sheet.placeholder')}
          autoFocus
          style={{
            width: '100%',
            padding: `${spacing['12']}px ${spacing['16']}px`,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            fontSize: 16,
            marginBottom: spacing['12'],
            background: colors.bgMuted,
            color: colors.text,
          }}
        />
        <button
          type="button"
          className="pressable"
          onClick={() => void submitName()}
          disabled={!nameDraft.trim() || update.isPending}
          style={primaryButton}
        >
          {t('teamSettings.save')}
        </button>
      </BottomSheet>
    </div>
  );
}

const primaryButton: CSSProperties = {
  width: '100%',
  padding: `${spacing['12']}px ${spacing['16']}px`,
  borderRadius: radius.md,
  border: 'none',
  background: colors.primary,
  color: colors.textInverse,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};

function LogoPreview({ src }: { src: string | null }) {
  const box: CSSProperties = {
    width: LOGO_PREVIEW,
    height: LOGO_PREVIEW,
    borderRadius: '50%',
    background: src ? `url(${src}) center/cover no-repeat` : colors.bgMuted,
    border: `1px solid ${colors.border}`,
    flexShrink: 0,
  };
  return <div style={box} aria-hidden />;
}

function PhotoPreview({ src, placeholder }: { src: string | null; placeholder: string }) {
  if (!src) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '4 / 5',
          borderRadius: radius.md,
          background: colors.bgMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.textSecondary,
          fontSize: 13,
          textAlign: 'center',
          padding: spacing['16'],
        }}
      >
        {placeholder}
      </div>
    );
  }
  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '4 / 5',
        borderRadius: radius.md,
        background: `url(${src}) center/cover no-repeat`,
      }}
      aria-hidden
    />
  );
}
