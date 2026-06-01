'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { Avatar } from '@/components/avatar';
import { IconSearch } from '@/components/icons';
import { useT } from '@/hooks/use-t';
import { formatName } from '@/lib/format-name';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { TeamMember } from '@/types/api';

// Bottomsheet для ввода/правки депозита игрока. Депозит — оплата без привязки
// к событию (на будущие сборы): создаётся в `finance_transactions` как
// type='player_payment' с пустым event_id.
//
// Три режима:
//   - create  — пустые поля, кнопка «Сохранить» делает POST.
//   - edit    — поля заполнены из существующей записи, кнопка «Сохранить»
//               делает PATCH; внизу появляется «Удалить» (через confirm).
// При тапе на поле игрока поверх sheet'а вылазит вложенный BottomSheet
// со списком состава и инлайн-поиском.

export type DepositInitial = {
  id: string;
  user_id: string;
  amount: number;
  occurred_on: string; // YYYY-MM-DD
  description: string | null;
};

export type DepositFormValue = {
  user_id: string;
  amount: number;
  occurred_on: string;
  description: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initial: DepositInitial | null;
  members: TeamMember[];
  onSubmit: (value: DepositFormValue) => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string | null;
};

export function DepositSheet({
  open,
  onClose,
  mode,
  initial,
  members,
  onSubmit,
  onDelete,
  isSaving,
  isDeleting,
  error,
}: Props) {
  const t = useT();
  const isEdit = mode === 'edit';

  const [userId, setUserId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(todayIso());
  const [description, setDescription] = useState<string>('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // При открытии — наполняем поля либо из initial, либо дефолтами.
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setUserId(initial.user_id);
      setAmount(String(initial.amount));
      setDate(initial.occurred_on);
      setDescription(initial.description ?? '');
    } else {
      setUserId(null);
      setAmount('');
      setDate(todayIso());
      setDescription('');
    }
    setPickerOpen(false);
    setConfirmOpen(false);
    setLocalError(null);
  }, [open, initial]);

  const selectedPlayer = useMemo(
    () => (userId ? members.find((m) => m.user_id === userId) ?? null : null),
    [userId, members],
  );

  const submit = () => {
    setLocalError(null);
    if (!userId) {
      setLocalError(t('money.sheet.deposit.errorEmptyPlayer'));
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setLocalError(t('money.sheet.deposit.errorEmptyAmount'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setLocalError(t('money.sheet.deposit.errorBadDate'));
      return;
    }
    onSubmit({
      user_id: userId,
      amount: n,
      occurred_on: date,
      description: description.trim() ? description.trim() : null,
    });
  };

  const handleDelete = () => {
    if (onDelete) onDelete();
    setConfirmOpen(false);
  };

  const label: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: spacing['6'],
  };

  const fieldBlock: CSSProperties = { marginBottom: spacing['12'] };

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

  const errorBox: CSSProperties = {
    fontSize: 13,
    color: colors.error,
    background: colors.errorBg,
    padding: `${spacing['8']}px ${spacing['12']}px`,
    borderRadius: radius.md,
    marginBottom: spacing['12'],
  };

  const finalError = error ?? localError;

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={isEdit ? t('money.sheet.deposit.editTitle') : t('money.sheet.deposit.createTitle')}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Игрок */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.deposit.playerLabel')}</div>
            <button
              type="button"
              className="pressable"
              style={playerSelectBtn}
              onClick={() => setPickerOpen(true)}
            >
              {selectedPlayer ? (
                <>
                  <Avatar
                    src={selectedPlayer.avatar_url ?? selectedPlayer.photo_url}
                    name={formatName(selectedPlayer)}
                    size={32}
                  />
                  <span>{formatName(selectedPlayer)}</span>
                </>
              ) : (
                <span style={placeholderText}>{t('money.sheet.deposit.playerPlaceholder')}</span>
              )}
            </button>
          </div>

          {/* Сумма */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.deposit.amountLabel')}</div>
            <div style={{ position: 'relative' }}>
              <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value.replace(/[^\d]/g, ''))}
                placeholder="0"
                style={{
                  background: colors.bg,
                  border: `1.5px solid ${colors.headerAccent}`,
                  paddingRight: 36,
                  fontSize: 22,
                  fontWeight: 700,
                  color: colors.headerAccent,
                }}
              />
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: spacing['16'],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.headerAccent,
                  fontSize: 18,
                  fontWeight: 600,
                  pointerEvents: 'none',
                }}
              >
                ₽
              </span>
            </div>
          </div>

          {/* Дата */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.deposit.dateLabel')}</div>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.currentTarget.value)}
              max={todayIso()}
            />
          </div>

          {/* Описание */}
          <div style={fieldBlock}>
            <div style={label}>{t('money.sheet.deposit.descriptionLabel')}</div>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              placeholder={t('money.sheet.deposit.descriptionPlaceholder')}
              maxLength={200}
            />
          </div>

          {finalError ? <div style={errorBox}>{finalError}</div> : null}

          <div style={{ display: 'flex', gap: spacing['8'], marginTop: spacing['8'] }}>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              {t('money.sheet.deposit.cancel')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={submit}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? t('money.sheet.deposit.saving') : t('money.sheet.deposit.save')}
            </Button>
          </div>

          {isEdit && onDelete ? (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => setConfirmOpen(true)}
              disabled={isSaving || isDeleting}
              style={{ color: colors.error, marginTop: spacing['8'] }}
            >
              {isDeleting ? t('money.sheet.deposit.deleting') : t('money.sheet.deposit.delete')}
            </Button>
          ) : null}
        </div>
      </BottomSheet>

      <PlayerPicker
        open={pickerOpen}
        title={t('money.sheet.deposit.playerLabel')}
        members={members}
        currentId={userId}
        searchPlaceholder={t('money.sheet.deposit.playerSearch')}
        emptyText={t('money.sheet.deposit.playerEmpty')}
        onPick={(uid) => {
          setUserId(uid);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <BottomSheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('money.sheet.deposit.deleteConfirmTitle')}
      >
        <div style={{ fontSize: 14, color: colors.textSecondary, marginBottom: spacing['16'] }}>
          {t('money.sheet.deposit.deleteConfirmBody')}
        </div>
        <div style={{ display: 'flex', gap: spacing['8'] }}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => setConfirmOpen(false)}
            disabled={isDeleting}
          >
            {t('money.sheet.deposit.cancel')}
          </Button>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting
              ? t('money.sheet.deposit.deleting')
              : t('money.sheet.deposit.deleteConfirmCta')}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Вложенный пикер игрока: вертикальный список членов команды с инлайн-поиском
// по имени/нику. Открывается поверх основного sheet'а.
// ─────────────────────────────────────────────────────────────────────────────

type PickerProps = {
  open: boolean;
  title: string;
  members: TeamMember[];
  currentId: string | null;
  searchPlaceholder: string;
  emptyText: string;
  onPick: (uid: string) => void;
  onClose: () => void;
};

function PlayerPicker({
  open,
  title,
  members,
  currentId,
  searchPlaceholder,
  emptyText,
  onPick,
  onClose,
}: PickerProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = formatName(m).toLowerCase();
      const username = (m.username ?? '').toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [members, query]);

  const row = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing['10'],
    padding: `${spacing['10']}px ${spacing['12']}px`,
    background: active ? colors.primaryLight : 'transparent',
    border: 'none',
    borderRadius: radius.md,
    width: '100%',
    minHeight: 52,
    cursor: 'pointer',
    color: active ? colors.primary : colors.text,
    fontSize: 15,
    fontWeight: active ? 700 : 500,
    textAlign: 'left',
  });

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div style={{ position: 'relative', marginBottom: spacing['8'] }}>
        <IconSearch
          size={18}
          color={colors.textSecondary}
          style={{
            position: 'absolute',
            left: spacing['12'],
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          placeholder={searchPlaceholder}
          style={{ paddingLeft: 38 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '55dvh', overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: spacing['16'], color: colors.textSecondary, fontSize: 14 }}>
            {emptyText}
          </div>
        ) : (
          filtered.map((m) => {
            const active = m.user_id === currentId;
            return (
              <button
                key={m.user_id}
                type="button"
                className="pressable"
                style={row(active)}
                onClick={() => onPick(m.user_id)}
              >
                <Avatar src={m.avatar_url ?? m.photo_url} name={formatName(m)} size={36} />
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatName(m)}
                </span>
                {m.jersey_number != null ? (
                  <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 600 }}>
                    #{m.jersey_number}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </BottomSheet>
  );
}

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
