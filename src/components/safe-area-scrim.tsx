import type { CSSProperties } from 'react';

// Глобальное затемнение «опасной зоны» сверху (статус-бар Apple + кнопки телеграма)
// в полноэкранном режиме. Фиксировано у верхней кромки экрана, на всех страницах.
// Цвет адаптивный через --app-top-scrim: тёмный градиент включают экраны с тёмной
// шапкой (DarkHeader), на светлых экранах переменная не задана → прозрачно (тёмное
// пятно на белом фоне выглядит грязно, а статус-бар/кнопки там и так тёмные).
// Вне fullscreen --app-safe-top = 0 → высота 0, скрим не виден.
const style: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 'var(--app-safe-top)',
  background: 'var(--app-top-scrim, transparent)',
  pointerEvents: 'none',
  zIndex: 50,
};

export function SafeAreaScrim() {
  return <div style={style} aria-hidden />;
}
