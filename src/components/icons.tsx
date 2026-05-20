import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
};

function Svg({
  size = 24,
  color = 'currentColor',
  children,
  strokeWidth = 1.7,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 11.5L12 4l8 7.5" />
    <path d="M6 10v8.5a1 1 0 001 1h3.5v-4.5h3v4.5H17a1 1 0 001-1V10" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
    <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
    <line x1="8" y1="2.5" x2="8" y2="6" />
    <line x1="16" y1="2.5" x2="16" y2="6" />
  </Svg>
);

export const IconRuble = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.7" />
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fill={color}
      fontSize="13"
      fontWeight="600"
      fontFamily="inherit"
    >
      ₽
    </text>
  </svg>
);

export const IconPeople = (p: IconProps) => (
  <Svg {...p} viewBox="0 0 28 24">
    <circle cx="11" cy="8" r="3.5" />
    <path d="M4 20c0-3.3 3-6 7-6s7 2.7 7 6" />
    <circle cx="19" cy="9" r="2.8" strokeWidth="1.5" />
    <path d="M22 20c1.8-.8 3-2.5 3-4.5 0-1.8-1-3.3-2.5-4" strokeWidth="1.5" />
  </Svg>
);

export const IconMore = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...p}>
    <circle cx="6" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="18" cy="12" r="1.8" />
  </svg>
);

export const IconMenu = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.8}>
    <path d="M3 6h18M3 12h18M3 18h18" />
  </Svg>
);

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3a6 6 0 00-6 6v3.5L4 15h16l-2-2.5V9a6 6 0 00-6-6z" />
    <path d="M9.5 19a2.5 2.5 0 005 0" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6.5V12.5L15.5 14.5" />
  </Svg>
);

export const IconTrophy = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.6}>
    <path d="M7 3h10v7c0 2.8-2.2 5-5 5s-5-2.2-5-5V3z" />
    <path d="M7 5.5H4.8v1.8c0 1.5 1.2 2.7 2.7 2.7" strokeWidth="1.4" />
    <path d="M17 5.5h2.2v1.8c0 1.5-1.2 2.7-2.7 2.7" strokeWidth="1.4" />
    <line x1="12" y1="15" x2="12" y2="18" />
    <path d="M9 18h6" />
  </Svg>
);

export const IconChevronLeft = ({ size = 12, color = '#C4C4C4', ...p }: IconProps) => (
  <svg width={size * 0.6} height={size} viewBox="0 0 7 12" fill="none" {...p}>
    <path
      d="M6 1L1 6l5 5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconChevronDown = ({ size = 12, color = '#C4C4C4', ...p }: IconProps) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 12 7" fill="none" {...p}>
    <path
      d="M1 1l5 5 5-5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconChevronRight = ({ size = 12, color = '#C4C4C4', ...p }: IconProps) => (
  <svg width={size * 0.6} height={size} viewBox="0 0 7 12" fill="none" {...p}>
    <path
      d="M1 1l5 5-5 5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.5}>
    <path d="M12 4v16M4 12h16" />
  </Svg>
);

export const IconBack = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.5}>
    <path d="M20 6L9 17l-5-5" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p} strokeWidth={2.2}>
    <path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);

export const IconPerson = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 21c.8-3.6 3.6-6 7-6s6.2 2.4 7 6" />
  </Svg>
);

export const IconWallet = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
    <path d="M3 9.5h14a2 2 0 012 2v3a2 2 0 01-2 2H3" />
    <circle cx="16" cy="13" r="1.2" fill={p.color ?? 'currentColor'} stroke="none" />
  </Svg>
);

export const IconLocation = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12a8 8 0 0114-5.3" />
    <path d="M20 12a8 8 0 01-13 6.3L4 19l.7-3A8 8 0 0120 12z" />
  </Svg>
);

export const IconShirt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 4l3 2 3-2 5 2-1 4-3-1v11H7V9L4 10 3 6l6-2z" />
  </Svg>
);

export const IconStats = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.8}>
    <line x1="6" y1="20" x2="6" y2="13" />
    <line x1="12" y1="20" x2="12" y2="8" />
    <line x1="18" y1="20" x2="18" y2="15" />
  </Svg>
);

export const IconExternal = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.8}>
    <path d="M14 4h6v6" />
    <path d="M20 4L11 13" />
    <path d="M19 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" />
  </Svg>
);

export const IconCloudUp = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M7 18a4 4 0 01-.34-7.99 6 6 0 0111.7-1.55A4.5 4.5 0 0117 18h-2.5"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 12v8m0-8l-3 3m3-3l3 3"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconShare = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M12 3v13M8 7l4-4 4 4"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 12H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2h-1"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconSort = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M7 4v16m0 0l-3-3m3 3l3-3M17 20V4m0 0l-3 3m3-3l3 3"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconTrash = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
    <path
      d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m-7 0v12a2 2 0 002 2h6a2 2 0 002-2V7"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconImage = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M21 17l-5-5-7 7" />
  </Svg>
);

export const IconInfo = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16.5" />
    <circle cx="12" cy="8" r="0.8" fill={p.color ?? 'currentColor'} stroke="none" />
  </Svg>
);

export const IconWhistle = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.7}>
    <path d="M3 12.5a5.5 5.5 0 005.5 5.5h2a5.5 5.5 0 005.5-5.5V11h2.5a1.5 1.5 0 001.5-1.5v-1A1.5 1.5 0 0018.5 7H8.5A5.5 5.5 0 003 12.5z" />
    <circle cx="8.5" cy="12.5" r="1" fill={p.color ?? 'currentColor'} stroke="none" />
  </Svg>
);

export const IconStick = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.7}>
    <path d="M4 18l9-12 4 3-9 12-4-3z" />
    <path d="M13 6l4 3" />
    <circle cx="18.5" cy="18.5" r="1.5" />
  </Svg>
);

export const IconSticksCrossed = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d="M4 4l13 13" />
    <path d="M17 17l2 2.5" />
    <path d="M20 4L7 17" />
    <path d="M7 17l-2 2.5" />
    <circle cx="4.5" cy="20" r="1" fill={color} stroke="none" />
    <circle cx="19.5" cy="20" r="1" fill={color} stroke="none" />
  </svg>
);

export const IconStopwatch = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.7}>
    <circle cx="12" cy="13" r="8" />
    <path d="M9 3h6" />
    <path d="M12 9v4l2.5 2" />
  </Svg>
);

export const IconSparkle = (p: IconProps) => (
  <Svg {...p} strokeWidth={1.7}>
    <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" />
    <path d="M19 4l.7 1.8L21.5 6.5l-1.8.7L19 9l-.7-1.8L16.5 6.5l1.8-.7L19 4z" strokeWidth="1.4" />
  </Svg>
);

export const IconCheckCircle = ({ size = 24, color = 'currentColor', ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...p}>
    <circle cx="12" cy="12" r="10" fill={color} />
    <path d="M7 12l3.5 3.5L17 9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
