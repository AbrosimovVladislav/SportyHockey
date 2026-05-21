export const colors = {
  // Primary
  primary: '#1A5C35',
  primaryDark: '#14472A',
  primaryLight: '#E8F5EC',
  primaryHover: '#165C2E',

  // Header (dark green)
  headerBg: '#233F30',
  headerAccent: '#1A6B3C',
  headerMuted: 'rgba(255,255,255,0.55)',
  headerGlass: 'rgba(255,255,255,0.12)',

  // Surfaces
  bg: '#FFFFFF',
  bgWarm: '#F7F5F0',
  bgMuted: '#F5F5F5',
  bgOffWhite: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceWarm: '#F0EDE6',
  surfaceMuted: '#EBE8E1',
  cardSchedule: '#F3F4F3',
  track: '#EFEDE7',
  iconBg: '#D6E4DB',
  iconFg: '#3A7A50',
  iconMuted: '#C4C4C4',
  primaryDrop: 'rgba(232, 79, 0, 0.06)',

  // Lines & borders
  divider: '#E8E8E8',
  border: '#E0E0E0',
  borderSoft: '#D6D3CD',
  chipBorder: '#D0D0D0',
  line: '#EBEBEB',

  // Text
  text: '#1C1C1E',
  textSecondary: '#6B7280',
  textTertiary: '#AEAEB2',
  textInverse: '#FFFFFF',
  tabInactive: '#8A8C8C',
  navInactive: '#ABABAB',

  // Semantic
  success: '#34C759',
  successDark: '#1E8E3E',
  successBg: '#E8F5EC',
  successText: '#1A5C35',

  warning: '#FF9500',
  warningDark: '#C77800',
  warningBg: '#FFF8E1',
  warningText: '#8B6914',

  error: '#D32F2F',
  errorDark: '#B71C1C',
  errorBg: '#FFEBEE',
  errorText: '#C62828',

  // Tournament / gold
  gold: '#C09A38',
  goldBg: '#EDE3C5',
  goldText: '#8B6914',
} as const;

export type ColorToken = keyof typeof colors;

// Avatar gradient tones — 6 pairs (from / to)
export const avatarTones: ReadonlyArray<readonly [string, string]> = [
  ['#8E9AAB', '#5C6B7F'],
  ['#B4A78F', '#7A6E58'],
  ['#9CAFA2', '#5E7269'],
  ['#A99B8E', '#6E5F50'],
  ['#8FA0AE', '#5B6A78'],
  ['#9C9890', '#6B655B'],
];
