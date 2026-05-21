'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Input } from './input';
import { Avatar } from './avatar';
import { useT } from '@/hooks/use-t';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { formatName } from '@/lib/format-name';
import { parseMatchTime } from '@/lib/format-time';
import type { CreateGoalRequest, GoalParticipant, ResultSide } from '@/types/api';

type Props = {
  open: boolean;
  onClose: () => void;
  isGame: boolean;
  sideALabel: string;
  sideBLabel: string;
  sideAValue: ResultSide;
  sideBValue: ResultSide;
  players: GoalParticipant[];
  onSubmit: (body: CreateGoalRequest) => void;
  isPending: boolean;
  error: string | null;
};

type Step = 'scorer' | 'assist1' | 'assist2' | null;

export function AddGoalSheet({
  open,
  onClose,
  isGame,
  sideALabel,
  sideBLabel,
  sideAValue,
  sideBValue,
  players,
  onSubmit,
  isPending,
  error,
}: Props) {
  const t = useT();
  const [side, setSide] = useState<ResultSide | null>(null);
  const [scorerId, setScorerId] = useState<string | null>(null);
  const [assist1Id, setAssist1Id] = useState<string | null>(null);
  const [assist2Id, setAssist2Id] = useState<string | null>(null);
  const [time, setTime] = useState('');
  const [pickerOpen, setPickerOpen] = useState<Step>(null);

  useEffect(() => {
    if (!open) {
      setSide(null);
      setScorerId(null);
      setAssist1Id(null);
      setAssist2Id(null);
      setTime('');
      setPickerOpen(null);
    }
  }, [open]);

  const ourSide = !isGame || side !== 'opponent';
  const timeValid = time.trim() === '' || parseMatchTime(time) != null;

  const handleSubmit = () => {
    if (!side) return;
    const parsedTime = time.trim() === '' ? null : parseMatchTime(time);
    if (time.trim() !== '' && parsedTime == null) return;
    const body: CreateGoalRequest = {
      team_side: side,
      scorer_user_id: ourSide ? scorerId : null,
      time_seconds: parsedTime,
      assist1_user_id: ourSide ? assist1Id : null,
      assist2_user_id: ourSide ? assist2Id : null,
    };
    onSubmit(body);
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

  const excludeForAssist1 = new Set<string>([scorerId, assist2Id].filter((x): x is string => !!x));
  const excludeForAssist2 = new Set<string>([scorerId, assist1Id].filter((x): x is string => !!x));
  const excludeForScorer = new Set<string>([assist1Id, assist2Id].filter((x): x is string => !!x));

  return (
    <BottomSheet open={open} onClose={onClose} title={t('result.goal.title')}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={label}>{t('result.goal.side')}</div>
        <div style={sideRow}>
          <button
            type="button"
            className="pressable"
            style={sideBtn(side === sideAValue)}
            onClick={() => setSide(sideAValue)}
          >
            {sideALabel}
          </button>
          <button
            type="button"
            className="pressable"
            style={sideBtn(side === sideBValue)}
            onClick={() => setSide(sideBValue)}
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
          <Input
            inputMode="numeric"
            placeholder={t('result.goal.time.placeholder')}
            value={time}
            onChange={(e) => setTime(e.currentTarget.value.slice(0, 7))}
            invalid={!timeValid}
            maxLength={7}
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
            disabled={isPending}
          >
            {t('result.actions.cancel')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSubmit}
            disabled={!side || !timeValid || isPending}
          >
            {isPending ? t('result.actions.saving') : t('result.actions.add')}
          </Button>
        </div>
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
        players={players}
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
  players: GoalParticipant[];
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
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {formatName(p)}
              </span>
              {p.jersey_number != null ? (
                <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>#{p.jersey_number}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
