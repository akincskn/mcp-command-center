import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { generatePlan } from '@/lib/ai/planGenerator';
import { logUsage } from '@/lib/usage';
import { z } from 'zod';

const RequestSchema = z.object({
  command: z.string().min(3).max(500),
  agentMode: z.enum(['auto', 'speed', 'balanced', 'quality']).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { command, agentMode = 'auto' } = parsed.data;
  const userId = session.user.id;
  const startedAt = Date.now();

  try {
    const result = await generatePlan({ command, userId, agentMode });
    const planDurationMs = Date.now() - startedAt;

    const plan = await db.$transaction(async (tx) => {
      const newPlan = await tx.plan.create({
        data: {
          userId,
          command,
          description: result.plan.description,
          status: 'PENDING_APPROVAL',
          agentMode,
          estimatedDuration: result.plan.estimatedDuration,
        },
      });

      await tx.step.createMany({
        data: result.plan.steps.map((s) => ({
          planId: newPlan.id,
          order: s.order,
          title: s.title,
          description: s.description,
          type: s.type,
          toolName: s.toolName ?? null,
          toolInput: s.toolInput ?? undefined,
          agentTier: s.agentTier ?? null,
          promptHint: s.promptHint ?? null,
          status: 'PENDING',
        })),
      });

      return newPlan;
    });

    await logUsage({
      userId,
      planId: plan.id,
      provider: result.usage.provider,
      model: result.usage.model,
      operation: 'plan_generation',
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      durationMs: planDurationMs,
      success: true,
    });

    return NextResponse.json({ planId: plan.id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const durationMs = Date.now() - startedAt;

    await logUsage({
      userId,
      provider: 'groq',
      model: 'openai/gpt-oss-20b',
      operation: 'plan_generation',
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
      success: false,
      errorMessage,
    });

    return NextResponse.json(
      { error: 'Plan generation failed', message: errorMessage },
      { status: 500 }
    );
  }
}
