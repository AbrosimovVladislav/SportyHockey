import { ImageResponse } from 'next/og';
import { requireUser } from '@/lib/auth';
import { handleRouteError } from '@/lib/api-error';
import { supabaseServer } from '@/lib/supabase-server';
import { asEventType } from '@/lib/event-enum';
import { asResultSide, sidesForEventType } from '@/lib/event-result';
import { formatLongDate, formatTime } from '@/lib/event-format';
import { formatMatchTime } from '@/lib/format-time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

const WIDTH = 1200;
const HEIGHT = 630;

const COLOR_BG = '#0E2A1B';
const COLOR_BG_ACCENT = '#1A5C35';
const COLOR_BG_PATTERN = 'rgba(255,255,255,0.04)';
const COLOR_TEXT = '#FFFFFF';
const COLOR_MUTED = 'rgba(255,255,255,0.65)';
const COLOR_GOLD = '#E5C26B';

// Серверный код (OG image), нельзя использовать клиентский useT.
const TEXT = {
  sideOwn: 'Своя',
  sideOpponent: 'Соперник',
  sideLight: 'Светлые',
  sideDark: 'Тёмные',
  playerUnknown: 'Игрок не указан',
  outcomeWin: 'Победа',
  outcomeLoss: 'Поражение',
  outcomeDraw: 'Ничья',
  headerGame: 'РЕЗУЛЬТАТ МАТЧА',
  headerTraining: 'ИТОГИ ТРЕНИРОВКИ',
  ourTeam: 'Наша команда',
  lightSide: 'Светлая сторона',
  opponent: 'Соперник',
  darkSide: 'Тёмная сторона',
  noGoals: 'Голов не зафиксировано',
  goalSingular: 'гол',
  goalPlural: 'голов',
  brand: 'СГЕНЕРИРОВАНО В SPORTYHOCKEY',
} as const;

export async function GET(req: Request, { params }: Params): Promise<Response> {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const sb = supabaseServer();

    const { data: ev } = await sb
      .from('events')
      .select(
        'id, team_id, type, starts_at, opponent_name, venue:venues(name)',
      )
      .eq('id', id)
      .maybeSingle();
    if (!ev) {
      return new Response('Not found', { status: 404 });
    }
    const { data: mem } = await sb
      .from('team_memberships')
      .select('id')
      .eq('user_id', user.id)
      .eq('team_id', ev.team_id)
      .maybeSingle();
    if (!mem) {
      return new Response('Not found', { status: 404 });
    }

    const { data: team } = await sb.from('teams').select('name').eq('id', ev.team_id).maybeSingle();
    const ownTeamName = team?.name ?? '';
    const isGame = asEventType(ev.type) === 'game';
    const venueName =
      (Array.isArray(ev.venue) ? ev.venue[0]?.name : ev.venue?.name) ?? '';

    const { side_a, side_b } = sidesForEventType(isGame);
    const sideALabel = isGame ? ownTeamName || TEXT.sideOwn : TEXT.sideLight;
    const sideBLabel = isGame ? ev.opponent_name || TEXT.sideOpponent : TEXT.sideDark;

    const { data: goalRows } = await sb
      .from('result_points')
      .select('id, team_side, user_id, time_seconds, created_at')
      .eq('event_id', ev.id)
      .eq('type', 'goal')
      .order('created_at', { ascending: true });

    const { data: memberRows } = await sb
      .from('team_memberships')
      .select('user_id, jersey_number, users(first_name, last_name, username)')
      .eq('team_id', ev.team_id);
    const userById = new Map<
      string,
      { first_name: string | null; last_name: string | null; username: string | null; jersey: number | null }
    >();
    for (const m of memberRows ?? []) {
      const u = Array.isArray(m.users) ? m.users[0] : m.users;
      userById.set(m.user_id, {
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        username: u?.username ?? null,
        jersey: m.jersey_number ?? null,
      });
    }

    let scoreA = 0;
    let scoreB = 0;
    type GoalLine = { idx: number; sideLabel: string; scorer: string; time: string | null };
    const goalLines: GoalLine[] = [];
    let idx = 0;
    for (const g of goalRows ?? []) {
      const side = asResultSide(g.team_side);
      if (!side) continue;
      idx += 1;
      if (side === side_a) scoreA += 1;
      else if (side === side_b) scoreB += 1;
      const u = g.user_id ? userById.get(g.user_id) : undefined;
      const scorerName = u
        ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() ||
          (u.username ? `@${u.username}` : TEXT.playerUnknown)
        : TEXT.playerUnknown;
      goalLines.push({
        idx,
        sideLabel: side === side_a ? sideALabel : sideBLabel,
        scorer: scorerName,
        time: formatMatchTime(g.time_seconds),
      });
    }

    const outcome = isGame
      ? scoreA > scoreB
        ? { label: TEXT.outcomeWin, color: '#34C759' }
        : scoreA < scoreB
          ? { label: TEXT.outcomeLoss, color: '#FF453A' }
          : { label: TEXT.outcomeDraw, color: COLOR_MUTED }
      : null;

    const date = formatLongDate(ev.starts_at);
    const time = formatTime(ev.starts_at);

    const shownGoals = goalLines.slice(0, 6);
    const extraGoals = goalLines.length - shownGoals.length;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: `linear-gradient(135deg, ${COLOR_BG} 0%, ${COLOR_BG_ACCENT} 100%)`,
            color: COLOR_TEXT,
            fontFamily: 'sans-serif',
            padding: 56,
            position: 'relative',
          }}
        >
          {/* фоновый паттерн */}
          <div
            style={{
              position: 'absolute',
              top: -120,
              right: -120,
              width: 380,
              height: 380,
              borderRadius: '50%',
              background: COLOR_BG_PATTERN,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -160,
              left: -100,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: COLOR_BG_PATTERN,
            }}
          />

          {/* header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: 0.9,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: COLOR_GOLD,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 900,
                  color: COLOR_BG,
                }}
              >
                🏒
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em' }}>
                  SPORTYHOCKEY
                </span>
                <span style={{ fontSize: 14, color: COLOR_MUTED, letterSpacing: '0.06em' }}>
                  {isGame ? TEXT.headerGame : TEXT.headerTraining}
                </span>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 600 }}>{date}</span>
              <span style={{ fontSize: 14, color: COLOR_MUTED }}>
                {time}
                {venueName ? ` · ${venueName}` : ''}
              </span>
            </div>
          </div>

          {/* score */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 40,
              gap: 32,
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: COLOR_TEXT,
                  textAlign: 'right',
                }}
              >
                {sideALabel}
              </span>
              <span style={{ fontSize: 14, color: COLOR_MUTED }}>
                {isGame ? TEXT.ourTeam : TEXT.lightSide}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
                padding: '20px 36px',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 24,
                border: '2px solid rgba(255,255,255,0.12)',
              }}
            >
              <span style={{ fontSize: 130, fontWeight: 900, lineHeight: 1, color: COLOR_GOLD }}>
                {scoreA}
              </span>
              <span style={{ fontSize: 80, fontWeight: 800, color: COLOR_MUTED }}>:</span>
              <span style={{ fontSize: 130, fontWeight: 900, lineHeight: 1, color: COLOR_TEXT }}>
                {scoreB}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 28, fontWeight: 700 }}>{sideBLabel}</span>
              <span style={{ fontSize: 14, color: COLOR_MUTED }}>
                {isGame ? TEXT.opponent : TEXT.darkSide}
              </span>
            </div>
          </div>

          {/* outcome */}
          {outcome ? (
            <div
              style={{
                marginTop: 22,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  padding: '8px 22px',
                  background: `${outcome.color}22`,
                  border: `2px solid ${outcome.color}`,
                  borderRadius: 999,
                  fontSize: 22,
                  fontWeight: 800,
                  color: outcome.color,
                  letterSpacing: '0.04em',
                }}
              >
                {outcome.label.toUpperCase()}
              </span>
            </div>
          ) : null}

          {/* goals list */}
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              flex: 1,
            }}
          >
            {shownGoals.length === 0 ? (
              <span style={{ fontSize: 18, color: COLOR_MUTED, textAlign: 'center' }}>
                {TEXT.noGoals}
              </span>
            ) : (
              shownGoals.map((g) => (
                <div
                  key={g.idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 16,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: COLOR_GOLD,
                      color: COLOR_BG,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    {g.idx}
                  </span>
                  <span style={{ fontWeight: 700, flex: 1 }}>{g.scorer}</span>
                  <span style={{ color: COLOR_MUTED }}>{g.sideLabel}</span>
                  {g.time ? <span style={{ color: COLOR_MUTED }}>{g.time}</span> : null}
                </div>
              ))
            )}
            {extraGoals > 0 ? (
              <span style={{ fontSize: 14, color: COLOR_MUTED, marginTop: 6 }}>
                +{extraGoals} {extraGoals === 1 ? TEXT.goalSingular : TEXT.goalPlural}
              </span>
            ) : null}
          </div>

          {/* footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255,255,255,0.12)',
              paddingTop: 14,
              color: COLOR_MUTED,
              fontSize: 13,
              letterSpacing: '0.04em',
            }}
          >
            <span>{TEXT.brand}</span>
            <span>@sporty_hockey_bot</span>
          </div>
        </div>
      ),
      { width: WIDTH, height: HEIGHT },
    );
  } catch (e) {
    return handleRouteError(e);
  }
}
