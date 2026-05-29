'use client';

import type { CSSProperties, ReactNode } from 'react';
import { Avatar } from './avatar';
import {
  IconSparkle,
  IconHockeyStick,
  IconShield,
  IconGoalie,
  IconStats,
  IconWhistle,
} from './icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { formatName } from '@/lib/format-name';
import { interp } from '@/lib/format';
import type {
  PlayerPosition,
  TeamStatsAnalytics,
  TeamStatsLeader,
  TeamStatsPointsShare,
  TeamStatsPositionContribution,
  TeamStatsTopCombination,
} from '@/types/api';

// Общая карточка-обёртка с заголовком — фон, отступы, тень одинаковые для
// всех визуализаций аналитики на экране /squad/stats.
function AnalyticsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const wrap: CSSProperties = {
    background: colors.bg,
    borderRadius: radius.lg,
    padding: `${spacing['16']}px ${spacing['16']}px`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['12'],
  };
  const titleStyle: CSSProperties = { ...typography.h3, color: colors.text };
  const sub: CSSProperties = { ...typography.sm, color: colors.textSecondary, marginTop: -8 };

  return (
    <div style={wrap}>
      <div style={titleStyle}>{title}</div>
      {subtitle ? <div style={sub}>{subtitle}</div> : null}
      {children}
    </div>
  );
}

// Цветовая шкала для донат-чарта и связанных визуализаций:
// 3 оттенка зелёного (от насыщенного к светлому) + серый для «Остальные».
const POINTS_COLORS = [colors.successDark, colors.success, '#A6E5B7', colors.divider] as const;

function fullName(p: { first_name: string | null; last_name: string | null }): string {
  return formatName({ first_name: p.first_name, last_name: p.last_name, username: null });
}

// Универсальная строка-лидер: ранг (медаль или номер), аватар, имя/амплуа, значение справа.
function LeaderRow({
  rank,
  player,
  valueLabel,
  position,
  labels,
}: {
  rank?: number;
  player: TeamStatsLeader;
  valueLabel: string;
  position?: boolean;
  labels: { position: Record<PlayerPosition, string> };
}) {
  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
  };
  // Подиум: 1 — золото, 2 — серебро, 3 — бронза. Цифра внутри — белая, чтобы
  // читалась поверх насыщенного фона на любой из трёх медалей. Цвета вынесены
  // в colors (gold/silver/bronze) — единая палитра подиума для аналитики.
  const medalBg =
    rank === 1 ? colors.gold : rank === 2 ? colors.silver : rank === 3 ? colors.bronze : colors.divider;
  const medal: CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: medalBg,
    color: colors.textInverse,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  };
  const body: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
  const nm: CSSProperties = {
    ...typography.bodyBold,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 14,
  };
  const sub: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
    fontSize: 12,
  };
  const value: CSSProperties = {
    ...typography.bodyBold,
    color: colors.primary,
    fontVariantNumeric: 'tabular-nums',
    fontSize: 17,
    flexShrink: 0,
  };

  const name = fullName(player);
  const subParts: string[] = [];
  if (player.jersey_number != null) subParts.push(`#${player.jersey_number}`);
  if (position && player.position) subParts.push(labels.position[player.position]);

  // avatar_url (загруженная организатором фотка) приоритетнее photo_url
  // (телеграмная) — иначе у игроков, которым команда выставила «нормальный»
  // аватар, в аналитике всё равно вылезала бы исходная телеграмная.
  const avatarSrc = player.avatar_url ?? player.photo_url ?? null;

  return (
    <div style={wrap}>
      {rank != null ? <span style={medal}>{rank}</span> : null}
      <Avatar src={avatarSrc} name={name} size={32} />
      <div style={body}>
        <span style={nm}>{name}</span>
        {subParts.length > 0 ? <span style={sub}>{subParts.join(' · ')}</span> : null}
      </div>
      <span style={value}>{valueLabel}</span>
    </div>
  );
}

// === 1. Распределение очков команды (донат + легенда) ===
export function PointsDistributionCard({
  distribution,
  total,
  title,
  totalLabel,
  othersLabel,
}: {
  distribution: TeamStatsPointsShare[];
  total: number;
  title: string;
  totalLabel: string;
  othersLabel: string;
}) {
  return (
    <AnalyticsCard title={title}>
      <DonutChart segments={distribution} total={total} centerLabel={totalLabel} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
        {distribution.map((d, i) => {
          const label = d.user_id == null ? othersLabel : fullName(d);
          const pct = total > 0 ? (d.points / total) * 100 : 0;
          return (
            <div
              key={d.user_id ?? '__others'}
              style={{ display: 'flex', alignItems: 'center', gap: spacing['10'] }}
            >
              <span
                aria-hidden
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: POINTS_COLORS[i] ?? colors.divider,
                  flexShrink: 0,
                }}
              />
              <span style={{ ...typography.body, color: colors.text, flex: 1, fontSize: 14 }}>
                {label}
              </span>
              <span
                style={{
                  ...typography.bodyBold,
                  color: colors.text,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 14,
                }}
              >
                {d.points}
              </span>
              <span
                style={{
                  ...typography.sm,
                  color: colors.textSecondary,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 50,
                  textAlign: 'right',
                }}
              >
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </AnalyticsCard>
  );
}

function DonutChart({
  segments,
  total,
  centerLabel,
}: {
  segments: TeamStatsPointsShare[];
  total: number;
  centerLabel: string;
}) {
  const size = 160;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        padding: `${spacing['8']}px 0`,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Серый фоновый круг — на случай нуля очков виден полный обод. */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colors.divider}
          strokeWidth={stroke}
        />
        {total > 0
          ? segments.map((s, i) => {
              const portion = (s.points / total) * circ;
              const dashArray = `${portion} ${circ - portion}`;
              const el = (
                <circle
                  key={s.user_id ?? `__others-${i}`}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={POINTS_COLORS[i] ?? colors.divider}
                  strokeWidth={stroke}
                  strokeDasharray={dashArray}
                  strokeDashoffset={-offset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                />
              );
              offset += portion;
              return el;
            })
          : null}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ ...typography.statLg, color: colors.text }}>{total}</span>
        <span style={{ ...typography.sm, color: colors.textSecondary, marginTop: -4 }}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
}

// === 2. Голы и передачи (два столбика) ===
export function BarPairCard({
  title,
  goals,
  assists,
  goalsLabel,
  assistsLabel,
}: {
  title: string;
  goals: number;
  assists: number;
  goalsLabel: string;
  assistsLabel: string;
}) {
  const max = Math.max(goals, assists, 1);
  const barWidth = 28;
  const maxBarHeight = 100;
  const goalsH = max === 0 ? 0 : Math.max(8, (goals / max) * maxBarHeight);
  const assistsH = max === 0 ? 0 : Math.max(8, (assists / max) * maxBarHeight);

  const wrap: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing['32'],
    paddingTop: spacing['8'],
  };
  const col: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['8'],
  };
  const number: CSSProperties = {
    ...typography.stat,
    color: colors.text,
  };
  const caption: CSSProperties = {
    ...typography.sm,
    color: colors.textSecondary,
  };

  return (
    <AnalyticsCard title={title}>
      <div style={wrap}>
        <div style={col}>
          <div
            aria-hidden
            style={{
              width: barWidth,
              height: goalsH,
              background: colors.successDark,
              borderRadius: 8,
            }}
          />
          <span style={number}>{goals}</span>
          <span style={caption}>{goalsLabel}</span>
        </div>
        <div style={col}>
          <div
            aria-hidden
            style={{
              width: barWidth,
              height: assistsH,
              background: '#A6E5B7',
              borderRadius: 8,
            }}
          />
          <span style={number}>{assists}</span>
          <span style={caption}>{assistsLabel}</span>
        </div>
      </div>
    </AnalyticsCard>
  );
}

// === 3. Эффективность (топ-3) ===
export function EfficiencyTop3Card({
  title,
  caption,
  players,
  positionLabels,
  emptyLabel,
}: {
  title: string;
  caption: string;
  players: TeamStatsLeader[];
  positionLabels: Record<PlayerPosition, string>;
  emptyLabel: string;
}) {
  return (
    <AnalyticsCard title={title} subtitle={caption}>
      {players.length === 0 ? (
        <span style={{ ...typography.sm, color: colors.textTertiary }}>{emptyLabel}</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
          {players.map((p, i) => (
            <LeaderRow
              key={p.user_id}
              rank={i + 1}
              player={p}
              position
              valueLabel={p.value.toFixed(2)}
              labels={{ position: positionLabels }}
            />
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}

// === 4. Лучшие по категориям ===
export function CategoryLeadersCard({
  title,
  leaders,
  labels,
  emptyLabel,
  formatPenalty,
  showPenalty = true,
}: {
  title: string;
  leaders: TeamStatsAnalytics['leaders'];
  labels: {
    points: string;
    goals: string;
    assists: string;
    penalty: string;
  };
  emptyLabel: string;
  formatPenalty: (n: number) => string;
  // На тренировках штрафов не бывает — строку скрываем.
  showPenalty?: boolean;
}) {
  const rows: { key: string; icon: ReactNode; label: string; leader: TeamStatsLeader | null; value: string | null }[] = [
    {
      key: 'points',
      icon: <IconSparkle size={20} color={colors.primary} />,
      label: labels.points,
      leader: leaders.points,
      value: leaders.points ? String(leaders.points.value) : null,
    },
    {
      key: 'goals',
      icon: <IconHockeyStick size={20} color={colors.primary} />,
      label: labels.goals,
      leader: leaders.goals,
      value: leaders.goals ? String(leaders.goals.value) : null,
    },
    {
      key: 'assists',
      icon: <IconStats size={20} color={colors.primary} />,
      label: labels.assists,
      leader: leaders.assists,
      value: leaders.assists ? String(leaders.assists.value) : null,
    },
    ...(showPenalty
      ? [{
          key: 'penalty',
          icon: <IconWhistle size={20} color={colors.primary} />,
          label: labels.penalty,
          leader: leaders.penalties,
          value: leaders.penalties ? formatPenalty(leaders.penalties.value) : null,
        }]
      : []),
  ];

  return (
    <AnalyticsCard title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['10'] }}>
        {rows.map((r) => (
          <div
            key={r.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing['10'],
              paddingTop: 6,
              paddingBottom: 6,
              borderTop: `1px solid ${colors.divider}`,
            }}
          >
            <span style={{ display: 'inline-flex', flexShrink: 0 }}>{r.icon}</span>
            <span style={{ ...typography.body, color: colors.text, fontSize: 14, width: 84 }}>
              {r.label}
            </span>
            <span
              style={{
                ...typography.body,
                color: colors.text,
                fontSize: 14,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {r.leader ? fullName(r.leader) : emptyLabel}
            </span>
            <span
              style={{
                ...typography.bodyBold,
                color: colors.text,
                fontVariantNumeric: 'tabular-nums',
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {r.value ?? '—'}
            </span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

// === 5. Вклад по амплуа (прогресс-бары) ===
export function PositionContributionCard({
  title,
  rows,
  positionLabels,
  valueTemplate,
}: {
  title: string;
  rows: TeamStatsPositionContribution[];
  positionLabels: Record<PlayerPosition, string>;
  // 'N голов / N передач'
  valueTemplate: string;
}) {
  const totalGoals = rows.reduce((s, r) => s + r.goals, 0);
  const icons: Record<PlayerPosition, ReactNode> = {
    forward: <IconHockeyStick size={18} color={colors.primary} />,
    defender: <IconShield size={18} color={colors.primary} />,
    goalie: <IconGoalie size={18} color={colors.primary} />,
  };

  return (
    <AnalyticsCard title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['12'] }}>
        {rows.map((r) => {
          const w = totalGoals > 0 ? (r.goals / totalGoals) * 100 : 0;
          return (
            <div
              key={r.position}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing['10'],
                }}
              >
                <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icons[r.position]}</span>
                <span style={{ ...typography.body, color: colors.text, fontSize: 14, flex: 1 }}>
                  {positionLabels[r.position]}
                </span>
                <span
                  style={{
                    ...typography.sm,
                    color: colors.textSecondary,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {interp(valueTemplate, { goals: r.goals, assists: r.assists })}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: colors.divider,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${w}%`,
                    background: colors.successDark,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AnalyticsCard>
  );
}

// === 6. Топ связок ===
export function TopCombinationsCard({
  title,
  combinations,
  emptyLabel,
  valueTemplate,
}: {
  title: string;
  combinations: TeamStatsTopCombination[];
  emptyLabel: string;
  valueTemplate: string; // '{count} голов'
}) {
  return (
    <AnalyticsCard title={title}>
      {combinations.length === 0 ? (
        <span style={{ ...typography.sm, color: colors.textTertiary }}>{emptyLabel}</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['8'] }}>
          {combinations.map((c, i) => (
            <div
              key={`${c.player_a.user_id}|${c.player_b.user_id}-${i}`}
              style={{ display: 'flex', alignItems: 'center', gap: spacing['8'] }}
            >
              <Avatar
                src={c.player_a.avatar_url ?? c.player_a.photo_url ?? null}
                name={fullName(c.player_a)}
                size={28}
              />
              <span
                style={{
                  ...typography.body,
                  color: colors.text,
                  fontSize: 14,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.player_a.last_name ?? fullName(c.player_a)}
              </span>
              {/* Двусторонняя стрелка: связка — это партнёрство, а не
                  направление «ассистент→бомбардир». */}
              <span style={{ ...typography.sm, color: colors.textSecondary }}>↔</span>
              <Avatar
                src={c.player_b.avatar_url ?? c.player_b.photo_url ?? null}
                name={fullName(c.player_b)}
                size={28}
              />
              <span
                style={{
                  ...typography.body,
                  color: colors.text,
                  fontSize: 14,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.player_b.last_name ?? fullName(c.player_b)}
              </span>
              <span
                style={{
                  ...typography.bodyBold,
                  color: colors.primary,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {interp(valueTemplate, { count: c.goals })}
              </span>
            </div>
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}

// === 7. Самые удаляющиеся ===
export function PenaltyLeadersCard({
  title,
  players,
  positionLabels,
  emptyLabel,
  valueTemplate,
}: {
  title: string;
  players: TeamStatsLeader[];
  positionLabels: Record<PlayerPosition, string>;
  emptyLabel: string;
  valueTemplate: string; // '{count} мин'
}) {
  return (
    <AnalyticsCard title={title}>
      {players.length === 0 ? (
        <span style={{ ...typography.sm, color: colors.textTertiary }}>{emptyLabel}</span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing['10'] }}>
          {players.map((p, i) => (
            <LeaderRow
              key={p.user_id}
              rank={i + 1}
              player={p}
              valueLabel={interp(valueTemplate, { count: p.value })}
              labels={{ position: positionLabels }}
            />
          ))}
        </div>
      )}
    </AnalyticsCard>
  );
}
