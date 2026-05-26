import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plans = await db.plan.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      command: true,
      description: true,
      status: true,
      totalTokens: true,
      totalCostUsd: true,
      actualDuration: true,
      createdAt: true,
      _count: { select: { steps: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    plans: plans.map((p) => ({
      ...p,
      totalCostUsd: p.totalCostUsd.toString(),
      createdAt: p.createdAt.toISOString(),
    })),
  });
}
