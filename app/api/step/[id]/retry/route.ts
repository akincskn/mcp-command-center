import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { runPlanSequential } from '@/lib/execution/runner';

export const maxDuration = 60; // matches execute route; retry replays remaining steps inline

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: stepId } = await params;

  const step = await db.step.findFirst({
    where: {
      id: stepId,
      plan: { userId: session.user.id },
    },
  });

  if (!step) {
    return NextResponse.json({ error: 'Step not found' }, { status: 404 });
  }

  if (step.status !== 'FAILED') {
    return NextResponse.json(
      { error: 'Only FAILED steps can be retried' },
      { status: 400 }
    );
  }

  // Reset failed step and all subsequent steps to PENDING
  await db.$transaction([
    db.step.updateMany({
      where: {
        planId: step.planId,
        order: { gte: step.order },
      },
      data: {
        status: 'PENDING',
        startedAt: null,
        completedAt: null,
        duration: null,
        errorMessage: null,
      },
    }),
    db.step.update({
      where: { id: stepId },
      data: { retryCount: { increment: 1 } },
    }),
    db.plan.update({
      where: { id: step.planId },
      data: {
        status: 'EXECUTING',
        failedAt: null,
        errorMessage: null,
      },
    }),
  ]);

  // Replay this step and all subsequent PENDING steps inline (no self-fetch chain).
  waitUntil(runPlanSequential(step.planId));

  return NextResponse.json({ status: 'EXECUTING' });
}
