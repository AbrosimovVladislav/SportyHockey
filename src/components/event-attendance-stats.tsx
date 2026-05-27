import type { CSSProperties } from 'react';
import { SectionCard } from '@/components/section-card';
import { IconCheck, IconClose, IconInfo } from '@/components/icons';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

function StatusCircle({ kind, count }: { kind: 'going' | 'notGoing' | 'noAnswer'; count: number }) {
  const meta = {
    going: { bg: colors.success, fg: colors.textInverse, Icon: IconCheck },
    notGoing: { bg: colors.error, fg: colors.textInverse, Icon: IconClose },
    noAnswer: { bg: colors.textTertiary, fg: colors.textInverse, Icon: IconClose },
  } as const;
  const { bg, fg, Icon } = meta[kind];

  const circle: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: bg,
    color: fg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing['6'] }}>
      <span style={circle}>
        {kind === 'noAnswer' ? (
          <span style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>−</span>
        ) : (
          <Icon size={13} color={fg} />
        )}
      </span>
      <span style={{ fontSize: 20, fontWeight: 700, color: colors.text, fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </span>
    </div>
  );
}

type Props = {
  going: number;
  notGoing: number;
  noAnswer: number;
  title: string;
  labels: { going: string; notGoing: string; noAnswer: string };
};

export function EventAttendanceStats({ going, notGoing, noAnswer, title, labels }: Props) {
  const labelStyle: CSSProperties = {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 28,
  };

  return (
    <SectionCard padding={spacing['12']}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing['10'],
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{title}</span>
        <IconInfo size={16} color={colors.textTertiary} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing['12'] }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <StatusCircle kind="going" count={going} />
          <span style={labelStyle}>{labels.going}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <StatusCircle kind="notGoing" count={notGoing} />
          <span style={labelStyle}>{labels.notGoing}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <StatusCircle kind="noAnswer" count={Math.max(0, noAnswer)} />
          <span style={labelStyle}>{labels.noAnswer}</span>
        </div>
      </div>
    </SectionCard>
  );
}
