'use client';

import { useActivePlan } from '@/lib/activePlanContext';
import { usePlan } from '@/components/plan/usePlanQueries';

export function CostBadge() {
  const { activePlanId } = useActivePlan();
  const { data } = usePlan(activePlanId);
  const plan = data?.plan;

  if (!plan || plan.totalTokens === 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-xs text-muted-foreground/40">
        —
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
      ${parseFloat(plan.totalCostUsd).toFixed(4)} · {plan.totalTokens} tok
    </span>
  );
}
