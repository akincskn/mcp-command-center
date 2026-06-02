'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { spring, easeOutFast } from '@/lib/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  GitBranch,
  Search,
  Database,
  Sparkles,
  Zap,
  Brain,
  Gauge,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useRetryStep } from './usePlanQueries';
import { StepOutput } from './StepOutput';
import type { PlanStep as PlanStepType } from './usePlanQueries';

const TOOL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  'github.list_issues': GitBranch,
  'github.get_repo': GitBranch,
  'github.search_code': GitBranch,
  'github.get_file_content': GitBranch,
  'tavily.web_search': Search,
  'tavily.web_fetch': Search,
  'memory.recall': Database,
  'memory.store': Database,
  'memory.list': Database,
};

const AGENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  speed: Zap,
  balanced: Gauge,
  quality: Brain,
};

const BORDER_CLASS: Record<string, string> = {
  PENDING: 'border-border',
  RUNNING: 'border-emerald-500/40 shadow-emerald-500/10 shadow-md',
  COMPLETED: 'border-emerald-500/20',
  FAILED: 'border-red-500/40',
  SKIPPED: 'border-border/50',
};

const BADGE_CLASS: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  RUNNING: 'bg-emerald-500/20 text-emerald-400 animate-pulse',
  COMPLETED: 'bg-emerald-500 text-white',
  FAILED: 'bg-red-500 text-white',
  SKIPPED: 'bg-muted/50 text-muted-foreground/50',
};

interface PlanStepProps {
  step: PlanStepType;
  index: number;
}

export function PlanStep({ step, index }: PlanStepProps) {
  const [errorExpanded, setErrorExpanded] = useState(false);
  const [outputExpanded, setOutputExpanded] = useState(false);
  const retryMutation = useRetryStep(step.planId);

  const ToolIcon =
    step.type === 'TOOL_CALL' && step.toolName
      ? (TOOL_ICON[step.toolName] ?? Sparkles)
      : step.type === 'LLM_STEP' && step.agentTier
        ? (AGENT_ICON[step.agentTier] ?? Sparkles)
        : Sparkles;

  const totalTokens = step.inputTokens + step.outputTokens;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: Math.min(index * 0.05, 0.2) }}
      className={cn(
        'rounded-lg border bg-card/50 p-4 transition-all duration-300',
        BORDER_CLASS[step.status] ?? 'border-border'
      )}
    >
      <div className="flex gap-4">
        {/* Left column: order badge + icon */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md text-xs font-mono transition-all duration-300',
              BADGE_CLASS[step.status] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {String(step.order).padStart(2, '0')}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
            <AnimatePresence mode="wait">
              {step.status === 'RUNNING' ? (
                <motion.div
                  key="running"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={easeOutFast}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                </motion.div>
              ) : step.status === 'COMPLETED' ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={easeOutFast}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </motion.div>
              ) : step.status === 'FAILED' ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={easeOutFast}
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={easeOutFast}
                >
                  <ToolIcon className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right column: content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-medium leading-snug">{step.title}</h4>
            <div className="flex items-center gap-2 shrink-0">
              {totalTokens > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground/60">
                  {totalTokens} tok
                </span>
              )}
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {step.type === 'TOOL_CALL' ? 'Tool' : (step.agentTier ?? 'LLM')}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          {step.toolName && (
            <code className="inline-block text-[10px] font-mono text-muted-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded">
              {step.toolName}
            </code>
          )}

          {/* Error message */}
          {step.status === 'FAILED' && step.errorMessage && (
            <div className="space-y-1">
              <p
                className={cn(
                  'text-xs text-red-400 bg-red-500/10 rounded p-2 break-words',
                  !errorExpanded && 'line-clamp-2'
                )}
              >
                {step.errorMessage}
              </p>
              {step.errorMessage.length > 120 && (
                <button
                  onClick={() => setErrorExpanded((v) => !v)}
                  className="flex min-h-[44px] items-center text-[10px] text-muted-foreground/60 hover:text-muted-foreground underline"
                >
                  {errorExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}

          {/* Retry button */}
          {step.status === 'FAILED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => retryMutation.mutate(step.id)}
              disabled={retryMutation.isPending}
              className="h-11 min-w-[44px] text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {retryMutation.isPending ? 'Retrying...' : 'Retry from here'}
            </Button>
          )}

          {/* Output expand */}
          {step.status === 'COMPLETED' && !!step.output && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <button
                onClick={() => setOutputExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
              >
                {outputExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {outputExpanded ? 'Hide output' : 'View output'}
              </button>

              {outputExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.15 }}
                  className="mt-2 overflow-hidden"
                >
                  <StepOutput step={step} />
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
