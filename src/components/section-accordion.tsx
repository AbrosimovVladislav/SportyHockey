'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { IconChevronDown } from './icons';

type Props = {
  title: string;
  count?: number;
  defaultExpanded?: boolean;
  children: ReactNode;
  ariaLabelExpand?: string;
  ariaLabelCollapse?: string;
};

export function SectionAccordion({
  title,
  count,
  defaultExpanded = false,
  children,
  ariaLabelExpand,
  ariaLabelCollapse,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const header: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing['20']}px ${spacing['20']}px ${spacing['12']}px`,
    background: 'transparent',
    border: 'none',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'inherit',
  };

  const titleStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: colors.text,
  };

  const countStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textTertiary,
    fontVariantNumeric: 'tabular-nums',
    marginLeft: spacing['8'],
  };

  const chevron: CSSProperties = {
    transform: expanded ? 'rotate(180deg)' : undefined,
    transition: 'transform 150ms ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing['8'],
  };

  return (
    <>
      <button
        type="button"
        style={header}
        aria-expanded={expanded}
        aria-label={expanded ? ariaLabelCollapse : ariaLabelExpand}
        className="pressable"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>
          <span style={titleStyle}>{title}</span>
          {count != null ? <span style={countStyle}>{count}</span> : null}
        </span>
        <span style={chevron}>
          <IconChevronDown size={14} color={colors.textTertiary} />
        </span>
      </button>
      {expanded ? children : null}
    </>
  );
}
