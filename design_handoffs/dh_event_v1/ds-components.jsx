/* ── Sporty Hockey — Design System Components (for catalog) ── */

/* ── COLORS ── */
const C = {
  primary: '#1A5C35', primaryDark: '#14472A', primaryLight: '#E8F5EC',
  white: '#FFFFFF', bgWarm: '#F7F5F0', bgMuted: '#F5F5F5',
  text: '#1C1C1E', textSec: '#6B7280', textTer: '#AEAEB2',
  divider: '#E8E8E8', border: '#E0E0E0',
  success: '#34C759', successBg: '#E8F5EC',
  warning: '#FF9500', warningBg: '#FFF8E1', warningText: '#8B6914',
  error: '#D32F2F', errorBg: '#FFEBEE', errorText: '#C62828',
};
const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";

/* ── Icons (inline SVG) ── */
const I = {
  chevronR: (s=16,c=C.textTer) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>,
  chevronL: (s=20,c=C.text) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>,
  more: (s=20,c=C.text) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="1.5" fill={c}/><circle cx="12" cy="12" r="1.5" fill={c}/><circle cx="12" cy="19" r="1.5" fill={c}/></svg>,
  plus: (s=24,c='#fff') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
  clock: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  calendar: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  location: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  check: (s=14,c='#fff') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>,
  bell: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  chat: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  users: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  home: (s=22,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>,
  money: (s=22,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><text x="12" y="16" textAnchor="middle" fontSize="11" fill={c} stroke="none" fontWeight="600">₽</text></svg>,
  trophy: (s=18,c='currentColor') => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>,
  warning: (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
};

/* ── Avatar ── */
const DSAvatar = ({name='', size=40}) => {
  const ini = name.split(' ').map(w=>w[0]).join('').slice(0,2);
  return <div style={{width:size,height:size,borderRadius:'50%',background:'linear-gradient(135deg,#6B7280,#9CA3AF)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:size*0.38,flexShrink:0}}>{ini}</div>;
};

/* ── Badge ── */
const DSBadge = ({variant='success', children}) => {
  const m = {success:{bg:C.successBg,c:C.primary},warning:{bg:C.warningBg,c:C.warningText},error:{bg:C.errorBg,c:C.errorText},neutral:{bg:C.bgMuted,c:C.textSec}};
  const s = m[variant]||m.neutral;
  return <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:8,fontSize:12,fontWeight:600,background:s.bg,color:s.c,whiteSpace:'nowrap'}}>{children}</span>;
};

/* ── Status Dot ── */
const DSDot = ({status='going', size=10}) => {
  const cm = {going:C.success,maybe:C.warning,declined:C.error,none:C.textTer};
  return <div style={{width:size,height:size,borderRadius:'50%',background:cm[status]||C.textTer,flexShrink:0}}/>;
};

/* ── Buttons ── */
const DSButton = ({children, variant='primary', wide=true, onClick}) => {
  const vars = {
    primary:{bg:C.primary,c:'#fff',border:'none'},
    destructive:{bg:C.error,c:'#fff',border:'none'},
    secondary:{bg:'#fff',c:C.text,border:`1.5px solid ${C.border}`},
  };
  const v = vars[variant]||vars.primary;
  return <button onClick={onClick} style={{display:'flex',alignItems:'center',justifyContent:'center',width:wide?'100%':'auto',height:52,borderRadius:14,background:v.bg,color:v.c,border:v.border,fontSize:17,fontWeight:700,fontFamily:FONT,cursor:'pointer',gap:8,padding:'0 32px'}}>{children}</button>;
};

/* ── FAB ── */
const DSFAB = () => (
  <button style={{width:56,height:56,borderRadius:'50%',background:C.primary,color:'#fff',border:'none',cursor:'pointer',boxShadow:'0 2px 8px rgba(26,92,53,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>{I.plus()}</button>
);

/* ── Segmented Control ── */
const DSSegmented = ({options, active=0}) => (
  <div style={{display:'inline-flex',background:'#F0F0F0',borderRadius:10,padding:3}}>
    {options.map((o,i) => <div key={o} style={{padding:'8px 22px',borderRadius:8,fontSize:14,fontWeight:600,background:i===active?C.primary:'transparent',color:i===active?'#fff':C.textSec,cursor:'pointer'}}>{o}</div>)}
  </div>
);

/* ── Filter Chips ── */
const DSChips = ({options, active=0}) => (
  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    {options.map((o,i) => <div key={o} style={{padding:'7px 16px',borderRadius:20,fontSize:14,fontWeight:600,border:i===active?`1.5px solid ${C.primary}`:`1.5px solid ${C.border}`,background:i===active?C.primary:'#fff',color:i===active?'#fff':C.text,cursor:'pointer'}}>{o}</div>)}
  </div>
);

/* ── Form Row ── */
const DSFormRow = ({icon, label, value, last=false}) => (
  <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:last?'none':`1px solid ${C.divider}`}}>
    <div style={{width:36,height:36,borderRadius:10,background:C.bgMuted,display:'flex',alignItems:'center',justifyContent:'center',color:C.textSec,flexShrink:0}}>{icon}</div>
    <div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>
      <span style={{fontSize:13,color:C.textSec,fontWeight:500}}>{label}</span>
      <span style={{fontSize:15,fontWeight:600}}>{value}</span>
    </div>
    {I.chevronR()}
  </div>
);

/* ── Toggle ── */
const DSToggle = ({on=true}) => (
  <div style={{width:51,height:31,borderRadius:15.5,background:on?C.success:C.border,position:'relative',cursor:'pointer'}}>
    <div style={{width:27,height:27,borderRadius:'50%',background:'#fff',position:'absolute',top:2,...(on?{right:2}:{left:2}),boxShadow:'0 1px 3px rgba(0,0,0,0.15)'}}/>
  </div>
);

/* ── Nav Bar ── */
const DSNavBar = ({title, hasBack=true}) => (
  <div style={{display:'flex',alignItems:'center',padding:'8px 16px',height:52,gap:12,background:'#fff',borderBottom:`1px solid ${C.divider}`,borderRadius:12}}>
    {hasBack && <div style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>{I.chevronL()}</div>}
    <div style={{flex:1,textAlign:'center',fontSize:17,fontWeight:600}}>{title}</div>
    <div style={{width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>{I.more()}</div>
  </div>
);

/* ── Tab Bar ── */
const DSTabBar = ({active='events'}) => {
  const tabs=[{id:'team',l:'Команда',i:I.home},{id:'events',l:'События',i:I.calendar},{id:'money',l:'Деньги',i:I.money},{id:'roster',l:'Состав',i:I.users},{id:'more',l:'Ещё',i:I.more}];
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',height:56,background:'#fff',borderTop:`1px solid ${C.divider}`,borderRadius:12,overflow:'hidden'}}>
      {tabs.map(t=>{const a=t.id===active;return(
        <div key={t.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,fontSize:11,fontWeight:500,color:a?C.primary:C.textTer,cursor:'pointer',padding:'4px 12px'}}>
          {t.i(22,a?C.primary:C.textTer)}{t.l}
        </div>
      );})}
    </div>
  );
};

/* ── Event List Item ── */
const DSEventItem = ({time, endTime, title, venue, count, total, warnings=[], iconBg, iconColor, icon}) => (
  <div style={{display:'flex',gap:12,padding:'12px 0',borderBottom:`1px solid ${C.divider}`,alignItems:'flex-start',cursor:'pointer'}}>
    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',minWidth:44,fontVariantNumeric:'tabular-nums'}}>
      <span style={{fontSize:15,fontWeight:600}}>{time}</span>
      <span style={{fontSize:12,color:C.textTer}}>– {endTime}</span>
    </div>
    <div style={{width:36,height:36,borderRadius:10,background:iconBg||C.primaryLight,color:iconColor||C.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      {icon||I.clock(18,iconColor||C.primary)}
    </div>
    <div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>
      <span style={{fontSize:15,fontWeight:600}}>{title}</span>
      <span style={{fontSize:13,color:C.textSec}}>{venue}</span>
      {warnings.map((w,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}><DSDot status={w.type} size={8}/><span style={{fontSize:12,fontWeight:500,color:w.type==='declined'?C.error:C.warningText}}>{w.text}</span></div>)}
    </div>
    <span style={{fontSize:14,fontWeight:600,color:C.primary,fontVariantNumeric:'tabular-nums',alignSelf:'center'}}>{count!=null?`${count} / ${total}`:'— / —'}</span>
    {I.chevronR()}
  </div>
);

/* ── Player Row ── */
const DSPlayerRow = ({name,number,position,status,amount,payStatus,showActions=false}) => {
  const sl={going:'Идёт',notGoing:'Не идёт',none:'Не ответил'};
  const sc={going:C.successBg,notGoing:C.errorBg,none:C.bgMuted};
  const stc={going:C.primary,notGoing:C.errorText,none:C.textTer};
  /* Action button icons */
  const PersonSwapIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg>;
  const XIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>;
  return (
    <div style={{display:'flex',gap:12,padding:'12px 0',borderBottom:`1px solid ${C.divider}`,alignItems:'center'}}>
      <DSAvatar name={name} size={48}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:2}}>
        <span style={{fontSize:15,fontWeight:600}}>{name}</span>
        <span style={{fontSize:13,color:C.textSec}}>#{number} · {position}</span>
        {status && <span style={{display:'inline-flex',alignSelf:'flex-start',padding:'2px 10px',borderRadius:8,fontSize:12,fontWeight:600,background:sc[status],color:stc[status],marginTop:1}}>{sl[status]}</span>}
        {payStatus && <DSBadge variant={payStatus==='paid'?'success':payStatus==='partial'?'warning':'error'}>{payStatus==='paid'?'Оплачено':payStatus==='partial'?'Частично':'Не оплачено'}</DSBadge>}
      </div>
      {showActions && (
        <div style={{display:'flex',gap:6}}>
          <div style={{width:40,height:40,borderRadius:'50%',border:'none',display:'flex',alignItems:'center',justifyContent:'center',
            background:status==='going'?C.primary:'#fff',
            color:status==='going'?'#fff':C.textTer,
            boxShadow:status==='going'?'none':`inset 0 0 0 1.5px ${C.border}`,cursor:'pointer',
          }}>{I.check(16,status==='going'?'#fff':C.textTer)}</div>
          <div style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
            background:'#fff',color:C.textTer,boxShadow:`inset 0 0 0 1.5px ${C.border}`,cursor:'pointer',
          }}><PersonSwapIcon/></div>
          <div style={{width:40,height:40,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
            background:'#fff',color:C.textTer,boxShadow:`inset 0 0 0 1.5px ${C.border}`,cursor:'pointer',
          }}><XIcon/></div>
        </div>
      )}
      {amount!=null && <span style={{fontSize:14,fontWeight:600,fontVariantNumeric:'tabular-nums'}}>{amount}</span>}
      {!showActions && I.chevronR()}
    </div>
  );
};

/* ── Attendance Card ── */
const DSAttendance = ({going=12,notGoing=3,noReply=5}) => {
  const GoingIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>;
  const NotGoingIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>;
  const NoReplyIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>;
  return (
    <div style={{background:C.bgWarm,borderRadius:16,padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <span style={{fontSize:17,fontWeight:600}}>Состав и явка</span>
        <span style={{fontSize:14,fontWeight:600,color:C.primary,cursor:'pointer'}}>Напомнить</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-around',textAlign:'center'}}>
        {[
          {n:going, l:'Идут', icon:<GoingIcon/>, bg:C.primary},
          {n:notGoing, l:'Не идут', icon:<NotGoingIcon/>, bg:C.error},
          {n:noReply, l:'Не ответили', icon:<NoReplyIcon/>, bg:C.textTer},
        ].map((x,i)=>(
          <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:x.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>{x.icon}</div>
            <span style={{fontSize:12,color:C.textSec}}>{x.l}</span>
            <span style={{fontSize:28,fontWeight:800,fontVariantNumeric:'tabular-nums',lineHeight:1}}>{x.n}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Progress Ring ── */
const DSProgressRing = ({percent=75, size=80}) => {
  const r = (size-12)/2, circ = 2*Math.PI*r;
  return (
    <div style={{position:'relative',width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8E8E8" strokeWidth="6"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.primary} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-percent/100)}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:C.primary}}>{percent}%</div>
    </div>
  );
};

/* ── Info Banner ── */
const DSBanner = ({variant='info', title, children, dismissible}) => {
  const m={info:{bg:C.bgWarm,c:C.textSec,ic:C.border},warning:{bg:C.warningBg,c:C.warningText,ic:C.warning},error:{bg:C.errorBg,c:C.errorText,ic:C.error}};
  const s=m[variant]||m.info;
  return (
    <div style={{display:'flex',gap:10,padding:'12px 14px',borderRadius:14,background:s.bg,alignItems:'flex-start'}}>
      <div style={{width:22,height:22,borderRadius:'50%',background:s.ic,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{variant==='warning'?'⚠':'i'}</div>
      <div style={{flex:1}}>
        {title && <div style={{fontSize:14,fontWeight:600,color:s.c,marginBottom:2}}>{title}</div>}
        <div style={{fontSize:13,color:s.c,lineHeight:'1.4'}}>{children}</div>
      </div>
      {dismissible && <div style={{color:C.textTer,cursor:'pointer',fontSize:16}}>✕</div>}
    </div>
  );
};

/* ── Calendar Week ── */
const DSCalendarWeek = ({activeDay=3}) => {
  const days=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
  const nums=[19,20,21,22,23,24,25];
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:12,padding:'8px 0'}}>
        <span style={{cursor:'pointer'}}>{I.chevronL(18)}</span>
        <span style={{fontSize:15,fontWeight:600}}>19 – 25 мая ▾</span>
        <span style={{cursor:'pointer'}}>{I.chevronR(18,C.text)}</span>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',gap:4}}>
        {days.map((d,i)=>(
          <div key={d} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,width:44,padding:'8px 0',borderRadius:12}}>
            <span style={{fontSize:12,fontWeight:i===activeDay?700:500,color:i===activeDay?C.primary:C.textTer,textTransform:'uppercase'}}>{d}</span>
            <span style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:600,background:i===activeDay?C.primary:'transparent',color:i===activeDay?'#fff':C.text}}>{nums[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Section Header ── */
const DSSectionHdr = ({title, action, right}) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0 8px'}}>
    <span style={{fontSize:17,fontWeight:700}}>{title}</span>
    {action && <span style={{fontSize:14,fontWeight:600,color:C.primary,cursor:'pointer'}}>{action}</span>}
    {right && <span style={{fontSize:14,color:C.textSec}}>{right}</span>}
  </div>
);

/* ── Stepper Tabs ── */
const DSStepper = ({steps, active=0}) => (
  <div style={{display:'flex',gap:0,borderBottom:`2px solid ${C.divider}`,position:'relative'}}>
    {steps.map((s,i)=>(
      <div key={s} style={{padding:'10px 16px',fontSize:15,fontWeight:600,color:i===active?C.primary:C.textTer,cursor:'pointer',position:'relative'}}>
        {s}
        {i===active && <div style={{position:'absolute',bottom:-2,left:0,right:0,height:2,background:C.primary}}/>}
      </div>
    ))}
  </div>
);

/* ── Cards ── */
const DSCard = ({variant='elevated', children, style:es}) => {
  const styles = {
    elevated: {background:'#fff',borderRadius:16,padding:16,boxShadow:'0 1px 3px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)'},
    muted: {background:C.bgWarm,borderRadius:16,padding:16},
    warning: {background:C.warningBg,border:'1px solid #FFE082',borderRadius:16,padding:16},
    error: {background:C.errorBg,border:'1px solid #FFCDD2',borderRadius:16,padding:16},
  };
  return <div style={{...styles[variant],...es}}>{children}</div>;
};

Object.assign(window, {
  C, FONT, I,
  DSAvatar, DSBadge, DSDot, DSButton, DSFAB, DSSegmented, DSChips,
  DSFormRow, DSToggle, DSNavBar, DSTabBar, DSEventItem, DSPlayerRow,
  DSAttendance, DSProgressRing, DSBanner, DSCalendarWeek,
  DSSectionHdr, DSStepper, DSCard,
});
