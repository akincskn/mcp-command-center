import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const logs = await db.usageLog.findMany({
    where: { userId },
    select: {
      provider: true,
      model: true,
      operation: true,
      inputTokens: true,
      outputTokens: true,
      costUsd: true,
      createdAt: true,
      success: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalTokens = logs.reduce(
    (s, l) => s + l.inputTokens + l.outputTokens,
    0
  );
  const totalCost = logs.reduce((s, l) => s + Number(l.costUsd), 0);
  const totalCalls = logs.length;
  const successRate =
    logs.length > 0
      ? logs.filter((l) => l.success).length / logs.length
      : 0;

  const byModel: Record<string, { tokens: number; cost: number; calls: number }> =
    {};
  for (const l of logs) {
    const modelKey = l.model ?? 'unknown';
    const existing = byModel[modelKey];
    if (!existing) {
      byModel[modelKey] = {
        tokens: l.inputTokens + l.outputTokens,
        cost: Number(l.costUsd),
        calls: 1,
      };
    } else {
      existing.tokens += l.inputTokens + l.outputTokens;
      existing.cost += Number(l.costUsd);
      existing.calls += 1;
    }
  }


  const byOperation: Record<string, number> = {};
  for (const l of logs) {
    byOperation[l.operation] = (byOperation[l.operation] ?? 0) + 1;
  }

  const dailyCost: Record<string, number> = {};
  for (const l of logs) {
    const day = l.createdAt.toISOString().substring(0, 10);
    dailyCost[day] = (dailyCost[day] ?? 0) + Number(l.costUsd);
  }

  return NextResponse.json({
    summary: { totalTokens, totalCost, totalCalls, successRate },
    byModel,
    byOperation,
    dailyCost,
  });
}
