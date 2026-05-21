'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { CommandInput } from '@/components/plan/CommandInput';
import { PlanView } from '@/components/plan/PlanView';
import { ExampleCommands } from '@/components/dashboard/ExampleCommands';

const CONNECTED_SERVERS = [
  { label: 'GitHub', color: 'bg-primary/10 text-primary border-primary/20' },
  {
    label: 'Tavily',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  {
    label: 'Memory',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
];

interface DashboardContentProps {
  firstName: string;
}

export function DashboardContent({ firstName }: DashboardContentProps) {
  const [command, setCommand] = useState('');
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const cmd = searchParams.get('cmd');
    if (cmd) {
      setCommand(decodeURIComponent(cmd));
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlanCreated = (planId: string) => {
    setActivePlanId(planId);
  };

  const handleCleared = () => {
    setActivePlanId(null);
  };

  const handleCommandSelect = (selectedCommand: string) => {
    setCommand(selectedCommand);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground">
          Orchestrate AI tools with a single command.
        </p>
      </div>

      {/* Command input */}
      <CommandInput
        command={command}
        onCommandChange={setCommand}
        onPlanCreated={handlePlanCreated}
      />

      {/* Plan view or example commands */}
      <AnimatePresence mode="wait">
        {activePlanId ? (
          <PlanView
            key={activePlanId}
            planId={activePlanId}
            onCleared={handleCleared}
          />
        ) : (
          <ExampleCommands
            key="examples"
            onCommandSelect={handleCommandSelect}
          />
        )}
      </AnimatePresence>

      {/* Connected servers */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Connected Servers
        </h2>
        <div className="flex flex-wrap gap-2">
          {CONNECTED_SERVERS.map((s) => (
            <span
              key={s.label}
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${s.color}`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
