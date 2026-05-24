'use client';

import * as React from 'react';
import { ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = Record<string, { label: string; color?: string }>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

export function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error('useChart must be inside ChartContainer');
  return ctx;
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactElement;
}

export function ChartContainer({ config, className, children, ...props }: ChartContainerProps) {
  const colorVars = React.useMemo(() => {
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(config)) {
      if (value.color) vars[`--color-${key}`] = value.color;
    }
    return vars;
  }, [config]);

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn('h-[220px] w-full', className)}
        style={colorVars as React.CSSProperties}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 200 }}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

interface TooltipItem {
  dataKey?: string | number;
  name?: string;
  value?: unknown;
  color?: string;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string;
  hideLabel?: boolean;
  formatter?: (value: unknown, key: string) => string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  hideLabel = false,
  formatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-md text-xs min-w-[130px]">
      {!hideLabel && label && (
        <p className="mb-1.5 font-medium text-foreground">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? '');
          const cfg = config[key];
          const color = item.color ?? cfg?.color;
          const displayLabel = cfg?.label ?? item.name ?? key;
          const val = formatter
            ? formatter(item.value, key)
            : String(item.value ?? '');
          return (
            <div key={i} className="flex items-center gap-2">
              {color && (
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: color }}
                />
              )}
              <span className="text-muted-foreground">{displayLabel}</span>
              <span className="ml-auto font-mono font-medium tabular-nums">
                {val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
