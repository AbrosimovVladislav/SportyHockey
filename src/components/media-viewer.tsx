'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconShare,
  IconTrash,
} from './icons';
import { colors } from '@/theme/colors';
import type { MediaItemDto } from '@/types/api';

type Props = {
  open: boolean;
  items: MediaItemDto[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  canDelete: (item: MediaItemDto) => boolean;
  onDelete: (item: MediaItemDto) => void;
  prevAriaLabel: string;
  nextAriaLabel: string;
  closeAriaLabel: string;
  deleteAriaLabel: string;
  shareAriaLabel: string;
  shareErrorLabel: string;
};

function extFromMime(mime: string | null): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

async function shareMedia(item: MediaItemDto): Promise<void> {
  const filename = `photo.${extFromMime(item.mime_type)}`;
  // 1) Web Share Level 2: shared file (iOS Safari, Android Chrome)
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const file = new File([blob], filename, {
        type: blob.type || item.mime_type || 'image/jpeg',
      });
      const data: ShareData = { files: [file] };
      const canShare =
        'canShare' in navigator &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare(data);
      if (canShare) {
        await navigator.share(data);
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
    }
    // 2) Web Share Level 1 (URL share)
    try {
      await navigator.share({ url: item.url });
      return;
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') return;
    }
  }
  // 3) Fallback: качаем как файл
  const a = document.createElement('a');
  a.href = item.url;
  a.download = filename;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function MediaViewer({
  open,
  items,
  index,
  onIndexChange,
  onClose,
  canDelete,
  onDelete,
  prevAriaLabel,
  nextAriaLabel,
  closeAriaLabel,
  deleteAriaLabel,
  shareAriaLabel,
  shareErrorLabel,
}: Props) {
  const current = items[index];
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (!current || sharing) return;
    setShareError(null);
    setSharing(true);
    try {
      await shareMedia(current);
    } catch {
      setShareError(shareErrorLabel);
    } finally {
      setSharing(false);
    }
  }, [current, sharing, shareErrorLabel]);

  const goPrev = useCallback(() => {
    if (items.length === 0) return;
    onIndexChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onIndexChange]);

  const goNext = useCallback(() => {
    if (items.length === 0) return;
    onIndexChange((index + 1) % items.length);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, goPrev, goNext]);

  if (!open || !current) return null;

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.92)',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const imgWrap: CSSProperties = {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 12px',
  };
  const img: CSSProperties = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };
  const closeBtn: CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textInverse,
    cursor: 'pointer',
  };
  const topToolbar: CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };
  const toolbarBtn: CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textInverse,
    cursor: 'pointer',
  };
  const errorBanner: CSSProperties = {
    position: 'absolute',
    top: 64,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.6)',
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 10px',
    borderRadius: 8,
    maxWidth: '80%',
    textAlign: 'center',
  };
  const arrowBtn = (side: 'left' | 'right'): CSSProperties => {
    const base: CSSProperties = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 44,
      height: 44,
      borderRadius: 22,
      background: 'rgba(255,255,255,0.15)',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textInverse,
      cursor: 'pointer',
    };
    return side === 'left' ? { ...base, left: 8 } : { ...base, right: 8 };
  };
  const counter: CSSProperties = {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 13,
    fontWeight: 600,
    color: colors.textInverse,
    background: 'rgba(0,0,0,0.5)',
    padding: '6px 12px',
    borderRadius: 12,
    fontVariantNumeric: 'tabular-nums',
  };

  const removable = canDelete(current);

  return (
    <div style={overlay} role="dialog" aria-modal="true">
      <button
        type="button"
        className="pressable"
        aria-label={closeAriaLabel}
        onClick={onClose}
        style={closeBtn}
      >
        <IconClose size={20} color={colors.textInverse} />
      </button>
      <div style={topToolbar}>
        <button
          type="button"
          className="pressable"
          aria-label={shareAriaLabel}
          onClick={handleShare}
          disabled={sharing}
          style={{ ...toolbarBtn, opacity: sharing ? 0.6 : 1 }}
        >
          <IconShare size={20} color={colors.textInverse} />
        </button>
        {removable ? (
          <button
            type="button"
            className="pressable"
            aria-label={deleteAriaLabel}
            onClick={() => onDelete(current)}
            style={toolbarBtn}
          >
            <IconTrash size={20} color={colors.textInverse} />
          </button>
        ) : null}
      </div>
      {shareError ? <div style={errorBanner}>{shareError}</div> : null}

      <div style={imgWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt="" style={img} draggable={false} />
      </div>

      {items.length > 1 ? (
        <>
          <button
            type="button"
            className="pressable"
            aria-label={prevAriaLabel}
            onClick={goPrev}
            style={arrowBtn('left')}
          >
            <IconChevronLeft size={22} color={colors.textInverse} />
          </button>
          <button
            type="button"
            className="pressable"
            aria-label={nextAriaLabel}
            onClick={goNext}
            style={arrowBtn('right')}
          >
            <IconChevronRight size={22} color={colors.textInverse} />
          </button>
          <span style={counter}>
            {index + 1} / {items.length}
          </span>
        </>
      ) : null}
    </div>
  );
}
