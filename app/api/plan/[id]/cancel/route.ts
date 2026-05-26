import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const plan = await db.plan.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  if (plan.status !== 'PENDING_APPROVAL') {
    return NextResponse.json(
      { error: `Cannot cancel plan in status ${plan.status}` },
      { status: 400 }
    );
  }

  await db.plan.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ status: 'CANCELLED' });
}
