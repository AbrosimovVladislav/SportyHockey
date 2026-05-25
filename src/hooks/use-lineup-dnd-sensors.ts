'use client';

import { PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

// Единые параметры активации drag-and-drop для всех экранов состава
// (событие: звенья/команды; команда: звенья/тренировка). Меняй здесь — применится везде.
export const DRAG_ACTIVATION = {
  pointerDistance: 8, // мышь/трекпад — смещение в px до старта drag
  touchDelay: 300, // тач — длительность зажатия в мс до старта drag
  touchTolerance: 8, // тач — допуск смещения пальца во время зажатия в px
} as const;

// enabled=false → сенсоры не подключаются (drag отключён, напр. для не-организатора).
export function useLineupDndSensors(enabled = true) {
  const pointer = useSensor(PointerSensor, {
    activationConstraint: { distance: DRAG_ACTIVATION.pointerDistance },
  });
  const touch = useSensor(TouchSensor, {
    activationConstraint: {
      delay: DRAG_ACTIVATION.touchDelay,
      tolerance: DRAG_ACTIVATION.touchTolerance,
    },
  });
  return useSensors(...(enabled ? [pointer, touch] : []));
}
