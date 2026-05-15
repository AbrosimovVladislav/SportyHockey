export const colors = {
  bg: 'var(--tg-theme-bg-color)',
  secondaryBg: 'var(--tg-theme-secondary-bg-color)',
  text: 'var(--tg-theme-text-color)',
  hint: 'var(--tg-theme-hint-color)',
  link: 'var(--tg-theme-link-color)',
  accent: 'var(--tg-theme-accent-text-color)',
  button: 'var(--tg-theme-button-color)',
  buttonText: 'var(--tg-theme-button-text-color)',
  destructive: 'var(--tg-theme-destructive-text-color)',
  header: 'var(--tg-theme-header-bg-color)',
  separator: 'var(--tg-theme-section-separator-color)',
  sectionBg: 'var(--tg-theme-section-bg-color)',
  subtitle: 'var(--tg-theme-subtitle-text-color)',
} as const;

export type ColorToken = keyof typeof colors;
