import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { triggerStep } from '@/lib/execution/triggerStep';

const CRON_SECRET = process.env.CRON_SECRET;
if (!CRON_SECRET) {
  throw new Error('CRON_SECRET not configured');
}

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${CRON_SECRET}`;
  const headerBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);
  return (
    headerBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(headerBuffer, expectedBuffer)
  );
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      triggerStep(step.id);
      triggered++;
    }
  }

  return NextResponse.json({
    found: stuckSteps.length,
    triggered,
    timestamp: new Date().toISOString(),
  });
}
