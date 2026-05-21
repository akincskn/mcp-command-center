'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface ActivePlanContextValue {
  activePlanId: string | null;
  setActivePlanId: (id: string | null) => void;
}

const ActivePlanContext = createContext<ActivePlanContextValue | null>(null);

export function ActivePlanProvider({ children }: { children: ReactNode }) {
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  return (
    <ActivePlanContext.Provider value={{ activePlanId, setActivePlanId }}>
      {children}
    </ActivePlanContext.Provider>
  );
}

export function useActivePlan() {
  const ctx = useContext(ActivePlanContext);
  if (!ctx) throw new Error('useActivePlan must be inside ActivePlanProvider');
  return ctx;
}
