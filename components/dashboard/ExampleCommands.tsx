'use client';

import { motion } from 'framer-motion';
import { easeOut } from '@/lib/motion';
import { GitBranch, Search, Brain, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SCENARIOS = [
  {
    id: 'A',
    title: 'Developer Workflow',
    icon: GitBranch,
    command:
      'List recent issues from akincskn/mcp-command-center, search for similar projects on web, compare findings',
    tools: ['GitHub', 'Tavily', 'Memory'],
  },
  {
    id: 'B',
    title: 'Research Workflow',
    icon: Search,
    command:
      'Find 5 articles about MCP protocol, extract key insights, save to knowledge base',
    tools: ['Tavily', 'Memory'],
  },
  {
    id: 'C',
    title: 'Knowledge Workflow',
    icon: Brain,
    command:
      'Recall previous comparison about mcp-command-center, diff with current GitHub state',
    tools: ['Memory', 'GitHub'],
  },
] as const;

const TOOL_COLORS: Record<string, string> = {
  GitHub: 'bg-primary/10 text-primary border-primary/20',
  Tavily: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Memory: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

interface ExampleCommandsProps {
  onCommandSelect: (command: string) => void;
}

export function ExampleCommands({ onCommandSelect }: ExampleCommandsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Example Commands
      </h2>
      <div className="grid gap-3">
        {SCENARIOS.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeOut, delay: Math.min(i * 0.07, 0.2) }}
            onClick={() => onCommandSelect(s.command)}
            className="group w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
                <s.icon className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-sm font-medium">
                  Scenario {s.id} — {s.title}
                </p>
                <p className="text-xs text-muted-foreground italic line-clamp-1">
                  {s.command}
                </p>
                <div className="flex flex-wrap gap-1">
                  {s.tools.map((tool) => (
                    <Badge
                      key={tool}
                      variant="outline"
                      className={`text-[10px] font-medium ${TOOL_COLORS[tool] ?? ''}`}
                    >
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
