'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface UsageSummary {
  summary: {
    totalTokens: number;
    totalCost: number;
    totalCalls: number;
    successRate: number;
  };
  byModel: Record<string, { tokens: number; cost: number; calls: number }>;
  byOperation: Record<string, number>;
  dailyCost: Record<string, number>;
}

function formatCost(n: number) {
  return `$${n.toFixed(4)}`;
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function buildDailyData(dailyCost: Record<string, number>) {
  const result: { date: string; cost: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().substring(0, 10);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ date: label, cost: dailyCost[key] ?? 0 });
  }
  return result;
}

function buildModelData(
  byModel: Record<string, { tokens: number; cost: number; calls: number }>
) {
  return Object.entries(byModel)
    .map(([model, stats]) => ({
      model: model.split('/').pop() ?? model,
      tokens: stats.tokens,
      cost: stats.cost,
      calls: stats.calls,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 6);
}

const dailyChartConfig: ChartConfig = {
  cost: { label: 'Cost', color: 'hsl(var(--chart-1))' },
};

const modelChartConfig: ChartConfig = {
  cost: { label: 'Cost ($)', color: 'hsl(var(--chart-2))' },
};

export function UsageDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading, isError } = useQuery<UsageSummary>({
    queryKey: ['usage-summary'],
    queryFn: () => fetch('/api/usage/summary').then((r) => r.json()),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[260px] rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground">
        Could not load usage data.
      </p>
    );
  }

  const { summary, byModel, byOperation, dailyCost } = data;
  const dailyData = buildDailyData(dailyCost);
  const modelData = buildModelData(byModel);

  const summaryCards = [
    { label: 'Total Cost', value: formatCost(summary.totalCost) },
    { label: 'Total Tokens', value: formatTokens(summary.totalTokens) },
    { label: 'API Calls', value: summary.totalCalls.toLocaleString() },
    {
      label: 'Success Rate',
      value: `${(summary.successRate * 100).toFixed(0)}%`,
    },
  ];

  const hasDailyData = dailyData.some((d) => d.cost > 0);
  const hasModelData = modelData.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily cost trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Daily Cost — Last 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mounted && hasDailyData ? (
            <ChartContainer config={dailyChartConfig} className="min-h-[200px] w-full">
              <AreaChart data={dailyData} margin={{ left: 8, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-cost)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-cost)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                  width={54}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => `$${Number(v).toFixed(4)}`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-cost)"
                  strokeWidth={2}
                  fill="url(#costGradient)"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <EmptyChart label="No usage data yet" />
          )}
        </CardContent>
      </Card>

      {/* Cost by model */}
      {mounted && hasModelData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={modelChartConfig} className="min-h-[200px] w-full">
              <BarChart
                data={modelData}
                layout="vertical"
                margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                />
                <YAxis
                  type="category"
                  dataKey="model"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v, k) =>
                        k === 'cost'
                          ? `$${Number(v).toFixed(4)}`
                          : String(v)
                      }
                    />
                  }
                />
                <Bar
                  dataKey="cost"
                  fill="var(--color-cost)"
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Operations breakdown */}
      {Object.keys(byOperation).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Operations Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(byOperation)
                .sort(([, a], [, b]) => b - a)
                .map(([op, count]) => (
                  <div key={op} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {op}
                    </span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
