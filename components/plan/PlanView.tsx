'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { springSoft, easeOut, easeOutFast } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Hash, Zap, List, GitFork } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePlan, useCancelPlan, useExecutePlan } from './usePlanQueries';
import { PlanStep } from './PlanStep';
import { useExecutionStream } from './useExecutionStream';
import { PlanGraph } from './graph/PlanGraph';

interface PlanViewProps {
  planId: string;
  onCleared: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  EXECUTING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse',
  COMPLETED: 'bg-emerald-600 text-white border-emerald-700',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
  CANCELLED: 'bg-muted/50 text-muted-foreground border-border',
};

export function PlanView({ planId, onCleared }: PlanViewProps) {
  const { data, isLoading, error } = usePlan(planId);
  const cancelMutation = useCancelPlan();
  const executeMutation = useExecutePlan();
  const [elapsed, setElapsed] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const prevStatusRef = useRef<string | undefined>(undefined);

  const plan = data?.plan;
  const isExecuting = plan?.status === 'EXECUTING';
  const isApproval = plan?.status === 'PENDING_APPROVAL';
  const isCompleted = plan?.status === 'COMPLETED';
  const isFailed = plan?.status === 'FAILED';

  // SSE stream — open only while executing
  useExecutionStream(planId, isExecuting ?? false);

  // Elapsed timer while executing
  useEffect(() => {
    if (!isExecuting || !plan?.startedAt) return;
    const startTime = new Date(plan.startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [isExecuting, plan?.startedAt]);

  // Toast on terminal status transition
  useEffect(() => {
    if (!plan) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = plan.status;

    if (prev === undefined || prev === plan.status) return;

    if (plan.status === 'COMPLETED') {
      toast.success('Plan completed', {
        description:
          plan.totalTokens > 0
            ? `${plan.totalTokens} tokens · $${parseFloat(plan.totalCostUsd).toFixed(4)}`
            : undefined,
      });
    } else if (plan.status === 'FAILED') {
      toast.error('Execution failed', {
        description: plan.errorMessage ?? 'An error occurred during execution',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.status]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
        Failed to load plan:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(planId);
      toast.success('Plan cancelled');
      onCleared();
    } catch {
      toast.error('Failed to cancel plan');
    }
  };

  const handleExecute = async () => {
    try {
      await executeMutation.mutateAsync(planId);
      toast.success('Execution started');
    } catch (err) {
      toast.error('Failed to start execution', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  const showTokens = plan.totalTokens > 0;

  return (
    <motion.div
      key={planId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={springSoft}
      className="space-y-6"
    >
      {/* Plan header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={plan.status}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={easeOutFast}
            >
              <Badge
                variant="outline"
                className={cn(
                  'font-mono text-[10px] border',
                  STATUS_BADGE[plan.status] ?? 'bg-muted text-muted-foreground'
                )}
              >
                {plan.status.replace('_', ' ')}
              </Badge>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="font-mono">{plan.steps.length} steps</span>
          </div>

          {/* Estimated duration — only pre-execution */}
          {plan.estimatedDuration && !isExecuting && !isCompleted && !isFailed && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono">~{plan.estimatedDuration}s</span>
            </div>
          )}

          {/* Live elapsed timer */}
          {isExecuting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1 text-xs text-emerald-400"
            >
              <Clock className="h-3 w-3" />
              <span className="font-mono tabular-nums">{elapsed}s</span>
            </motion.div>
          )}

          {/* Actual duration post-completion */}
          {isCompleted && plan.actualDuration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono">{(plan.actualDuration / 1000).toFixed(1)}s</span>
            </div>
          )}

          {/* Live token counter */}
          {showTokens && (
            <motion.div
              layout
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Zap className="h-3 w-3" />
              <span className="font-mono tabular-nums">
                {plan.totalTokens} tok · ${parseFloat(plan.totalCostUsd).toFixed(4)}
              </span>
            </motion.div>
          )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                viewMode === 'list'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-3 w-3" />
              List
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                viewMode === 'graph'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <GitFork className="h-3 w-3" />
              Graph
            </button>
          </div>
        </div>

        {plan.description && (
          <h3 className="text-lg font-medium leading-snug text-foreground">
            {plan.description}
          </h3>
        )}

        <p className="text-xs text-muted-foreground italic">
          &ldquo;{plan.command}&rdquo;
        </p>
      </div>

      {/* Steps */}
      {viewMode === 'list' ? (
        <div className="space-y-2">
          {plan.steps.map((step, i) => (
            <PlanStep key={step.id} step={step} index={i} />
          ))}
        </div>
      ) : (
        <PlanGraph steps={plan.steps} />
      )}

      {/* Actions */}
      <AnimatePresence mode="wait">
        {isApproval && (
          <motion.div
            key="approval-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ...easeOut, delay: Math.min(plan.steps.length * 0.05, 0.2) + 0.1 }}
            className="flex items-center gap-3 pt-2"
          >
            <Button
              onClick={handleExecute}
              size="default"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={executeMutation.isPending}
            >
              {executeMutation.isPending ? 'Starting...' : 'Execute Plan'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="default"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
            </Button>
          </motion.div>
        )}

        {isExecuting && (
          <motion.div
            key="executing-actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 pt-2"
          >
            <Button
              onClick={handleCancel}
              variant="outline"
              size="default"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Execution'}
            </Button>
          </motion.div>
        )}

        {isCompleted && (
          <motion.div
            key="completed-actions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 pt-2"
          >
            <Button
              onClick={onCleared}
              size="default"
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              New Command
            </Button>
          </motion.div>
        )}

        {isFailed && (
          <motion.div
            key="failed-actions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 pt-2"
          >
            <Button onClick={onCleared} variant="outline" size="default">
              New Command
            </Button>
          </motion.div>
        )}

        {plan.status === 'CANCELLED' && (
          <motion.div
            key="cancelled-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground"
          >
            This plan was cancelled. Create a new command to continue.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
