'use client';

import { useRef, type CSSProperties } from 'react';
import { Button } from './button';
import { IconCloudUp, IconImage } from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Props = {
  title: string;
  hint: string;
  buttonLabel: string;
  busyLabel: string;
  busy?: boolean;
  onFiles: (files: File[]) => void;
};

export function MediaUploadCard({
  title,
  hint,
  buttonLabel,
  busyLabel,
  busy = false,
  onFiles,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const wrap: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['12'],
    padding: spacing['24'],
    background: colors.bgMuted,
    border: `2px dashed ${colors.line}`,
    borderRadius: radius.lg,
  };
  const iconCircle: CSSProperties = {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: colors.bg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.headerBg,
  };
  const titleStyle: CSSProperties = {
    fontSize: 17,
    fontWeight: 700,
    color: colors.text,
    textAlign: 'center',
  };
  const hintStyle: CSSProperties = {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  };

  return (
    <div style={wrap}>
      <span style={iconCircle}>
        <IconCloudUp size={28} color={colors.headerBg} />
      </span>
      <div style={titleStyle}>{title}</div>
      <div style={hintStyle}>{hint}</div>
      <Button
        size="lg"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        style={{ background: colors.headerBg, color: colors.textInverse, minWidth: 200 }}
      >
        <IconImage size={18} color={colors.textInverse} />
        {busy ? busyLabel : buttonLabel}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          e.currentTarget.value = '';
          if (files.length > 0) onFiles(files);
        }}
      />
    </div>
  );
}
