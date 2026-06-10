import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { runStep } from '@/lib/execution/runner';

const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
if (!INTERNAL_SECRET) {
  throw new Error('INTERNAL_SECRET not configured');
}

function isAuthorized(req: Request): boolean {
  const secret = req.headers.get('x-internal-secret') ?? '';
  const secretBuffer = Buffer.from(secret);
  const expectedBuffer = Buffer.from(INTERNAL_SECRET as string);
  return (
    secretBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(secretBuffer, expectedBuffer)
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
