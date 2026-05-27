import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  title: string;
  role?: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  paddingTop?: number;
  imageSrc?: string;
};

export function DarkHeader({ title, role, subtitle, badge, left, right, paddingTop = spacing['12'], imageSrc }: Props) {
  // Полноэкранный режим: хедер занимает экран от самой кромки. Тёмный фон-основа
  // лежит под всем; контент опускаем ниже «опасной зоны» (статус-бар + телеграм-кнопки).
  // Вне fullscreen --app-safe-top и safe-area-top = 0 → всё как было.
  const wrapper: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: colors.headerBg,
    color: colors.textInverse,
    paddingTop: `calc(${paddingTop}px + var(--app-safe-top))`,
    paddingBottom: imageSrc ? spacing['32'] : spacing['20'],
    paddingLeft: spacing['20'],
    paddingRight: spacing['20'],
    // Картинку начинаем от зоны телеграм-кнопок (см. imageLayer), поэтому полную высоту
    // считаем как исходные 234 + высота статус-бара — кадр картинки остаётся как раньше.
    minHeight: imageSrc ? `calc(234px + var(--tg-viewport-safe-area-inset-top))` : undefined,
    display: 'flex',
    flexDirection: 'column',
  };

  // Картинка стартует там, где начинаются телеграм-кнопки (ниже статус-бара) — выше неё
  // всё равно затемнение, тянуть под самый верх незачем; так кадр не «приближается».
  const imageLayer: CSSProperties = {
    position: 'absolute',
    top: 'var(--tg-viewport-safe-area-inset-top)',
    left: 0,
    right: 0,
    bottom: 0,
    background: `url(${imageSrc}) center/cover no-repeat`,
    zIndex: 0,
  };

  // Затемнение для читаемости заголовка внизу.
  const bottomScrim: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.82) 100%)',
    zIndex: 1,
  };

  // Затемнение опасной зоны: плотное у самой кромки (часы/батарея), к концу зоны
  // телеграм-кнопок сходит в прозрачность — кнопки телеги читаются на картинке.
  const topScrim: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 'calc(var(--app-safe-top) + 14px)',
    background:
      'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)',
    zIndex: 2,
  };

  const content: CSSProperties = {
    position: 'relative',
    zIndex: 3,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  };

  const topRow: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: left || right ? spacing['12'] : 0,
    minHeight: 40,
  };

  const roleStyle: CSSProperties = {
    fontSize: 13,
    color: colors.headerMuted,
    marginBottom: spacing['4'],
    letterSpacing: 0.1,
  };

  const titleStyle: CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    color: colors.textInverse,
    letterSpacing: '-0.02em',
    lineHeight: 1.15,
  };

  const titleGroupStyle: CSSProperties = {
    marginTop: 'auto',
  };

  return (
    <div style={wrapper}>
      {(left || right) && (
        <div style={topRow}>
          <div>{left}</div>
          <div>{right}</div>
        </div>
      )}
      <div style={titleGroupStyle}>
        {badge ? <div style={{ marginBottom: spacing['8'] }}>{badge}</div> : null}
        {role ? <div style={roleStyle}>{role}</div> : null}
        <div style={titleStyle}>{title}</div>
        {subtitle ? <div style={{ marginTop: spacing['4'] }}>{subtitle}</div> : null}
      </div>
    </div>
  );
}
