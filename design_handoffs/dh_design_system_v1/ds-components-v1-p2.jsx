/* ═══════════════════════════════════════════════
   Sporty Hockey — Design System v3
   v2 (Состав и финансы) + v3 (Расписание)
   ═══════════════════════════════════════════════ */

/* ── NEW TOKENS (Schedule Screen) ── */
const C3 = {
  ...C2,
  // Schedule dark header
  headerBg:     '#233F30',
  headerAccent: '#1A6B3C',
  headerMuted:  'rgba(255,255,255,0.55)',
  headerGlass:  'rgba(255,255,255,0.12)',
  // Event cards
  cardSchedule: '#F3F4F3',
  iconBg:       '#D6E4DB',
  iconFg:       '#3A7A50',
  chipBorder:   '#D0D0D0',
  tabInactive:  '#8A8C8C',
  navInactive:  '#ABABAB',
  // Tournament / Gold
  goldBg:       '#EDE3C5',
  goldFg:       '#C09A38',
  line:         '#EBEBEB',
};

/* ── NEW ICONS (Schedule) ── */
const Ic3 = {
  ...Ic,
  menu: ({c='#fff',s=20}) => <svg width={s} height={s-6} viewBox="0 0 20 14" fill="none"><path d="M1 1.5h18M1 7h18M1 12.5h18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>,
  bell: ({c='#fff',s=22}) => <svg width={s} height={s+2} viewBox="0 0 23 25" fill="none"><path d="M11.5 2C7.9 2 5 5.1 5 8.5V14l-2.2 2.8h16.4L17 14V8.5C17 5.1 14.1 2 11.5 2z" stroke={c} strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 20a2.7 2.7 0 005 0" stroke={c} strokeWidth="1.7" strokeLinecap="round"/></svg>,
  clock: ({c='#3A7A50',s=20}) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9" stroke={c} strokeWidth="1.7"/><path d="M11 5.5V11.5L14.5 13.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trophy: ({c='#3A7A50',s=20}) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none"><path d="M6 3h10v6.5c0 2.8-2.2 5-5 5s-5-2.2-5-5V3z" stroke={c} strokeWidth="1.6"/><path d="M6 5.5H3.8v1.8c0 1.5 1.2 2.7 2.7 2.7" stroke={c} strokeWidth="1.4" strokeLinecap="round"/><path d="M16 5.5h2.2v1.8c0 1.5-1.2 2.7-2.7 2.7" stroke={c} strokeWidth="1.4" strokeLinecap="round"/><line x1="11" y1="14.5" x2="11" y2="17.5" stroke={c} strokeWidth="1.6"/><path d="M8 17.5h6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  chevron: ({c='#C4C4C4',s=7}) => <svg width={s} height={12} viewBox="0 0 7 12" fill="none"><path d="M1 1l5 5-5 5" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus: ({c='#fff',s=22}) => <svg width={s} height={s} viewBox="0 0 22 22" fill="none"><path d="M11 3v16M3 11h16" stroke={c} strokeWidth="2.5" strokeLinecap="round"/></svg>,
  home: ({c='#ABABAB',s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 11.5L12 4l8 7.5" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 10v8.5a1 1 0 001 1h3.5v-4.5h3v4.5H17a1 1 0 001-1V10" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cal: ({c='#1A6B3C',s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" stroke={c} strokeWidth="1.7"/><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke={c} strokeWidth="1.7"/><line x1="8" y1="2.5" x2="8" y2="6" stroke={c} strokeWidth="1.7" strokeLinecap="round"/><line x1="16" y1="2.5" x2="16" y2="6" stroke={c} strokeWidth="1.7" strokeLinecap="round"/><circle cx="8" cy="14" r="1" fill={c}/><circle cx="12" cy="14" r="1" fill={c}/><circle cx="16" cy="14" r="1" fill={c}/><circle cx="8" cy="17.5" r="1" fill={c}/></svg>,
  money: ({c='#ABABAB',s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9.5" stroke={c} strokeWidth="1.7"/><text x="12" y="16.5" textAnchor="middle" fill={c} fontSize="13" fontWeight="600" fontFamily="-apple-system, system-ui">₽</text></svg>,
  people: ({c='#ABABAB',s=24}) => <svg width={24} height={s} viewBox="0 0 28 24" fill="none"><circle cx="11" cy="8" r="3.5" stroke={c} strokeWidth="1.7"/><path d="M4 20c0-3.3 3-6 7-6s7 2.7 7 6" stroke={c} strokeWidth="1.7" strokeLinecap="round"/><circle cx="19" cy="9" r="2.8" stroke={c} strokeWidth="1.5"/><path d="M22 20c1.8-.8 3-2.5 3-4.5 0-1.8-1-3.3-2.5-4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  more: ({c='#ABABAB',s=24}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="1.8" fill={c}/><circle cx="12" cy="12" r="1.8" fill={c}/><circle cx="18" cy="12" r="1.8" fill={c}/></svg>,
};

/* ── SCHEDULE COMPONENTS ── */

/* Dark Header */
const DS3DarkHeader = ({title='Расписание', role='Капитан'}) => (
  <div style={{background:C3.headerBg, paddingTop:16, paddingBottom:28, paddingLeft:20, paddingRight:20}}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
      <div style={{width:48, height:48, borderRadius:24, background:C3.headerGlass, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <Ic3.menu/>
      </div>
      <div style={{position:'relative', marginRight:4}}>
        <Ic3.bell/>
        <div style={{position:'absolute', top:-1, right:-2, width:11, height:11, borderRadius:6, background:'#34C759', border:`2.5px solid ${C3.headerBg}`}}/>
      </div>
    </div>
    <div style={{fontSize:14, color:C3.headerMuted, marginBottom:4, letterSpacing:0.1}}>{role}</div>
    <div style={{fontSize:34, fontWeight:800, color:'#fff', letterSpacing:-0.3}}>{title}</div>
  </div>
);

/* Content Tabs */
const DS3ContentTabs = ({tabs=['Список','Календарь'], active=0}) => (
  <div style={{display:'flex', borderBottom:`1px solid ${C3.line}`}}>
    {tabs.map((t,i) => (
      <div key={t} style={{flex:1, textAlign:'center', padding:'16px 0 13px', fontSize:16, fontWeight:i===active?600:400, color:i===active?C3.text:C3.tabInactive, position:'relative'}}>
        {t}
        {i===active && <div style={{position:'absolute', bottom:-1, left:'28%', right:'28%', height:3, borderRadius:2, background:C3.headerAccent}}/>}
      </div>
    ))}
  </div>
);

/* Filter Chips (dark active) */
const DS3FilterChips = ({options=['Все','Тренировки','Игры','Турниры'], active=0}) => (
  <div style={{display:'flex', gap:8, padding:'18px 16px', justifyContent:'center'}}>
    {options.map((o,i) => (
      <div key={o} style={{padding:'8px 16px', borderRadius:20, fontSize:15, fontWeight:500, lineHeight:'20px', whiteSpace:'nowrap',
        background:i===active?C3.headerBg:'#fff', color:i===active?'#fff':C3.text,
        border:i===active?'none':`1.5px solid ${C3.chipBorder}`,
      }}>{o}</div>
    ))}
  </div>
);

/* Section Header */
const DS3SectionHeader = ({title='Сегодня', subtitle='24 мая, сб'}) => (
  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', padding:'22px 20px 12px'}}>
    <div style={{fontSize:20, fontWeight:700, color:C3.text}}>{title}</div>
    {subtitle && <div style={{fontSize:14, color:C3.tabInactive}}>{subtitle}</div>}
  </div>
);

/* Event Card */
const DS3EventCard = ({mode='today', timeTop='19:30', timeBottom='– 21:00', icon='clock', iconColor, iconBg, title='Тренировка', venue='Большая арена', count=12, total=16}) => {
  const isWeek = mode === 'week';
  return (
    <div style={{display:'flex', alignItems:'center', padding:'16px 12px', gap:10, background:C3.cardSchedule, borderRadius:16}}>
      <div style={{flexShrink:0, minWidth:isWeek?44:40}}>
        {isWeek ? (
          <>
            <div style={{display:'flex', alignItems:'baseline', gap:2}}>
              <span style={{fontSize:22, fontWeight:700, color:C3.text, lineHeight:1}}>{timeTop.split(' ')[0]}</span>
              <span style={{fontSize:13, color:C3.tabInactive}}>{timeTop.split(' ')[1]}</span>
            </div>
            <div style={{fontSize:14, color:C3.tabInactive, marginTop:2}}>{timeBottom}</div>
          </>
        ) : (
          <>
            <div style={{fontSize:17, fontWeight:600, color:C3.text, lineHeight:1.2}}>{timeTop}</div>
            <div style={{fontSize:13, color:C3.tabInactive, marginTop:2}}>{timeBottom}</div>
          </>
        )}
      </div>
      <div style={{width:44, height:44, borderRadius:12, flexShrink:0, background:iconBg||C3.iconBg, display:'flex', alignItems:'center', justifyContent:'center'}}>
        {icon==='clock' ? <Ic3.clock c={iconColor||C3.iconFg}/> : <Ic3.trophy c={iconColor||C3.iconFg}/>}
      </div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:15, fontWeight:600, color:C3.text, lineHeight:1.3}}>{title}</div>
        <div style={{fontSize:13, color:C3.tabInactive, marginTop:2}}>{venue}</div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8, flexShrink:0}}>
        <span style={{fontSize:15}}><span style={{color:C3.headerAccent, fontWeight:700}}>{count}</span><span style={{color:C3.tabInactive}}> / {total}</span></span>
        <Ic3.chevron/>
      </div>
    </div>
  );
};

/* Bottom Navigation */
const DS3BottomNav = ({activeTab='events'}) => {
  const tabs = [{id:'team',Ic:Ic3.home,l:'Команда'},{id:'events',Ic:Ic3.cal,l:'События'},{id:'money',Ic:Ic3.money,l:'Деньги'},{id:'roster',Ic:Ic3.people,l:'Состав'},{id:'more',Ic:Ic3.more,l:'Ещё'}];
  return (
    <div style={{display:'flex', background:'#fff', borderTop:`1px solid ${C3.line}`, padding:'8px 0 12px'}}>
      {tabs.map(t => {
        const on = t.id===activeTab;
        const c = on ? C3.headerAccent : C3.navInactive;
        return (
          <div key={t.id} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3}}>
            <t.Ic c={c}/><span style={{fontSize:10, fontWeight:on?600:400, color:c}}>{t.l}</span>
          </div>
        );
      })}
    </div>
  );
};

/* FAB */
const DS3FAB = ({variant='dark'}) => (
  <div style={{width:56, height:56, borderRadius:28, background:variant==='dark'?C3.headerBg:C3.primary, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(0,0,0,0.25)'}}>
    <Ic3.plus/>
  </div>
);

/* Glass Menu Button */
const DS3GlassButton = ({children}) => (
  <div style={{width:48, height:48, borderRadius:24, background:C3.headerGlass, display:'flex', alignItems:'center', justifyContent:'center'}}>
    {children || <Ic3.menu/>}
  </div>
);

Object.assign(window, {
  C3, Ic3,
  DS3DarkHeader, DS3ContentTabs, DS3FilterChips, DS3SectionHeader,
  DS3EventCard, DS3BottomNav, DS3FAB, DS3GlassButton,
});
