'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Avatar } from './avatar';
import { TimePicker } from './time-picker';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatName } from '@/lib/format-name';
import type {
  CreateGoalRequest,
  GoalDto,
  GoalParticipant,
  ResultSide,
  TeamSide,
} from '@/types/api';

export type EligiblePlayer = GoalParticipant & { team_side: TeamSide };

type Props = {
  open: boolean;
  onClose: () => void;
  isGame: boolean;
  sideALabel: string;
  sideBLabel: string;
  sideAValue: ResultSide;
  sideBValue: ResultSide;
  players: EligiblePlayer[];
  initial: GoalDto | null;
  onSubmit: (body: CreateGoalRequest) => void;
  onDelete?: () => void;
  isPending: boolean;
  isDeleting?: boolean;
  error: string | null;
};

function playersForSide(all: EligiblePlayer[], side: ResultSide | null): EligiblePlayer[] {
  if (!side) return [];
  if (side === 'opponent') return [];
  if (side === 'light' || side === 'dark') {
    return all.filter((p) => p.team_side === side);
  }
  // 'own' (game): любой заявленный за нашу команду
  return all;
}

type PickerStep = 'scorer' | 'assist1' | 'assist2' | null;

export function AddGoalSheet({
  open,
  onClose,
  isGame,
  sideALabel,
  sideBLabel,
  sideAValue,
  sideBValue,
  players,
  initial,
  onSubmit,
  onDelete,
  isPending,
  isDeleting,
  error,
}: Props) {
  const t = useT();
  const isEdit = initial !== null;

  const [side, setSide] = useState<ResultSide | null>(null);
  const [scorerId, setScorerId] = useState<string | null>(null);
  const [assist1Id, setAssist1Id] = useState<string | null>(null);
  const [assist2Id, setAssist2Id] = useState<string | null>(null);
  const [timeSeconds, setTimeSeconds] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState<PickerStep>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setSide(initial.team_side);
      setScorerId(initial.scorer?.user_id ?? null);
      setAssist1Id(initial.assists[0]?.user_id ?? null);
      setAssist2Id(initial.assists[1]?.user_id ?? null);
      setTimeSeconds(initial.time_seconds);
    } else {
      setSide(null);
      setScorerId(null);
      setAssist1Id(null);
      setAssist2Id(null);
      setTimeSeconds(null);
    }
    setPickerOpen(null);
  }, [open, initial]);

  const ourSide = !isGame || side !== 'opponent';
  const eligible = playersForSide(players, side);

  const changeSide = (next: ResultSide) => {
    if (side === next) return;
    const nextEligible = playersForSide(players, next);
    const ids = new Set(nextEligible.map((p) => p.user_id));
    if (scorerId && !ids.has(scorerId)) setScorerId(null);
    if (assist1Id && !ids.has(assist1Id)) setAssist1Id(null);
    if (assist2Id && !ids.has(assist2Id)) setAssist2Id(null);
    setSide(next);
  };

  const handleSubmit = () => {
    if (!side) return;
    onSubmit({
      team_side: side,
      scorer_user_id: ourSide ? scorerId : null,
      time_seconds: timeSeconds,
      assist1_user_id: ourSide ? assist1Id : null,
      assist2_user_id: ourSide ? assist2Id : null,
    });
  };

  const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: spacing['6'],
  };

  const sideRow: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing['8'],
    marginBottom: spacing['12'],
  };

  const sideBtn = (active: boolean): CSSProperties => ({
    padding: `${spacing['10']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    border: active ? `1.5px solid ${colors.primary}` : `1.5px solid ${colors.border}`,
    background: active ? colors.primaryLight : colors.bg,
    color: active ? colors.primary : colors.text,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: 44,
  });

  const fieldBlock: CSSProperties = {
    marginBottom: spacing['12'],
  };

  const playerSelectBtn: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: colors.bgMuted,
    border: 'none',
    borderRadius: radius.md,
    width: '100%',
    minHeight: 48,
    cursor: 'pointer',
    color: colors.text,
    fontSize: 15,
    fontWeight: 500,
    textAlign: 'left',
  };

  const placeholderText: CSSProperties = {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: 500,
  };

  const findPlayer = (id: string | null) => (id ? players.find((p) => p.user_id === id) ?? null : null);

  const scorer = findPlayer(scorerId);
  const assist1 = findPlayer(assist1Id);
  const assist2 = findPlayer(assist2Id);

  const excludeForScorer = new Set<string>([assist1Id, assist2Id].filter((x): x is string => !!x));
  const excludeForAssist1 = new Set<string>([scorerId, assist2Id].filter((x): x is string => !!x));
  const excludeForAssist2 = new Set<string>([scorerId, assist1Id].filter((x): x is string => !!x));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEdit ? t('result.goal.editTitle') : t('result.goal.title')}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={label}>{t('result.goal.side')}</div>
        <div style={sideRow}>
          <button
            type="button"
            className="pressable"
            style={sideBtn(side === sideAValue)}
            onClick={() => changeSide(sideAValue)}
          >
            {sideALabel}
          </button>
          <button
            type="button"
            className="pressable"
            style={sideBtn(side === sideBValue)}
            onClick={() => changeSide(sideBValue)}
          >
            {sideBLabel}
          </button>
        </div>

        {ourSide && side ? (
          <>
            <div style={fieldBlock}>
              <div style={label}>{t('result.goal.scorer')}</div>
              <button
                type="button"
                className="pressable"
                style={playerSelectBtn}
                onClick={() => setPickerOpen('scorer')}
              >
                {scorer ? (
                  <>
                    <Avatar src={scorer.photo_url} name={formatName(scorer)} size={28} />
                    <span>{formatName(scorer)}</span>
                  </>
                ) : (
                  <span style={placeholderText}>{t('result.goal.scorer.placeholder')}</span>
                )}
              </button>
            </div>

            <div style={fieldBlock}>
              <div style={label}>{t('result.goal.assist1')}</div>
              <button
                type="button"
                className="pressable"
                style={playerSelectBtn}
                onClick={() => setPickerOpen('assist1')}
              >
                {assist1 ? (
                  <>
                    <Avatar src={assist1.photo_url} name={formatName(assist1)} size={28} />
                    <span>{formatName(assist1)}</span>
                  </>
                ) : (
                  <span style={placeholderText}>{t('result.goal.assist.placeholder')}</span>
                )}
              </button>
            </div>

            <div style={fieldBlock}>
              <div style={label}>{t('result.goal.assist2')}</div>
              <button
                type="button"
                className="pressable"
                style={playerSelectBtn}
                onClick={() => setPickerOpen('assist2')}
              >
                {assist2 ? (
                  <>
                    <Avatar src={assist2.photo_url} name={formatName(assist2)} size={28} />
                    <span>{formatName(assist2)}</span>
                  </>
                ) : (
                  <span style={placeholderText}>{t('result.goal.assist.placeholder')}</span>
                )}
              </button>
            </div>
          </>
        ) : null}

        <div style={fieldBlock}>
          <div style={label}>{t('result.goal.time')}</div>
          <TimePicker
            value={timeSeconds}
            onChange={setTimeSeconds}
            clearLabel={t('result.time.clear')}
          />
        </div>

        {error ? (
          <div
            style={{
              fontSize: 13,
              color: colors.error,
              background: colors.errorBg,
              padding: `${spacing['8']}px ${spacing['12']}px`,
              borderRadius: radius.md,
              marginBottom: spacing['12'],
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: spacing['8'], marginTop: spacing['8'] }}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onClose}
            disabled={isPending || isDeleting}
          >
            {t('result.actions.cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={!side || isPending || isDeleting}
          >
            {isPending
              ? t('result.actions.saving')
              : isEdit
                ? t('result.actions.save')
                : t('result.actions.add')}
          </Button>
        </div>

        {isEdit && onDelete ? (
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={onDelete}
            disabled={isPending || isDeleting}
            style={{ color: colors.error, marginTop: spacing['8'] }}
          >
            {isDeleting ? t('result.actions.deleting') : t('result.actions.deleteGoal')}
          </Button>
        ) : null}
      </div>

      <PlayerPicker
        open={pickerOpen !== null}
        title={
          pickerOpen === 'scorer'
            ? t('result.goal.scorer')
            : pickerOpen === 'assist1'
              ? t('result.goal.assist1')
              : pickerOpen === 'assist2'
                ? t('result.goal.assist2')
                : ''
        }
        players={eligible}
        exclude={
          pickerOpen === 'scorer'
            ? excludeForScorer
            : pickerOpen === 'assist1'
              ? excludeForAssist1
              : excludeForAssist2
        }
        currentId={
          pickerOpen === 'scorer'
            ? scorerId
            : pickerOpen === 'assist1'
              ? assist1Id
              : pickerOpen === 'assist2'
                ? assist2Id
                : null
        }
        onPick={(uid) => {
          if (pickerOpen === 'scorer') setScorerId(uid);
          else if (pickerOpen === 'assist1') setAssist1Id(uid);
          else if (pickerOpen === 'assist2') setAssist2Id(uid);
          setPickerOpen(null);
        }}
        onClose={() => setPickerOpen(null)}
      />
    </BottomSheet>
  );
}

type PickerProps = {
  open: boolean;
  title: string;
  players: EligiblePlayer[];
  exclude: Set<string>;
  currentId: string | null;
  onPick: (uid: string | null) => void;
  onClose: () => void;
};

function PlayerPicker({ open, title, players, exclude, currentId, onPick, onClose }: PickerProps) {
  const t = useT();
  const filtered = players.filter((p) => !exclude.has(p.user_id));

  const row = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: active ? colors.primaryLight : 'transparent',
    border: 'none',
    borderRadius: radius.md,
    width: '100%',
    minHeight: 48,
    cursor: 'pointer',
    color: active ? colors.primary : colors.text,
    fontSize: 15,
    fontWeight: active ? 700 : 500,
    textAlign: 'left',
  });

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '60dvh', overflowY: 'auto' }}>
        <button
          type="button"
          className="pressable"
          style={row(currentId === null)}
          onClick={() => onPick(null)}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: colors.bgMuted,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textTertiary,
              fontSize: 14,
            }}
          >
            —
          </span>
          <span>{t('result.picker.none')}</span>
        </button>
        {filtered.map((p) => {
          const active = p.user_id === currentId;
          return (
            <button
              key={p.user_id}
              type="button"
              className="pressable"
              style={row(active)}
              onClick={() => onPick(p.user_id)}
            >
              <Avatar src={p.photo_url} name={formatName(p)} size={28} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatName(p)}
              </span>
              {p.jersey_number != null ? (
                <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
                  #{p.jersey_number}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
