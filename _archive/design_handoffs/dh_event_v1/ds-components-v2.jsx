/* ═══════════════════════════════════════════════
   Sporty Hockey — Design System v2
   Извлечено из "Состав и финансы v2"
   ═══════════════════════════════════════════════ */

/* ── TOKENS ── */
const C2 = {
  primary:   '#1A7A3D',
  warning:   '#FF9500',
  error:     '#D43838',

  text:      '#1C1C1E',
  textSec:   '#6B7280',
  textTer:   '#8E8E93',
  textQuad:  '#AEAEB2',
  inactive:  '#C8C7C2',

  bg:        '#FFFFFF',
  cardBg:    '#FAFAF8',
  cardBorder:'#F0EDE6',
  cardDiv:   '#EBE8E1',
  divider:   '#F0F0F0',
  border:    '#E4E2DC',
  ringTrack: '#EFEDE7',
};

const FONT2 = "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif";

const AVATAR_TONES = [
  ['#8E9AAB','#5C6B7F'], ['#B4A78F','#7A6E58'], ['#9CAFA2','#5E7269'],
  ['#A99B8E','#6E5F50'], ['#8FA0AE','#5B6A78'], ['#9C9890','#6B655B'],
];

/* ── ICONS ── */
const Ic = {
  back:     ({s=20}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={C2.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  person:   ({c='#fff',s=20}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M5 21c.6-3.6 3.5-6 7-6 1.6 0 3.1.5 4.3 1.4"/><path d="M15.5 19.5l2 2 4-4.2"/></svg>,
  wallet:   ({c='#fff',s=20}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7.5A2.5 2.5 0 015.5 5h12A2.5 2.5 0 0120 7.5v0H5.5A2.5 2.5 0 003 10v-2.5z"/><rect x="3" y="7.5" width="18" height="12" rx="2.5"/><path d="M11 11.5h2.2a2 2 0 010 4H11V18M11 13.5h3M9 13.5h2"/></svg>,
  check:    ({c='#fff',s=14}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  dot:      ({c='#fff',s=12}) => <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill={c}/></svg>,
  userFill: ({c='#fff',s=12}) => <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6H4z"/></svg>,
};

/* ── HELPERS ── */
const fmtNum = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/* ══════════════════════════════
   COMPONENTS
   ══════════════════════════════ */

/* 1. Avatar — gradient circle + initials */
const DS2Avatar = ({name='', idx=0, size=46}) => {
  const ini = name.split(' ').map(w=>w[0]).join('').slice(0,2);
  const [a,b] = AVATAR_TONES[idx % AVATAR_TONES.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`linear-gradient(135deg, ${a}, ${b})`,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:700, fontSize:size*0.34,
      flexShrink:0, letterSpacing:0.2,
    }}>{ini}</div>
  );
};

/* 2. ActionTile — 50×50 square button with icon + label */
const DS2ActionTile = ({active=false, activeColor=C2.primary, icon, label='', onClick}) => {
  const bg = active ? activeColor : '#fff';
  const fg = active ? '#fff' : C2.inactive;
  const border = active ? activeColor : C2.border;
  return (
    <div onClick={onClick} style={{
      width:50, height:50, borderRadius:12,
      background:bg, border:`1.5px solid ${border}`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:1, cursor:'pointer', transition:'all .15s', flexShrink:0,
    }}>
      {icon && React.cloneElement(icon, {c:fg, s:20})}
      <div style={{fontSize:10, fontWeight:700, color:fg, fontVariantNumeric:'tabular-nums'}}>{label}</div>
    </div>
  );
};

/* 3. Donut — progress ring */
const DS2Donut = ({percent=75, size=110}) => {
  const stroke = 9, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{position:'relative', width:size, height:size, flexShrink:0}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C2.ringTrack} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C2.primary} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${circ*(percent/100)} ${circ*(1-percent/100)}`}/>
      </svg>
      <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:Math.round(size*0.2), fontWeight:800, color:C2.primary, fontVariantNumeric:'tabular-nums'}}>{percent}%</div>
    </div>
  );
};

/* 4. StatChip — icon circle + label + value */
const DS2StatChip = ({icon, color, label, value}) => (
  <div style={{flex:1, display:'flex', alignItems:'center', gap:8}}>
    <div style={{width:26, height:26, borderRadius:'50%', background:color, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center'}}>{icon}</div>
    <div>
      <div style={{fontSize:12, color:C2.textSec, fontWeight:500, lineHeight:1.1}}>{label}</div>
      <div style={{fontSize:16, fontWeight:800, color:C2.text, lineHeight:1.2, marginTop:1, fontVariantNumeric:'tabular-nums'}}>{value}</div>
    </div>
  </div>
);

/* 5. TabBar — underline style */
const DS2TabBar = ({tabs=[], active=0, onChange}) => (
  <div style={{display:'flex', padding:'0 16px', position:'relative'}}>
    {tabs.map((t,i) => (
      <div key={t} onClick={() => onChange && onChange(i)} style={{
        flex:1, textAlign:'center', padding:'12px 0 10px',
        fontSize:13, fontWeight:i===active ? 600 : 500,
        color:i===active ? C2.primary : C2.textTer,
        cursor:'pointer', position:'relative',
      }}>
        {t}
        {i===active && <div style={{position:'absolute', left:'15%', right:'15%', bottom:0, height:2.5, background:C2.primary, borderRadius:'3px 3px 0 0'}}/>}
      </div>
    ))}
    <div style={{position:'absolute', left:0, right:0, bottom:0, height:1, background:C2.divider}}/>
  </div>
);

/* 6. GroupHeader — bold title + count pill */
const DS2GroupHeader = ({title, count}) => (
  <div style={{display:'flex', alignItems:'center', gap:8, padding:'20px 16px 8px'}}>
    <span style={{fontSize:16, fontWeight:800, color:C2.text}}>{title}</span>
    {count != null && (
      <span style={{display:'inline-flex', alignItems:'center', justifyContent:'center',
        minWidth:22, height:20, padding:'0 7px', borderRadius:10,
        background:C2.divider, color:C2.textTer, fontSize:12, fontWeight:700, fontVariantNumeric:'tabular-nums',
      }}>{count}</span>
    )}
  </div>
);

/* 7. NavBar — back circle + centered title/subtitle */
const DS2NavBar = ({title, subtitle, hasBack=true}) => (
  <div style={{display:'flex', alignItems:'center', padding:'12px 16px 8px', gap:12}}>
    {hasBack && (
      <div style={{width:36, height:36, borderRadius:'50%', background:C2.divider,
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
      }}><Ic.back s={20}/></div>
    )}
    <div style={{flex:1, textAlign:'center'}}>
      <div style={{fontSize:17, fontWeight:800, color:C2.text, letterSpacing:-0.3}}>{title}</div>
      {subtitle && <div style={{fontSize:12, color:C2.textTer, fontWeight:500, marginTop:3}}>{subtitle}</div>}
    </div>
    {hasBack && <div style={{width:36, flexShrink:0}}/>}
  </div>
);

/* 8. PlayerRow — flat, divider-separated */
const DS2PlayerRow = ({name, number, position, idx=0, attended=false, paid=0, due=1300, isLast=false}) => {
  let payActive = false, payColor = C2.primary, payLabel = 'Сдал';
  const isPartial = paid > 0 && paid < due;
  if (paid >= due && attended) { payActive = true; }
  else if (isPartial) { payActive = true; payColor = C2.warning; payLabel = `${fmtNum(paid)} ₽`; }

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:12, padding:'12px 16px'}}>
        <DS2Avatar name={name} idx={idx} size={46}/>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:15, fontWeight:700, color:C2.text, lineHeight:1.25,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{name}</div>
          <div style={{fontSize:12, color:C2.textTer, fontWeight:500, marginTop:2}}>#{number} · {position}</div>
        </div>
        <div style={{display:'flex', gap:8, flexShrink:0}}>
          <DS2ActionTile active={attended} icon={<Ic.person/>} label="Был"/>
          <DS2ActionTile active={payActive} activeColor={payColor} icon={<Ic.wallet/>} label={payLabel}/>
        </div>
      </div>
      {!isLast && <div style={{height:1, background:C2.divider, marginLeft:74}}/>}
    </div>
  );
};

/* ── Export ── */
Object.assign(window, {
  C2, FONT2, AVATAR_TONES, Ic, fmtNum,
  DS2Avatar, DS2ActionTile, DS2Donut, DS2StatChip,
  DS2TabBar, DS2GroupHeader, DS2NavBar, DS2PlayerRow,
});
