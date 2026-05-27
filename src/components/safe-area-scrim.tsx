import type { CSSProperties } from 'react';

// Глобальное затемнение «опасной зоны» сверху (статус-бар Apple + кнопки телеграма)
// в полноэкранном режиме. Фиксировано у верхней кромки экрана, на всех страницах:
// плотно-тёмное у кромки → прозрачное к концу зоны кнопок. Не перехватывает тапы.
// Вне fullscreen --app-safe-top = 0 → высота 0, скрим не виден.
const style: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 'var(--app-safe-top)',
  background:
    'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.88) 45%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0) 100%)',
  pointerEvents: 'none',
  zIndex: 50,
};

export function SafeAreaScrim() {
  return <div style={style} aria-hidden />;
}
