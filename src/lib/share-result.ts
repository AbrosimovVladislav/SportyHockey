import { formatName } from './format-name';
import { formatMatchTime } from './format-time';
import type { EventResultDto, GoalDto } from '@/types/api';

type Labels = {
  game: { vs: string; outcome: { win: string; draw: string; loss: string } };
  training: { vs: string };
  sectionGoals: string;
  unknown: string;
  assistsPrefix: string;
};

export function buildShareText(r: EventResultDto, labels: Labels): string {
  const sideALabel = r.is_game ? r.own_team_name || 'Своя' : 'Светлые';
  const sideBLabel = r.is_game ? r.opponent_name || 'Соперник' : 'Тёмные';
  const vs = r.is_game ? labels.game.vs : labels.training.vs;

  const header = `🏒 ${sideALabel} ${r.score.score_a} ${vs} ${r.score.score_b} ${sideBLabel}`;

  let outcomeLine = '';
  if (r.is_game) {
    const o =
      r.score.score_a > r.score.score_b
        ? labels.game.outcome.win
        : r.score.score_a < r.score.score_b
          ? labels.game.outcome.loss
          : labels.game.outcome.draw;
    outcomeLine = o;
  }

  const lines: string[] = [header];
  if (outcomeLine) lines.push(outcomeLine);

  if (r.goals.length > 0) {
    lines.push('');
    lines.push(labels.sectionGoals);
    r.goals.forEach((g, idx) => lines.push(formatGoalLine(g, idx + 1, sideALabel, sideBLabel, labels)));
  }

  return lines.join('\n');
}

function formatGoalLine(
  g: GoalDto,
  index: number,
  sideALabel: string,
  sideBLabel: string,
  labels: Labels,
): string {
  const sideLabel = g.team_side === 'own' || g.team_side === 'light' ? sideALabel : sideBLabel;
  const scorer = g.scorer ? formatName(g.scorer) : labels.unknown;
  const time = formatMatchTime(g.time_seconds);
  const assists = g.assists.map((a) => formatName(a)).join(', ');
  const parts = [`${index}. ${scorer} (${sideLabel})`];
  if (time) parts.push(time);
  if (assists) parts.push(`${labels.assistsPrefix}: ${assists}`);
  return parts.join(' · ');
}

export async function shareText(text: string, title?: string): Promise<'shared' | 'copied' | 'failed'> {
  if (typeof navigator === 'undefined') return 'failed';

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(title ? { title, text } : { text });
      return 'shared';
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}
