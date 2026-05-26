'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { PlanStep } from './usePlanQueries';

type StreamUpdate = {
  plan?: {
    status: string;
    totalTokens: number;
    totalCostUsd: string;
    actualDuration: number | null;
    errorMessage: string | null;
  };
  steps?: Partial<PlanStep>[];
  done?: boolean;
  status?: string;
};

export function useExecutionStream(planId: string | null, enabled: boolean) {
  const qc = useQueryClient();
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!planId || !enabled) return;

    const source = new EventSource(`/api/plan/${planId}/status`);
    sourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data as string) as StreamUpdate;

        // Optimistically update TanStack Query cache
        qc.setQueryData(['plan', planId], (old: { plan: { steps: PlanStep[]; [key: string]: unknown } } | undefined) => {
          if (!old?.plan) return old;

          const newPlan = { ...old.plan };

          if (update.plan) {
            Object.assign(newPlan, update.plan);
          }

          if (update.steps && update.steps.length > 0) {
            newPlan.steps = newPlan.steps.map((s: PlanStep) => {
              const updated = update.steps!.find((u) => u.id === s.id);
              return updated ? { ...s, ...updated } : s;
            });
          }

          return { plan: newPlan };
        });

        if (update.done) {
          source.close();
          // Refetch to get full terminal state
          qc.invalidateQueries({ queryKey: ['plan', planId] });
        }
      } catch (err) {
        console.error('[useExecutionStream] Parse error:', err);
      }
    };

    source.onerror = () => {
      // EventSource auto-reconnects on error — let browser handle it
      console.error('[useExecutionStream] Connection error');
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [planId, enabled, qc]);
}
