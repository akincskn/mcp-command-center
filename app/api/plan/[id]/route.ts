import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const plan = await db.plan.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      steps: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }

  return NextResponse.json({ plan });
}
