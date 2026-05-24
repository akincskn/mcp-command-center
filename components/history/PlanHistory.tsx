'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Ban,
  Terminal,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface HistoryPlan {
  id: string;
  command: string;
  description: string | null;
  status: string;
  totalTokens: number;
  totalCostUsd: string;
  actualDuration: number | null;
  createdAt: string;
  _count: { steps: number };
}

interface PlanHistoryResponse {
  plans: HistoryPlan[];
}

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  FAILED: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  EXECUTING: {
    label: 'Running',
    icon: Loader2,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  PENDING_APPROVAL: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: Ban,
    className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatCost(costStr: string) {
  const n = parseFloat(costStr);
  if (n === 0) return '$0';
  return `$${n.toFixed(4)}`;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return null;
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function PlanHistory() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery<PlanHistoryResponse>({
    queryKey: ['plan-history'],
    queryFn: () => fetch('/api/plan/history').then((r) => r.json()),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load plan history.
      </p>
    );
  }

  const plans = data?.plans ?? [];

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Terminal className="h-10 w-10 text-muted-foreground/30" />
        <div className="space-y-1">
          <p className="text-sm font-medium">No plans yet</p>
          <p className="text-sm text-muted-foreground">
            Type a command on the{' '}
            <a href="/dashboard" className="text-primary underline underline-offset-2 hover:no-underline">
              dashboard
            </a>{' '}
            to create your first plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {plans.map((plan) => {
        const cfg =
          statusConfig[plan.status] ?? statusConfig['PENDING_APPROVAL']!;
        const Icon = cfg.icon;
        const duration = formatDuration(plan.actualDuration);

        return (
          <button
            key={plan.id}
            onClick={() => router.push(`/dashboard?planId=${plan.id}`)}
            className={cn(
              'w-full rounded-lg border bg-card px-4 py-3 text-left transition-colors',
              'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {plan.command}
                </p>
                {plan.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {plan.description}
                  </p>
                )}
              </div>
              <Badge
                className={cn(
                  'shrink-0 gap-1 border text-xs',
                  cfg.className
                )}
                variant="outline"
              >
                <Icon
                  className={cn(
                    'h-3 w-3',
                    plan.status === 'EXECUTING' && 'animate-spin'
                  )}
                />
                {cfg.label}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{plan._count.steps} steps</span>
              <span>·</span>
              <span>{formatCost(plan.totalCostUsd)}</span>
              {duration && (
                <>
                  <span>·</span>
                  <span>{duration}</span>
                </>
              )}
              <span className="ml-auto">{formatDate(plan.createdAt)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
