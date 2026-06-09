'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { Card } from '@/components/card';
import { IconChevronDown, IconImage } from '@/components/icons';
import {
  useResetSectionImage,
  useTeamSectionImages,
  useUploadSectionImage,
  SectionImageUploadError,
} from '@/hooks/use-team-section-images';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import type { SectionImageKey } from '@/types/api';
import { SectionHeader } from './section-header';

// Аккордион «Изображения разделов» внутри вкладки «Общее». Раскрывается из
// заголовка с шевроном, внутри — пять строк по одному разделу: превью + имя
// + кнопки «Заменить» / «Сбросить». Дефолтные картинки лежат в /public/.

type SectionRow = {
  key: SectionImageKey;
  defaultSrc: string;
};

const ROWS: SectionRow[] = [
  { key: 'home', defaultSrc: '/main.png' },
  { key: 'team', defaultSrc: '/team.png' },
  { key: 'events_list', defaultSrc: '/bus.png' },
  { key: 'money', defaultSrc: '/money.png' },
];

export function SectionImagesBlock() {
  const t = useT();
  const imagesQ = useTeamSectionImages();
  const upload = useUploadSectionImage();
  const reset = useResetSectionImage();
  const [expanded, setExpanded] = useState(false);
  const [activeRow, setActiveRow] = useState<SectionImageKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function pick(section: SectionImageKey) {
    setActiveRow(section);
    setError(null);
    inputRef.current?.click();
  }

  async function handleFile(file: File | null) {
    if (!file || !activeRow) {
      setActiveRow(null);
      return;
    }
    try {
      await upload.mutateAsync({ section: activeRow, file });
    } catch (e) {
      if (e instanceof SectionImageUploadError) setError(e.message);
      else setError(t('teamSettings.uploadError'));
    } finally {
      setActiveRow(null);
    }
  }

  async function handleReset(section: SectionImageKey) {
    setError(null);
    try {
      await reset.mutateAsync({ section });
    } catch {
      setError(t('teamSettings.uploadError'));
    }
  }

  const data = imagesQ.data ?? null;

  const header: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: `${spacing['12']}px ${spacing['16']}px`,
    background: colors.bgMuted,
    borderRadius: radius.md,
    border: 'none',
    width: '100%',
    color: colors.text,
    fontSize: 15,
    fontWeight: 700,
  };
  const chevron: CSSProperties = {
    transition: 'transform 150ms ease',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  };

  return (
    <section>
      <SectionHeader>{t('teamSettings.sectionImages.title')}</SectionHeader>
      <button
        type="button"
        className="pressable"
        onClick={() => setExpanded((x) => !x)}
        style={header}
        aria-expanded={expanded}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: spacing['8'] }}>
          <IconImage size={20} color={colors.iconFg} />
          {t('teamSettings.sectionImages.title')}
        </span>
        <span style={chevron} aria-hidden>
          <IconChevronDown size={20} color={colors.iconFg} />
        </span>
      </button>

      {expanded ? (
        <div style={{ marginTop: spacing['12'] }}>
        <Card variant="surface" padding={spacing['12']}>
          <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing['12'] }}>
            {t('teamSettings.sectionImages.description')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
            {ROWS.map((r) => {
              const custom = data?.[r.key] ?? null;
              const src = custom ?? r.defaultSrc;
              const busy =
                (upload.isPending && activeRow === r.key) ||
                (reset.isPending && custom !== null && activeRow === null);
              return (
                <SectionRowView
                  key={r.key}
                  src={src}
                  title={t(`teamSettings.sectionImages.section.${r.key}` as const)}
                  status={
                    custom
                      ? t('teamSettings.sectionImages.status.custom')
                      : t('teamSettings.sectionImages.status.default')
                  }
                  hasCustom={!!custom}
                  replaceLabel={t('teamSettings.sectionImages.replace')}
                  resetLabel={t('teamSettings.sectionImages.reset')}
                  busy={busy}
                  onReplace={() => pick(r.key)}
                  onReset={() => void handleReset(r.key)}
                />
              );
            })}
          </div>
          {error ? (
            <div style={{ marginTop: spacing['8'], fontSize: 13, color: colors.error }}>
              {error}
            </div>
          ) : null}
        </Card>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = '';
          void handleFile(f);
        }}
      />
    </section>
  );
}

type RowProps = {
  src: string;
  title: string;
  status: string;
  hasCustom: boolean;
  replaceLabel: string;
  resetLabel: string;
  busy: boolean;
  onReplace: () => void;
  onReset: () => void;
};

function SectionRowView({
  src,
  title,
  status,
  hasCustom,
  replaceLabel,
  resetLabel,
  busy,
  onReplace,
  onReset,
}: RowProps) {
  const row: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['12'],
    padding: `${spacing['8']}px 0`,
    borderBottom: `1px solid ${colors.border}`,
  };
  const thumb: CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    background: `url(${src}) center/cover no-repeat`,
    border: `1px solid ${colors.border}`,
    flexShrink: 0,
  };
  const meta: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0,
  };
  const actions: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['6'],
    flexShrink: 0,
  };
  const btn: CSSProperties = {
    padding: `${spacing['8']}px ${spacing['12']}px`,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.primary,
    borderRadius: radius.sm,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  };
  const resetBtn: CSSProperties = { ...btn, color: colors.textSecondary };

  return (
    <div style={row}>
      <div style={thumb} aria-hidden />
      <div style={meta}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{title}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>{status}</div>
      </div>
      <div style={actions}>
        <button
          type="button"
          className="pressable"
          onClick={onReplace}
          disabled={busy}
          style={{ ...btn, opacity: busy ? 0.6 : 1 }}
        >
          {replaceLabel}
        </button>
        {hasCustom ? (
          <button
            type="button"
            className="pressable"
            onClick={onReset}
            disabled={busy}
            style={{ ...resetBtn, opacity: busy ? 0.6 : 1 }}
          >
            {resetLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
