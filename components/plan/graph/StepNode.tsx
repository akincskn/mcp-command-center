'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { spring } from '@/lib/motion';
import {
  GitBranch,
  Search,
  Database,
  Brain,
  Zap,
  Gauge,
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

type StepNodeData = {
  order: number;
  title: string;
  type: string;
  toolName: string | null;
  agentTier: string | null;
  status: string;
  inputTokens: number;
  outputTokens: number;
  errorMessage: string | null;
};

const STATUS_CONFIG: Record<
  string,
  {
    border: string;
    bg: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }
> = {
  PENDING: {
    border: 'border-border',
    bg: 'bg-card/50',
    icon: Circle,
    iconColor: 'text-muted-foreground',
  },
  RUNNING: {
    border: 'border-emerald-500/60',
    bg: 'bg-emerald-500/5',
    icon: Loader2,
    iconColor: 'text-emerald-400',
  },
  COMPLETED: {
    border: 'border-emerald-500/30',
    bg: 'bg-card/80',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  },
  FAILED: {
    border: 'border-red-500/50',
    bg: 'bg-red-500/5',
    icon: XCircle,
    iconColor: 'text-red-400',
  },
};

export function StepNode({ data }: NodeProps & { data: StepNodeData }) {
  const config = STATUS_CONFIG[data.status] ?? STATUS_CONFIG['PENDING']!;
  const StatusIcon = config.icon;
  const isRunning = data.status === 'RUNNING';

  const TypeIcon =
    data.type === 'TOOL_CALL' && data.toolName
      ? (TOOL_ICON[data.toolName] ?? Circle)
      : data.type === 'LLM_STEP' && data.agentTier
        ? (AGENT_ICON[data.agentTier] ?? Circle)
        : Circle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      className={cn(
        'w-64 rounded-lg border-2 p-3 transition-colors duration-300',
        config.border,
        config.bg,
        isRunning && 'shadow-lg shadow-emerald-500/20'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground/40 !w-2 !h-2"
      />

      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">
            {String(data.order).padStart(2, '0')}
          </span>
          <StatusIcon
            className={cn('h-4 w-4', config.iconColor, isRunning && 'animate-spin')}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TypeIcon className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-mono uppercase text-muted-foreground truncate">
              {data.type === 'TOOL_CALL' ? data.toolName : data.agentTier}
            </span>
          </div>
          <p className="text-xs font-medium leading-snug line-clamp-2">{data.title}</p>

          {data.status === 'COMPLETED' && (data.inputTokens > 0 || data.outputTokens > 0) && (
            <p className="text-[10px] font-mono text-muted-foreground/60 mt-1">
              {data.inputTokens + data.outputTokens} tok
            </p>
          )}

          {data.status === 'FAILED' && data.errorMessage && (
            <p className="text-[10px] text-red-400/80 mt-1 line-clamp-2">
              {data.errorMessage}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground/40 !w-2 !h-2"
      />
    </motion.div>
  );
}
