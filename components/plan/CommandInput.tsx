'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCreatePlan } from './usePlanQueries';
import { motion } from 'framer-motion';

interface CommandInputProps {
  command: string;
  onCommandChange: (value: string) => void;
  onPlanCreated: (planId: string) => void;
}

export function CommandInput({
  command,
  onCommandChange,
  onPlanCreated,
}: CommandInputProps) {
  const createPlan = useCreatePlan();

  const handleSubmit = async () => {
    if (command.trim().length < 3) {
      toast.error('Command too short');
      return;
    }

    try {
      const result = await createPlan.mutateAsync({ command: command.trim() });
      onPlanCreated(result.planId);
      onCommandChange('');
    } catch (error) {
      toast.error('Plan generation failed', {
        description:
          error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !createPlan.isPending) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-1.5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <Input
          value={command}
          onChange={(e) => onCommandChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to do today?"
          disabled={createPlan.isPending}
          className="h-14 pr-44 text-base bg-card/60 border-border/60 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20"
        />
        <Button
          onClick={handleSubmit}
          disabled={command.trim().length < 3 || createPlan.isPending}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 bg-emerald-500 hover:bg-emerald-600 text-white"
          size="sm"
        >
          {createPlan.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Planning
            </>
          ) : (
            <>
              Generate Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
        Press{' '}
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
        {' '}for quick commands
      </p>
    </div>
  );
}
