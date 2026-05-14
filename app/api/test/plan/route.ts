import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generatePlan } from '@/lib/ai/planGenerator';
import { logUsage } from '@/lib/usage';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json() as { command?: string };
  const command = body.command;

  if (!command || typeof command !== 'string') {
    return NextResponse.json({ error: 'command is required' }, { status: 400 });
  }

  const startedAt = Date.now();

  try {
    const result = await generatePlan({ command });
    const durationMs = Date.now() - startedAt;

    const costUsd = await logUsage({
      userId: session.user.id,
      provider: result.usage.provider,
      model: result.usage.model,
      operation: 'plan_generation',
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      durationMs,
      success: true,
    });

    return NextResponse.json({
      plan: result.plan,
      usage: { ...result.usage, durationMs, costUsd },
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await logUsage({
      userId: session.user.id,
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      operation: 'plan_generation',
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
      success: false,
      errorMessage,
    });

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
