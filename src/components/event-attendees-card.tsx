import { AvatarStack } from '@/components/avatar-stack';
import { ProgressBar } from '@/components/progress-bar';
import { IconChevronRight, IconRuble } from '@/components/icons';
import { interp, formatRub } from '@/lib/format';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

type Fund = { target: number; got: number; mode: 'collected' | 'target' };

type Props = {
  isOrganizer: boolean;
  isCompleted: boolean;
  going: number;
  total: number;
  noAnswer: number;
  showedCount: number;
  avatarItems: { src: string | null; name: string }[];
  fund: Fund | null;
  labels: {
    titleOrganizer: string;
    titlePlayer: string;
    summary: string;
    summaryCompleted: string;
    collected: string;
    target: string;
  };
  onClick: () => void;
};

export function EventAttendeesCard({
  isOrganizer,
  isCompleted,
  going,
  total,
  noAnswer,
  showedCount,
  avatarItems,
  fund,
  labels,
  onClick,
}: Props) {
  const summary = isCompleted
    ? interp(labels.summaryCompleted, { showed: showedCount, total })
    : interp(labels.summary, { going, total, noAnswer: Math.max(0, noAnswer) });

  return (
    <button
      type="button"
      className="pressable"
      onClick={onClick}
      style={{
        background: colors.bg,
        borderRadius: radius.lg,
        padding: spacing['16'],
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.03)',
        border: 'none',
        width: '100%',
        textAlign: 'left',
        color: colors.text,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing['8'],
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: colors.text }}>
          {isOrganizer ? labels.titleOrganizer : labels.titlePlayer}
        </span>
        <IconChevronRight />
      </div>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: spacing['12'] }}>
        {summary}
      </div>
      {avatarItems.length > 0 ? (
        <div style={{ marginBottom: isOrganizer && fund ? spacing['12'] : 0 }}>
          <AvatarStack items={avatarItems} />
        </div>
      ) : null}
      {isOrganizer && fund ? (
        <>
          <div style={{ marginBottom: spacing['10'] }}>
            <ProgressBar value={fund.got} total={fund.target} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing['8'] }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: colors.primaryLight,
                color: colors.primary,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconRuble size={16} color={colors.primary} />
            </span>
            <span style={{ fontSize: 14, color: colors.text }}>
              {interp(fund.mode === 'collected' ? labels.collected : labels.target, {
                got: formatRub(fund.got),
                target: formatRub(fund.target),
              })}
            </span>
          </div>
        </>
      ) : null}
    </button>
  );
}
