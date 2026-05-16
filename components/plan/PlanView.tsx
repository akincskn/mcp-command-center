'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { usePlan, useCancelPlan, useExecutePlan } from './usePlanQueries';
import { PlanStep } from './PlanStep';

interface PlanViewProps {
  planId: string;
  onCleared: () => void;
}

export function PlanView({ planId, onCleared }: PlanViewProps) {
  const { data, isLoading, error } = usePlan(planId);
  const cancelMutation = useCancelPlan();
  const executeMutation = useExecutePlan();

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

  if (error || !data?.plan) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
        Failed to load plan:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const plan = data.plan;
  const isApproval = plan.status === 'PENDING_APPROVAL';

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
      toast.success('Execution started', {
        description: 'Live status updates coming in Phase 9. For now, refresh to see progress.',
      });
    } catch (err) {
      toast.error('Failed to start execution', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  return (
    <motion.div
      key={planId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Plan header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-[10px]">
            {plan.status.replace('_', ' ')}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span className="font-mono">{plan.steps.length} steps</span>
          </div>
          {plan.estimatedDuration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-mono">~{plan.estimatedDuration}s</span>
            </div>
          )}
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
      <div className="space-y-2">
        {plan.steps.map((step, i) => (
          <PlanStep key={step.id} step={step} index={i} />
        ))}
      </div>

      {/* Actions */}
      {isApproval && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: plan.steps.length * 0.05 + 0.1 }}
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

      {plan.status === 'CANCELLED' && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          This plan was cancelled. Create a new command to continue.
        </div>
      )}
    </motion.div>
  );
}
