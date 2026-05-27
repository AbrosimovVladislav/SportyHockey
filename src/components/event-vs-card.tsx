import type { CSSProperties } from 'react';
import { Avatar } from '@/components/avatar';
import { SectionCard } from '@/components/section-card';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  ourTeamName: string;
  opponentName: string;
  score: { a: number; b: number } | null;
  vsLabel: string;
  onClick: () => void;
};

function TeamColumn({ name }: { name: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing['6'],
      }}
    >
      <Avatar src={null} name={name} size={44} />
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: colors.text,
          textAlign: 'center',
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
        }}
      >
        {name}
      </span>
    </div>
  );
}

export function EventVsCard({ ourTeamName, opponentName, score, vsLabel, onClick }: Props) {
  const bigScore: CSSProperties = {
    fontSize: 28,
    fontWeight: 800,
    color: colors.text,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
    letterSpacing: '-0.5px',
  };

  return (
    <SectionCard padding={spacing['12']}>
      <button
        type="button"
        className="pressable"
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing['8'],
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          color: colors.text,
          textAlign: 'left',
        }}
      >
        <TeamColumn name={ourTeamName || '—'} />
        {score ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing['8'],
              flexShrink: 0,
              padding: `0 ${spacing['8']}px`,
            }}
          >
            <span style={bigScore}>{score.a}</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: colors.textTertiary, lineHeight: 1 }}>
              :
            </span>
            <span style={bigScore}>{score.b}</span>
          </div>
        ) : (
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.textTertiary,
              letterSpacing: '0.05em',
              flexShrink: 0,
            }}
          >
            {vsLabel}
          </span>
        )}
        <TeamColumn name={opponentName || '—'} />
      </button>
    </SectionCard>
  );
}
