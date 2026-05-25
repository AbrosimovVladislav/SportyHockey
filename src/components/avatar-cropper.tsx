'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Button } from '@/components/button';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const OUT_SIZE = 512;
const MAX_ZOOM = 4;

type Props = {
  file: File;
  title: string;
  hint: string;
  doneLabel: string;
  cancelLabel: string;
  onCancel: () => void;
  onDone: (cropped: File) => void;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function AvatarCropper({
  file,
  title,
  hint,
  doneLabel,
  cancelLabel,
  onCancel,
  onDone,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const [url, setUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [viewport] = useState(() =>
    typeof window !== 'undefined' ? Math.min(300, window.innerWidth - 64) : 280,
  );

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // Базовый размер «cover»: при zoom=1 картинка уже полностью закрывает квадрат.
  const coverScale = nat ? Math.max(viewport / nat.w, viewport / nat.h) : 1;
  const baseW = nat ? nat.w * coverScale : viewport;
  const baseH = nat ? nat.h * coverScale : viewport;
  const dispW = baseW * zoom;
  const dispH = baseH * zoom;

  function clampOffset(x: number, y: number, w: number, h: number) {
    return { x: clamp(x, viewport - w, 0), y: clamp(y, viewport - h, 0) };
  }

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNat({ w, h });
    const cs = Math.max(viewport / w, viewport / h);
    const bw = w * cs;
    const bh = h * cs;
    setZoom(1);
    setOffset({ x: (viewport - bw) / 2, y: (viewport - bh) / 2 });
  };

  const onZoomChange = (next: number) => {
    if (!nat) return;
    const z = clamp(next, 1, MAX_ZOOM);
    const oldW = baseW * zoom;
    const oldH = baseH * zoom;
    const newW = baseW * z;
    const newH = baseH * z;
    // Зум вокруг центра вьюпорта: точка под центром остаётся на месте.
    const cxFrac = (viewport / 2 - offset.x) / oldW;
    const cyFrac = (viewport / 2 - offset.y) / oldH;
    const nx = viewport / 2 - cxFrac * newW;
    const ny = viewport / 2 - cyFrac * newH;
    setOffset(clampOffset(nx, ny, newW, newH));
    setZoom(z);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setOffset(clampOffset(d.ox + (e.clientX - d.x), d.oy + (e.clientY - d.y), dispW, dispH));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleDone = () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    const sx = clamp((-offset.x / dispW) * nat.w, 0, nat.w);
    const sy = clamp((-offset.y / dispH) * nat.h, 0, nat.h);
    const sW = Math.min((viewport / dispW) * nat.w, nat.w - sx);
    const sH = Math.min((viewport / dispH) * nat.h, nat.h - sy);

    const canvas = document.createElement('canvas');
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const cx = canvas.getContext('2d');
    if (!cx) return;
    cx.drawImage(img, sx, sy, sW, sH, 0, 0, OUT_SIZE, OUT_SIZE);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onDone(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.9,
    );
  };

  const overlay: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(0,0,0,0.92)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['20'],
    padding: spacing['20'],
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label={title}>
      <div style={{ ...typography.bodyBold, color: '#fff', textAlign: 'center' }}>{title}</div>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          width: viewport,
          height: viewport,
          overflow: 'hidden',
          touchAction: 'none',
          cursor: 'grab',
          flexShrink: 0,
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={url}
            alt=""
            draggable={false}
            onLoad={onImgLoad}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: dispW,
              height: dispH,
              maxWidth: 'none',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : null}
        {/* Круглая маска-подсказка: затемняет всё за пределами кружка */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            border: '2px solid rgba(255,255,255,0.9)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <input
        type="range"
        min={1}
        max={MAX_ZOOM}
        step={0.01}
        value={zoom}
        onChange={(e) => onZoomChange(Number(e.target.value))}
        aria-label={hint}
        style={{ width: viewport, accentColor: colors.primary }}
      />
      <div style={{ ...typography.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
        {hint}
      </div>

      <div style={{ display: 'flex', gap: spacing['8'], width: viewport }}>
        <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="primary" size="lg" fullWidth onClick={handleDone}>
          {doneLabel}
        </Button>
      </div>
    </div>
  );
}
