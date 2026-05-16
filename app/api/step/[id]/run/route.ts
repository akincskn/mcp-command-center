import { NextResponse } from 'next/server';
import { runStep } from '@/lib/execution/runner';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET!;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const secret = req.headers.get('x-internal-secret');
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: stepId } = await params;

  try {
    await runStep(stepId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[step/run] ${stepId}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
