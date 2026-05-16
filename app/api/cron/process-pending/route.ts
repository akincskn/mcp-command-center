import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { triggerStep } from '@/lib/execution/triggerStep';

const CRON_SECRET = process.env.CRON_SECRET!;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Find PENDING steps in EXECUTING plans (stuck / missed triggers)
  const stuckSteps = await db.step.findMany({
    where: {
      status: 'PENDING',
      plan: { status: 'EXECUTING' },
    },
    select: { id: true, planId: true, order: true },
    take: 20,
  });

  let triggered = 0;
  for (const step of stuckSteps) {
    const previousSteps = await db.step.findMany({
      where: {
        planId: step.planId,
        order: { lt: step.order },
      },
      select: { status: true },
    });

    const allPrevCompleted = previousSteps.every(s => s.status === 'COMPLETED');
    if (allPrevCompleted) {
      void triggerStep(step.id);
      triggered++;
    }
  }

  return NextResponse.json({
    found: stuckSteps.length,
    triggered,
    timestamp: new Date().toISOString(),
  });
}
