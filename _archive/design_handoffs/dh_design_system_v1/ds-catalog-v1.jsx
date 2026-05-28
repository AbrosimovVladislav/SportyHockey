/* ── Design System v3 — Каталог ── */
/* v2 (Состав и финансы) + v3 (Расписание) */

const catS3 = {
  page: { fontFamily: FONT2, color: C2.text, background: '#FAFAF8', minHeight: '100vh', WebkitFontSmoothing: 'antialiased' },
  header: { padding: '48px 48px 32px', borderBottom: `1px solid ${C2.divider}` },
  nav: { position: 'sticky', top: 0, zIndex: 100, background: '#FAFAF8', borderBottom: `1px solid ${C2.divider}`, padding: '0 48px', display: 'flex', gap: 4, overflowX: 'auto' },
  navBtn: (a) => ({ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: a ? C2.primary : C2.textSec, background: 'none', border: 'none', borderBottom: `2px solid ${a ? C2.primary : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: FONT2 }),
  body: { padding: '0 48px 80px', maxWidth: 1200 },
  sec: { paddingTop: 40 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 16, padding: 24, border: `1px solid ${C2.divider}` },
  lbl: { fontSize: 12, fontWeight: 700, color: C2.textSec, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 },
  row: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  swatch: (bg, light) => ({ width: 56, height: 44, borderRadius: 8, background: bg, display: 'flex', alignItems: 'flex-end', padding: '4px 6px', fontSize: 9, fontWeight: 600, color: light ? C2.textSec : '#fff', border: light ? `1px solid ${C2.border}` : 'none' }),
  mobile: { maxWidth: 393, width: '100%' },
  tag: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: c === 'new' ? '#E8F5EC' : '#F0F0F0', color: c === 'new' ? '#1A5C35' : '#999', marginLeft: 8 }),
};

const SECS3 = [
  { id: 'tokens', label: 'Токены' },
  { id: 'tokens3', label: 'Токены v3' },
  { id: 'type', label: 'Типографика' },
  { id: 'avatar', label: 'Аватар' },
  { id: 'tiles', label: 'Action Tiles' },
  { id: 'nav', label: 'Навигация (v2)' },
  { id: 'rows', label: 'Строки' },
  { id: 'data', label: 'Данные' },
  { id: 'header3', label: 'Dark Header' },
  { id: 'eventcard', label: 'Event Card' },
  { id: 'chips3', label: 'Chips & Tabs' },
  { id: 'bottomnav', label: 'Bottom Nav' },
  { id: 'buttons3', label: 'FAB & Buttons' },
];

const Sec3 = ({id, title, children, isNew}) => (
  <div id={id} style={catS3.sec}>
    <h2 style={{fontSize: 22, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center'}}>
      {title}
      {isNew && <span style={catS3.tag('new')}>NEW v3</span>}
    </h2>
    {children}
  </div>
);

const Crd3 = ({label, children, wide}) => (
  <div style={{...catS3.card, ...(wide ? {gridColumn: '1 / -1'} : {})}}>
    {label && <div style={catS3.lbl}>{label}</div>}
    {children}
  </div>
);

const CatalogV3 = () => {
  const [active, setActive] = React.useState('tokens');

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
  };

  React.useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, {rootMargin: '-100px 0px -60% 0px'});
    SECS3.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={catS3.page}>
      <div style={catS3.header}>
        <h1 style={{fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', margin: 0}}>
          Sporty Hockey <span style={{color: C2.primary, fontSize: 18, fontWeight: 700}}>DS v3</span>
        </h1>
        <p style={{fontSize: 14, color: C2.textSec, marginTop: 6}}>v2 (Состав и финансы) + v3 (Расписание — тёмный хедер, карточки событий)</p>
      </div>

      <div style={catS3.nav}>
        {SECS3.map(s => <button key={s.id} style={catS3.navBtn(active === s.id)} onClick={() => scrollTo(s.id)}>{s.label}</button>)}
      </div>

      <div style={catS3.body}>

        {/* ═══ TOKENS v2 ═══ */}
        <Sec3 id="tokens" title="Цветовые токены (v2)">
          <div style={catS3.grid}>
            <Crd3 label="Основные">
              <div style={catS3.row}>
                {[[C2.primary,'Primary'],[C2.warning,'Warning'],[C2.error,'Error']].map(([bg,l]) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
                    <div style={catS3.swatch(bg)}>{bg}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{l}</span>
                  </div>
                ))}
              </div>
            </Crd3>
            <Crd3 label="Текст">
              <div style={catS3.row}>
                {[[C2.text,'Primary'],[C2.textSec,'Secondary'],[C2.textTer,'Tertiary'],[C2.textQuad,'Quaternary'],[C2.inactive,'Inactive']].map(([bg,l]) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
                    <div style={catS3.swatch(bg)}>{bg}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{l}</span>
                  </div>
                ))}
              </div>
            </Crd3>
            <Crd3 label="Фоны и разделители" wide>
              <div style={catS3.row}>
                {[[C2.bg,'Background',1],[C2.cardBg,'Card Bg',1],[C2.divider,'Divider',1],[C2.border,'Border',1],[C2.cardBorder,'Card Border',1],[C2.cardDiv,'Card Divider',1],[C2.ringTrack,'Ring Track',1]].map(([bg,l,lt]) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
                    <div style={catS3.swatch(bg,lt)}>{bg}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{l}</span>
                  </div>
                ))}
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ TOKENS v3 ═══ */}
        <Sec3 id="tokens3" title="Цветовые токены (Расписание)" isNew>
          <div style={catS3.grid}>
            <Crd3 label="Header & Accent">
              <div style={catS3.row}>
                {[[C3.headerBg,'Header Bg'],[C3.headerAccent,'Accent'],[C3.iconFg,'Icon Fg']].map(([bg,l]) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
                    <div style={catS3.swatch(bg)}>{bg}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{l}</span>
                  </div>
                ))}
              </div>
            </Crd3>
            <Crd3 label="Surfaces & Icons">
              <div style={catS3.row}>
                {[[C3.cardSchedule,'Card Bg',1],[C3.iconBg,'Icon Bg',1],[C3.chipBorder,'Chip Border',1],[C3.line,'Line',1]].map(([bg,l,lt]) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
                    <div style={catS3.swatch(bg,lt)}>{bg}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{l}</span>
                  </div>
                ))}
              </div>
            </Crd3>
            <Crd3 label="Tournament / Gold">
              <div style={catS3.row}>
                {[[C3.goldFg,'Gold Fg'],[C3.goldBg,'Gold Bg',1]].map(([bg,l,lt]) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
                    <div style={catS3.swatch(bg,lt)}>{bg}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{l}</span>
                  </div>
                ))}
              </div>
            </Crd3>
            <Crd3 label="Navigation text">
              <div style={catS3.row}>
                {[[C3.tabInactive,'Tab Inactive'],[C3.navInactive,'Nav Inactive']].map(([bg,l]) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
                    <div style={catS3.swatch(bg)}>{bg}</div>
                    <span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{l}</span>
                  </div>
                ))}
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ TYPOGRAPHY ═══ */}
        <Sec3 id="type" title="Типографика">
          <div style={catS3.grid}>
            <Crd3 label="Полная иерархия (v2 + v3)" wide>
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                {[
                  ['34 / 800',34,800,'Расписание','Dark header title','v3'],
                  ['24 / 800',24,800,'1 300 ₽','Валюта (финанс. карточка)','v2'],
                  ['22 / 700',22,700,'26','Дата недели (event card)','v3'],
                  ['20 / 700',20,700,'Сегодня','Section header','v3'],
                  ['17 / 800',17,800,'Состав тренировки','Заголовок навбара','v2'],
                  ['17 / 600',17,600,'19:30','Время события','v3'],
                  ['16 / 800',16,800,'Записались','Заголовок группы','v2'],
                  ['16 / 600',16,600,'Список','Активный таб контента','v3'],
                  ['15 / 700',15,700,'Иван Соколов','Имя игрока','v2'],
                  ['15 / 600',15,600,'Тренировка','Название события','v3'],
                  ['15 / 500',15,500,'Тренировки','Chip label','v3'],
                  ['14 / 400',14,400,'24 мая, сб','Subtitle / role','v3'],
                  ['13 / 600',13,600,'Явка и оплата','Активный таб','v2'],
                  ['13 / 400',13,400,'Большая арена','Venue / sub','v3'],
                  ['12 / 500',12,500,'#17 · Нападающий','Позиция игрока','v2'],
                  ['10 / 600',10,600,'События','Nav label active','v3'],
                  ['10 / 400',10,400,'Команда','Nav label inactive','v3'],
                ].map(([spec,sz,w,text,usage,ver]) => (
                  <div key={spec+usage} style={{display:'flex',alignItems:'baseline',gap:16,padding:'6px 0',borderBottom:`1px solid ${C2.divider}`}}>
                    <span style={{fontSize:11,color:C2.textTer,minWidth:70,fontVariantNumeric:'tabular-nums',flexShrink:0}}>{spec}</span>
                    <span style={{fontSize:sz,fontWeight:w,color:sz<=12?C2.textTer:C2.text,minWidth:160}}>{text}</span>
                    <span style={{fontSize:11,color:C2.textQuad,fontStyle:'italic',flex:1}}>{usage}</span>
                    <span style={catS3.tag(ver==='v3'?'new':'old')}>{ver}</span>
                  </div>
                ))}
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ AVATAR ═══ */}
        <Sec3 id="avatar" title="Аватар">
          <div style={catS3.grid}>
            <Crd3 label="Размеры">
              <div style={{...catS3.row,gap:20,alignItems:'flex-end'}}>
                {[[28,'S'],[36,'M'],[46,'L'],[56,'XL']].map(([sz,l],i) => (
                  <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <DS2Avatar name="Иван Соколов" size={sz} idx={i}/><span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>{sz}px</span>
                  </div>
                ))}
              </div>
            </Crd3>
            <Crd3 label="Палитра тонов">
              <div style={{...catS3.row,gap:10}}>
                {['Иван Соколов','Алексей Кузнецов','Павел Белов','Роман Ковалёв','Игорь Петров','Сергей Орлов'].map((n,i) => (
                  <DS2Avatar key={i} name={n} size={46} idx={i}/>
                ))}
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ ACTION TILES ═══ */}
        <Sec3 id="tiles" title="Action Tiles">
          <div style={catS3.grid}>
            <Crd3 label="Был / Сдал — все состояния" wide>
              <div style={{...catS3.row,gap:20}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <DS2ActionTile icon={<Ic.person/>} label="Был"/><span style={{fontSize:11,color:C2.textTer}}>Не отмечен</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <DS2ActionTile active icon={<Ic.person/>} label="Был"/><span style={{fontSize:11,color:C2.textTer}}>Был</span>
                </div>
                <div style={{width:1,height:40,background:C2.divider}}/>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <DS2ActionTile icon={<Ic.wallet/>} label="Сдал"/><span style={{fontSize:11,color:C2.textTer}}>Не оплачено</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <DS2ActionTile active icon={<Ic.wallet/>} label="Сдал"/><span style={{fontSize:11,color:C2.textTer}}>Оплачено</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <DS2ActionTile active activeColor={C2.warning} icon={<Ic.wallet/>} label="700 ₽"/><span style={{fontSize:11,color:C2.textTer}}>Частично</span>
                </div>
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ NAV v2 ═══ */}
        <Sec3 id="nav" title="Навигация (v2)">
          <div style={catS3.grid}>
            <Crd3 label="NavBar" wide>
              <div style={{background:'#fff',borderRadius:12,overflow:'hidden',border:`1px solid ${C2.divider}`}}>
                <DS2NavBar title="Состав тренировки" subtitle="сб 24 мая · 19:30–21:00 · Ледовая Арена Север"/>
              </div>
            </Crd3>
            <Crd3 label="TabBar (underline)" wide>
              <div style={{background:'#fff',borderRadius:12,overflow:'hidden',border:`1px solid ${C2.divider}`}}>
                <DS2TabBar tabs={['Явка и оплата','Пятёрки / команды','Статистика']} active={0}/>
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ PLAYER ROWS ═══ */}
        <Sec3 id="rows" title="Строки игроков">
          <div style={catS3.grid}>
            <Crd3 label="GroupHeader + PlayerRow — все состояния" wide>
              <div style={catS3.mobile}>
                <DS2GroupHeader title="Записались" count={12}/>
                <DS2PlayerRow name="Иван Соколов" number={17} position="Нападающий" idx={0} attended={true} paid={1300} due={1300}/>
                <DS2PlayerRow name="Алексей Кузнецов" number={88} position="Нападающий" idx={1} attended={true} paid={700} due={1300}/>
                <DS2PlayerRow name="Павел Белов" number={44} position="Защитник" idx={2} attended={true} paid={0} due={1300}/>
                <DS2PlayerRow name="Максим Тарасов" number={13} position="Нападающий" idx={3} attended={false} paid={0} due={1300} isLast/>
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ DATA ═══ */}
        <Sec3 id="data" title="Данные">
          <div style={catS3.grid}>
            <Crd3 label="Donut / Progress Ring">
              <div style={{...catS3.row,gap:24}}>
                <DS2Donut percent={75} size={110}/><DS2Donut percent={42} size={80}/><DS2Donut percent={100} size={60}/>
              </div>
            </Crd3>
            <Crd3 label="StatChip">
              <div style={{display:'flex',gap:8}}>
                <DS2StatChip icon={<Ic.check c="#fff" s={13}/>} color={C2.primary} label="Оплатили" value={10}/>
                <DS2StatChip icon={<Ic.dot c="#fff" s={10}/>} color={C2.warning} label="Частично" value={2}/>
                <DS2StatChip icon={<Ic.userFill c="#fff" s={11}/>} color={C2.error} label="Должники" value={1}/>
              </div>
            </Crd3>
            <Crd3 label="Финансовая карточка" wide>
              <div style={{background:C2.cardBg,borderRadius:16,padding:'16px 18px 4px',border:`1px solid ${C2.cardBorder}`,maxWidth:393}}>
                <div style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,color:C2.textTer,fontWeight:500}}>Взнос с игрока</div>
                    <div style={{fontSize:24,fontWeight:800,fontVariantNumeric:'tabular-nums',marginTop:2}}>1 300 ₽</div>
                    <div style={{fontSize:12,color:C2.textTer,fontWeight:500,marginTop:12}}>Собрано</div>
                    <div style={{fontSize:24,fontWeight:800,fontVariantNumeric:'tabular-nums',marginTop:2}}>15 600 ₽</div>
                    <div style={{fontSize:12,color:C2.textQuad,fontWeight:500,marginTop:3}}>из 20 800 ₽</div>
                  </div>
                  <DS2Donut percent={75} size={110}/>
                </div>
                <div style={{height:1,background:C2.cardDiv,margin:'16px 0 0'}}/>
                <div style={{display:'flex',gap:4,padding:'14px 0'}}>
                  <DS2StatChip icon={<Ic.check c="#fff" s={13}/>} color={C2.primary} label="Оплатили" value={12}/>
                  <DS2StatChip icon={<Ic.dot c="#fff" s={10}/>} color={C2.warning} label="Частично" value={2}/>
                  <DS2StatChip icon={<Ic.userFill c="#fff" s={11}/>} color={C2.error} label="Должники" value={2}/>
                </div>
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══════════════════════════════════════
            NEW v3 — Schedule Screen Components
            ═══════════════════════════════════════ */}

        {/* ═══ DARK HEADER ═══ */}
        <Sec3 id="header3" title="Dark Header + Bottom Sheet" isNew>
          <div style={catS3.grid}>
            <Crd3 label="Паттерн: тёмный хедер → белый sheet" wide>
              <div style={{borderRadius:16,overflow:'hidden',maxWidth:430}}>
                <DS3DarkHeader/>
                <div style={{background:'#fff',borderRadius:'24px 24px 0 0',marginTop:-12,position:'relative',zIndex:2,padding:16}}>
                  <DS3ContentTabs/>
                </div>
              </div>
            </Crd3>
            <Crd3 label="Glass button + Bell">
              <div style={{display:'flex',gap:16,alignItems:'center',background:C3.headerBg,padding:20,borderRadius:12}}>
                <DS3GlassButton/>
                <div style={{position:'relative'}}>
                  <Ic3.bell/><div style={{position:'absolute',top:-1,right:-2,width:11,height:11,borderRadius:6,background:'#34C759',border:`2.5px solid ${C3.headerBg}`}}/>
                </div>
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ EVENT CARD ═══ */}
        <Sec3 id="eventcard" title="Event Card" isNew>
          <div style={catS3.grid}>
            <Crd3 label="Тренировка (время)" wide>
              <div style={{maxWidth:430}}>
                <DS3EventCard mode="today" timeTop="19:30" timeBottom="– 21:00" icon="clock" title="Тренировка" venue="Большая арена" count={12} total={16}/>
              </div>
            </Crd3>
            <Crd3 label="Игра (время)" wide>
              <div style={{maxWidth:430}}>
                <DS3EventCard mode="today" timeTop="21:15" timeBottom="– 23:00" icon="trophy" title="Игра vs Северные Волки" venue="Арена Петровка" count={15} total={18}/>
              </div>
            </Crd3>
            <Crd3 label="Турнир (gold)" wide>
              <div style={{maxWidth:430}}>
                <DS3EventCard mode="today" timeTop="23:30" timeBottom="– 01:00" icon="trophy" iconColor={C3.goldFg} iconBg={C3.goldBg} title="Турнир «Кубок Льда»" venue="Арена Север" count={10} total={16}/>
              </div>
            </Crd3>
            <Crd3 label="Неделя (дата + день)" wide>
              <div style={{maxWidth:430,display:'flex',flexDirection:'column',gap:12}}>
                <DS3EventCard mode="week" timeTop="26 пн" timeBottom="19:30" icon="clock" title="Тренировка" venue="Малая арена" count={8} total={14}/>
                <DS3EventCard mode="week" timeTop="27 вт" timeBottom="21:15" icon="trophy" title="Игра vs Медведи" venue="Арена Петровка" count={16} total={18}/>
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ CHIPS & TABS ═══ */}
        <Sec3 id="chips3" title="Filter Chips & Content Tabs" isNew>
          <div style={catS3.grid}>
            <Crd3 label="Filter Chips (dark active)" wide>
              <div style={{maxWidth:430}}>
                <DS3FilterChips active={0}/>
                <div style={{height:12}}/>
                <DS3FilterChips active={1}/>
              </div>
            </Crd3>
            <Crd3 label="Content Tabs (underline green)" wide>
              <div style={{maxWidth:430,background:'#fff',borderRadius:12,overflow:'hidden',border:`1px solid ${C2.divider}`}}>
                <DS3ContentTabs tabs={['Список','Календарь']} active={0}/>
              </div>
              <div style={{height:12}}/>
              <div style={{maxWidth:430,background:'#fff',borderRadius:12,overflow:'hidden',border:`1px solid ${C2.divider}`}}>
                <DS3ContentTabs tabs={['Список','Календарь']} active={1}/>
              </div>
            </Crd3>
            <Crd3 label="Section Header">
              <DS3SectionHeader title="Сегодня" subtitle="24 мая, сб"/>
              <div style={{height:1,background:C2.divider}}/>
              <DS3SectionHeader title="Эта неделя"/>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ BOTTOM NAV ═══ */}
        <Sec3 id="bottomnav" title="Bottom Navigation" isNew>
          <div style={catS3.grid}>
            <Crd3 label="Active: События" wide>
              <div style={{maxWidth:430,border:`1px solid ${C2.divider}`,borderRadius:12,overflow:'hidden'}}>
                <DS3BottomNav activeTab="events"/>
              </div>
            </Crd3>
            <Crd3 label="Active: Команда" wide>
              <div style={{maxWidth:430,border:`1px solid ${C2.divider}`,borderRadius:12,overflow:'hidden'}}>
                <DS3BottomNav activeTab="team"/>
              </div>
            </Crd3>
          </div>
        </Sec3>

        {/* ═══ FAB & BUTTONS ═══ */}
        <Sec3 id="buttons3" title="FAB & Buttons" isNew>
          <div style={catS3.grid}>
            <Crd3 label="FAB variants">
              <div style={{...catS3.row,gap:20,alignItems:'flex-end'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <DS3FAB variant="dark"/><span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>Dark (#233F30)</span>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <DS3FAB variant="primary"/><span style={{fontSize:11,fontWeight:600,color:C2.textSec}}>Primary (#1A5C35)</span>
                </div>
              </div>
            </Crd3>
            <Crd3 label="Glass button (on dark)">
              <div style={{display:'flex',gap:16,alignItems:'center',background:C3.headerBg,padding:20,borderRadius:12}}>
                <DS3GlassButton><Ic3.menu/></DS3GlassButton>
                <DS3GlassButton><Ic3.bell s={20}/></DS3GlassButton>
              </div>
            </Crd3>
          </div>
        </Sec3>

      </div>
    </div>
  );
};

Object.assign(window, { CatalogV3 });
