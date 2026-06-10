import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { waitUntil } from '@vercel/functions';
import { db } from '@/lib/db';
import { runPlanSequential } from '@/lib/execution/runner';

export const maxDuration = 60;

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

  // Find EXECUTING plans that still have PENDING steps (stuck / missed runs)
  const stuckSteps = await db.step.findMany({
    where: {
      status: 'PENDING',
      plan: { status: 'EXECUTING' },
    },
    select: { planId: true },
    take: 20,
  });

  // Resume each affected plan once, inline (runPlanSequential picks up from the
  // first PENDING step in order — no per-step self-trigger needed).
  const planIds = Array.from(new Set(stuckSteps.map((s) => s.planId)));
  for (const planId of planIds) {
    waitUntil(runPlanSequential(planId));
  }

  return NextResponse.json({
    found: stuckSteps.length,
    triggered: planIds.length,
    timestamp: new Date().toISOString(),
  });
}
