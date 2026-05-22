'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ActiveTeamState = {
  activeTeamId: string | null;
  setActiveTeamId: (id: string | null) => void;
};

export const useActiveTeamStore = create<ActiveTeamState>()(
  persist(
    (set) => ({
      activeTeamId: null,
      setActiveTeamId: (id) => set({ activeTeamId: id }),
    }),
    {
      name: 'sh:active-team',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function getActiveTeamIdSnapshot(): string | null {
  if (typeof window === 'undefined') return null;
  return useActiveTeamStore.getState().activeTeamId;
}
