import { ru, type TKey } from '@/i18n/ru';

export function useT() {
  return (key: TKey): string => ru[key];
}
