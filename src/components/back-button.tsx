'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassButton } from './glass-button';
import { IconBack } from './icons';
import { colors } from '@/theme/colors';

type Props = {
  ariaLabel: string;
};

export function BackButton({ ariaLabel }: Props) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(typeof window !== 'undefined' && window.history.length > 1);
  }, []);

  if (!canGoBack) return null;

  return (
    <GlassButton ariaLabel={ariaLabel} onClick={() => router.back()}>
      <IconBack size={22} color={colors.textInverse} />
    </GlassButton>
  );
}
