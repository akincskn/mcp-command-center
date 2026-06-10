import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { runPlanSequential } from '@/lib/execution/runner';

export const maxDuration = 60; // Hobby plan max; inline sequential run fits well within this

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: planId } = await params;

  const plan = await db.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    include: { steps: { orderBy: { order: 'asc' } } },
  });

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  if (plan.status !== 'PENDING_APPROVAL') {
    return NextResponse.json(
      { error: `Cannot execute plan in status ${plan.status}` },
      { status: 400 }
    );
  }

  await db.plan.update({
    where: { id: planId },
    data: {
      status: 'EXECUTING',
      startedAt: new Date(),
    },
  });

  const firstStep = plan.steps[0];
  if (firstStep) {
    // Run the whole plan sequentially in this function's background lifetime.
    // No self-fetch chain — avoids Vercel 508 INFINITE_LOOP at step depth 5+.
    waitUntil(runPlanSequential(planId));
  } else {
    await db.plan.update({
      where: { id: planId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ status: 'EXECUTING', planId });
}
