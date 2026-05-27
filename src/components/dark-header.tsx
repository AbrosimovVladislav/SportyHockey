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
  // Полноэкранный режим: картинка идёт с самой кромки экрана (top:0) — в т.ч. под
  // статус-баром и телеграм-кнопками. Контент опускаем ниже «опасной зоны».
  // Вне fullscreen --app-safe-top = 0 → всё как было.
  const wrapper: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    background: colors.headerBg,
    color: colors.textInverse,
    paddingTop: `calc(${paddingTop}px + var(--app-safe-top))`,
    paddingBottom: imageSrc ? spacing['32'] : spacing['20'],
    paddingLeft: spacing['20'],
    paddingRight: spacing['20'],
    // Высота = «чистая» зона картинки + опасная зона сверху (её перекрывает глобальный скрим).
    minHeight: imageSrc ? `calc(252px + var(--app-safe-top))` : undefined,
    display: 'flex',
    flexDirection: 'column',
  };

  // Картинка заполняет весь хедер от самого верха.
  const imageLayer: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `url(${imageSrc}) center/cover no-repeat`,
    zIndex: 0,
  };

  // Затемнение опасной зоны сверху теперь общее для всех страниц — глобальный
  // <SafeAreaScrim/> в корневом layout. Здесь только нижнее затемнение под заголовок.

  // Лёгкое затемнение только у самого низа — под белый заголовок (на светлой картинке
  // иначе не читается). Верхние ~55% картинки остаются чистыми.
  const bottomScrim: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.8) 100%)',
    zIndex: 1,
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
      {imageSrc ? (
        <>
          <div style={imageLayer} aria-hidden />
          <div style={bottomScrim} aria-hidden />
        </>
      ) : null}
      <div style={content}>
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
    </div>
  );
}
