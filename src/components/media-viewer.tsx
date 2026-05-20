'use client';

import { useCallback, useEffect, type CSSProperties } from 'react';
import { IconChevronLeft, IconChevronRight, IconClose, IconTrash } from './icons';
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
};

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
}: Props) {
  const current = items[index];

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
  const deleteBtn: CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
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
      {removable ? (
        <button
          type="button"
          className="pressable"
          aria-label={deleteAriaLabel}
          onClick={() => onDelete(current)}
          style={deleteBtn}
        >
          <IconTrash size={20} color={colors.textInverse} />
        </button>
      ) : null}

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
