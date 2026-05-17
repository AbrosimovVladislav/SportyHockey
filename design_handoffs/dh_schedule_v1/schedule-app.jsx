// schedule-app.jsx — Hockey Schedule Screen Components

const C = {
  bg: '#233F30',
  green: '#1A6B3C',
  card: '#F3F4F3',
  iconBg: '#D6E4DB',
  iconC: '#3A7A50',
  goldBg: '#EDE3C5',
  goldC: '#C09A38',
  text: '#1A1A1A',
  sub: '#8A8C8C',
  chipBorder: '#D0D0D0',
  line: '#EBEBEB',
};
const F = "-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";

/* ── Icons ───────────────────────────────────────────────── */

const IconMenu = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
    <path d="M1 1.5h18M1 7h18M1 12.5h18" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconBell = () => (
  <svg width="23" height="25" viewBox="0 0 23 25" fill="none">
    <path d="M11.5 2C7.9 2 5 5.1 5 8.5V14l-2.2 2.8h16.4L17 14V8.5C17 5.1 14.1 2 11.5 2z"
      stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"/>
    <path d="M9 20a2.7 2.7 0 005 0" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

const IconClock = ({ color = C.iconC, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1.7"/>
    <path d="M11 5.5V11.5L14.5 13.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconTrophy = ({ color = C.iconC, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <path d="M6 3h10v6.5c0 2.8-2.2 5-5 5s-5-2.2-5-5V3z" stroke={color} strokeWidth="1.6"/>
    <path d="M6 5.5H3.8v1.8c0 1.5 1.2 2.7 2.7 2.7" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M16 5.5h2.2v1.8c0 1.5-1.2 2.7-2.7 2.7" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="11" y1="14.5" x2="11" y2="17.5" stroke={color} strokeWidth="1.6"/>
    <path d="M8 17.5h6" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    <circle cx="11" cy="7.5" r="1.2" fill={color} opacity="0.5"/>
  </svg>
);

const IconChevron = ({ color = '#C4C4C4' }) => (
  <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
    <path d="M1 1l5 5-5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconHome = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 11.5L12 4l8 7.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 10v8.5a1 1 0 001 1h3.5v-4.5h3v4.5H17a1 1 0 001-1V10" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCalendar = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" stroke={color} strokeWidth="1.7"/>
    <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke={color} strokeWidth="1.7"/>
    <line x1="8" y1="2.5" x2="8" y2="6" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    <line x1="16" y1="2.5" x2="16" y2="6" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    <circle cx="8" cy="14" r="1" fill={color}/><circle cx="12" cy="14" r="1" fill={color}/>
    <circle cx="16" cy="14" r="1" fill={color}/><circle cx="8" cy="17.5" r="1" fill={color}/>
  </svg>
);

const IconMoney = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="1.7"/>
    <text x="12" y="16.5" textAnchor="middle" fill={color} fontSize="13" fontWeight="600"
      fontFamily="-apple-system, system-ui">₽</text>
  </svg>
);

const IconPeople = ({ color }) => (
  <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
    <circle cx="11" cy="8" r="3.5" stroke={color} strokeWidth="1.7"/>
    <path d="M4 20c0-3.3 3-6 7-6s7 2.7 7 6" stroke={color} strokeWidth="1.7" strokeLinecap="round"/>
    <circle cx="19" cy="9" r="2.8" stroke={color} strokeWidth="1.5"/>
    <path d="M22 20c1.8-.8 3-2.5 3-4.5 0-1.8-1-3.3-2.5-4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconMore = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="6" cy="12" r="1.8" fill={color}/>
    <circle cx="12" cy="12" r="1.8" fill={color}/>
    <circle cx="18" cy="12" r="1.8" fill={color}/>
  </svg>
);

const IconPlus = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 3v16M3 11h16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/* ── Header ──────────────────────────────────────────────── */

function AppHeader() {
  return (
    <div style={{ background: C.bg, paddingTop: 58, paddingBottom: 28, paddingLeft: 20, paddingRight: 20, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><IconMenu /></div>
        <div style={{ position: 'relative', marginRight: 4 }}>
          <IconBell />
          <div style={{
            position: 'absolute', top: -1, right: -2,
            width: 11, height: 11, borderRadius: 6,
            background: '#34C759',
            border: `2.5px solid ${C.bg}`,
          }}></div>
        </div>
      </div>
      <div style={{ fontFamily: F, fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 4, letterSpacing: 0.1 }}>
        Капитан
      </div>
      <div style={{ fontFamily: F, fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>
        Расписание
      </div>
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────── */

function ScheduleTabs() {
  const [active, setActive] = React.useState('list');
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}`, flexShrink: 0 }}>
      {[{ id: 'list', label: 'Список' }, { id: 'cal', label: 'Календарь' }].map(t => (
        <div key={t.id} onClick={() => setActive(t.id)} style={{
          flex: 1, textAlign: 'center', padding: '16px 0 13px',
          fontFamily: F, fontSize: 16, fontWeight: active === t.id ? 600 : 400,
          color: active === t.id ? C.text : C.sub, position: 'relative', cursor: 'pointer',
        }}>
          {t.label}
          {active === t.id && (
            <div style={{
              position: 'absolute', bottom: -1, left: '28%', right: '28%',
              height: 3, borderRadius: 2, background: C.green,
            }}></div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Filter Chips ─────────────────────────────────────────── */

function FilterChips() {
  const [active, setActive] = React.useState('all');
  const chips = [
    { id: 'all', label: 'Все' },
    { id: 'train', label: 'Тренировки' },
    { id: 'game', label: 'Игры' },
    { id: 'tourn', label: 'Турниры' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, padding: '18px 16px 4px', justifyContent: 'center' }}>
      {chips.map(c => {
        const on = active === c.id;
        return (
          <div key={c.id} onClick={() => setActive(c.id)} style={{
            padding: '8px 16px', borderRadius: 20, fontFamily: F, fontSize: 15, fontWeight: 500,
            whiteSpace: 'nowrap', cursor: 'pointer', lineHeight: '20px',
            background: on ? C.bg : '#fff', color: on ? '#fff' : C.text,
            border: on ? 'none' : `1.5px solid ${C.chipBorder}`,
          }}>{c.label}</div>
        );
      })}
    </div>
  );
}

/* ── Section Header ──────────────────────────────────────── */

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '22px 20px 12px',
    }}>
      <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: C.text }}>{title}</div>
      {subtitle && <div style={{ fontFamily: F, fontSize: 14, color: C.sub }}>{subtitle}</div>}
    </div>
  );
}

/* ── Event Card ──────────────────────────────────────────── */

function EventCard({ mode, timeTop, timeBottom, icon, iconColor, iconBg, title, venue, count, total }) {
  const isWeek = mode === 'week';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '16px 12px', gap: 10,
      background: C.card, borderRadius: 16,
    }}>
      {/* Time / Date column */}
      <div style={{ flexShrink: 0, minWidth: isWeek ? 44 : 40 }}>
        {isWeek ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
              <span style={{ fontFamily: F, fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1 }}>
                {timeTop.split(' ')[0]}
              </span>
              <span style={{ fontFamily: F, fontSize: 13, fontWeight: 400, color: C.sub }}>
                {timeTop.split(' ')[1]}
              </span>
            </div>
            <div style={{ fontFamily: F, fontSize: 14, color: C.sub, marginTop: 2 }}>{timeBottom}</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: F, fontSize: 17, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{timeTop}</div>
            <div style={{ fontFamily: F, fontSize: 13, color: C.sub, marginTop: 2 }}>{timeBottom}</div>
          </>
        )}
      </div>

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: iconBg || C.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon === 'clock'
          ? <IconClock color={iconColor || C.iconC} size={20} />
          : <IconTrophy color={iconColor || C.iconC} size={20} />
        }
      </div>

      {/* Title + Venue */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: F, fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.3,
        }}>{title}</div>
        <div style={{ fontFamily: F, fontSize: 13, color: C.sub, marginTop: 2 }}>{venue}</div>
      </div>

      {/* Count + Chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: F, fontSize: 15 }}>
          <span style={{ color: C.green, fontWeight: 700 }}>{count}</span>
          <span style={{ color: C.sub, fontWeight: 400 }}> / {total}</span>
        </span>
        <IconChevron />
      </div>
    </div>
  );
}

/* ── Bottom Navigation ───────────────────────────────────── */

function BottomNav() {
  const tabs = [
    { id: 'team', Icon: IconHome, label: 'Команда' },
    { id: 'events', Icon: IconCalendar, label: 'События' },
    { id: 'money', Icon: IconMoney, label: 'Деньги' },
    { id: 'roster', Icon: IconPeople, label: 'Состав' },
    { id: 'more', Icon: IconMore, label: 'Ещё' },
  ];
  return (
    <div style={{
      display: 'flex', background: '#fff', borderTop: `1px solid ${C.line}`,
      padding: '8px 0 30px', flexShrink: 0,
    }}>
      {tabs.map(t => {
        const active = t.id === 'events';
        const color = active ? C.green : '#ABABAB';
        return (
          <div key={t.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3, cursor: 'pointer',
          }}>
            <t.Icon color={color} />
            <span style={{ fontFamily: F, fontSize: 10, fontWeight: active ? 600 : 400, color }}>
              {t.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main App ────────────────────────────────────────────── */

function ScheduleScreen() {
  const events = {
    today: [
      { timeTop: '19:30', timeBottom: '– 21:00', icon: 'clock', title: 'Тренировка', venue: 'Большая арена', count: 12, total: 16 },
      { timeTop: '21:15', timeBottom: '– 23:00', icon: 'trophy', title: 'Игра vs Северные Волки', venue: 'Арена Петровка', count: 15, total: 18 },
      { timeTop: '23:30', timeBottom: '– 01:00', icon: 'trophy', iconColor: C.goldC, iconBg: C.goldBg, title: 'Турнир «Кубок Льда»', venue: 'Арена Север', count: 10, total: 16 },
    ],
    week: [
      { timeTop: '26 пн', timeBottom: '19:30', icon: 'clock', title: 'Тренировка', venue: 'Малая арена', count: 8, total: 14 },
      { timeTop: '27 вт', timeBottom: '21:15', icon: 'trophy', title: 'Игра vs Медведи', venue: 'Арена Петровка', count: 16, total: 18 },
    ],
  };

  return (
    <IOSDevice dark={true} width={430} height={932}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%', overflow: 'hidden', background: C.bg,
        position: 'relative',
      }}>
        <AppHeader />

        {/* White content sheet */}
        <div style={{
          flex: 1, background: '#fff',
          borderRadius: '24px 24px 0 0',
          marginTop: -12, position: 'relative', zIndex: 2,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <ScheduleTabs />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FilterChips />
            <SectionHeader title="Сегодня" subtitle="24 мая, сб" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
              {events.today.map((e, i) => <EventCard key={i} mode="today" {...e} />)}
            </div>
            <SectionHeader title="Эта неделя" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px 24px' }}>
              {events.week.map((e, i) => <EventCard key={i} mode="week" {...e} />)}
            </div>
          </div>
        </div>

        <BottomNav />

        {/* FAB */}
        <div style={{
          position: 'absolute', bottom: 78, right: 18, zIndex: 10,
          width: 56, height: 56, borderRadius: 28,
          background: C.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          cursor: 'pointer',
        }}>
          <IconPlus />
        </div>
      </div>
    </IOSDevice>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ScheduleScreen />);
