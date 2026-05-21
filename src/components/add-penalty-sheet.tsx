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
import type { CreatePenaltyRequest, GoalParticipant, ResultSide } from '@/types/api';

type Props = {
  open: boolean;
  onClose: () => void;
  isGame: boolean;
  sideALabel: string;
  sideBLabel: string;
  sideAValue: ResultSide;
  sideBValue: ResultSide;
  players: GoalParticipant[];
  onSubmit: (body: CreatePenaltyRequest) => void;
  isPending: boolean;
  error: string | null;
};

const MINUTES_OPTIONS = [2, 5, 10] as const;

export function AddPenaltySheet({
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
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [minutes, setMinutes] = useState<number>(2);
  const [time, setTime] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSide(null);
      setPlayerId(null);
      setMinutes(2);
      setTime('');
      setPickerOpen(false);
    }
  }, [open]);

  const ourSide = !isGame || side !== 'opponent';
  const timeValid = time.trim() === '' || parseMatchTime(time) != null;

  const handleSubmit = () => {
    if (!side) return;
    const parsedTime = time.trim() === '' ? null : parseMatchTime(time);
    if (time.trim() !== '' && parsedTime == null) return;
    const body: CreatePenaltyRequest = {
      team_side: side,
      player_user_id: ourSide ? playerId : null,
      minutes,
      time_seconds: parsedTime,
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

  const minutesRow: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${MINUTES_OPTIONS.length}, 1fr)`,
    gap: spacing['8'],
  };

  const minutesBtn = (active: boolean): CSSProperties => ({
    padding: `${spacing['10']}px ${spacing['8']}px`,
    borderRadius: radius.md,
    border: active ? `1.5px solid ${colors.primary}` : `1.5px solid ${colors.border}`,
    background: active ? colors.primaryLight : colors.bg,
    color: active ? colors.primary : colors.text,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 44,
  });

  const player = playerId ? players.find((p) => p.user_id === playerId) ?? null : null;

  const placeholderText: CSSProperties = {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: 500,
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t('result.penalty.title')}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={label}>{t('result.penalty.side')}</div>
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
          <div style={fieldBlock}>
            <div style={label}>{t('result.penalty.player')}</div>
            <button
              type="button"
              className="pressable"
              style={playerSelectBtn}
              onClick={() => setPickerOpen(true)}
            >
              {player ? (
                <>
                  <Avatar src={player.photo_url} name={formatName(player)} size={28} />
                  <span>{formatName(player)}</span>
                </>
              ) : (
                <span style={placeholderText}>{t('result.penalty.player.placeholder')}</span>
              )}
            </button>
          </div>
        ) : null}

        <div style={fieldBlock}>
          <div style={label}>{t('result.penalty.minutes')}</div>
          <div style={minutesRow}>
            {MINUTES_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                className="pressable"
                style={minutesBtn(minutes === m)}
                onClick={() => setMinutes(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div style={fieldBlock}>
          <div style={label}>{t('result.penalty.time')}</div>
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
        open={pickerOpen}
        title={t('result.penalty.player')}
        players={players}
        currentId={playerId}
        onPick={(uid) => {
          setPlayerId(uid);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </BottomSheet>
  );
}

type PickerProps = {
  open: boolean;
  title: string;
  players: GoalParticipant[];
  currentId: string | null;
  onPick: (uid: string | null) => void;
  onClose: () => void;
};

function PlayerPicker({ open, title, players, currentId, onPick, onClose }: PickerProps) {
  const t = useT();
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
        {players.map((p) => {
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
