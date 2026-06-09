'use client';

import { useRef, useState, type CSSProperties } from 'react';
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
import { SectionImagesBlock } from './section-images-block';

// Вкладка «Общее»: название, логотип, картинки разделов.
// Старое поле «Командная фотография» (teams.photo_url) убрано из UI — его
// заменила секция `team` в новом аккордионе `SectionImagesBlock`. В БД поле
// осталось для бота / постеров, но в настройках команды больше не редактируется.

const LOGO_PREVIEW = 36;

type Props = { settings: TeamSettingsDto | null };

export function GeneralTab({ settings }: Props) {
  const t = useT();
  const update = useUpdateTeamSettings();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const name = settings?.name ?? '';
  const logoUrl = settings?.logo_url ?? null;

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

  async function pickAndUploadLogo(file: File | null | undefined) {
    if (!file) return;
    setUploadError(null);
    try {
      await update.mutateAsync({ body: {}, upload: { kind: 'logo', file } });
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
            void pickAndUploadLogo(f);
          }}
        />
      </section>

      <SectionImagesBlock />
      {uploadError ? (
        <div style={{ fontSize: 13, color: colors.error }}>{uploadError}</div>
      ) : null}

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

