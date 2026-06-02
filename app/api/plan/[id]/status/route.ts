import { auth } from '@/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TERMINAL = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { id: planId } = await params;

  const planExists = await db.plan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true },
  });

  if (!planExists) {
    return new Response('Plan not found', { status: 404 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // In-memory state to detect changes without requiring updatedAt on Step
      let lastPlanStatus = '';
      let lastTotalTokens = -1;
      const lastStepStatus = new Map<string, string>();

      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        const data = await db.plan.findFirst({
          where: { id: planId, userId },
          select: {
            status: true,
            totalTokens: true,
            totalCostUsd: true,
            actualDuration: true,
            errorMessage: true,
            steps: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                status: true,
                startedAt: true,
                completedAt: true,
                duration: true,
                inputTokens: true,
                outputTokens: true,
                costUsd: true,
                errorMessage: true,
                output: true,
              },
            },
          },
        });

        if (!data) return null;

        const planChanged =
          data.status !== lastPlanStatus || data.totalTokens !== lastTotalTokens;
        const changedSteps = data.steps.filter(
          (s) => lastStepStatus.get(s.id) !== s.status
        );

        if (!planChanged && changedSteps.length === 0) return null;

        lastPlanStatus = data.status;
        lastTotalTokens = data.totalTokens;
        data.steps.forEach((s) => lastStepStatus.set(s.id, s.status));

        return {
          plan: {
            status: data.status,
            totalTokens: data.totalTokens,
            totalCostUsd: data.totalCostUsd.toString(),
            actualDuration: data.actualDuration,
            errorMessage: data.errorMessage,
          },
          steps: changedSteps.map((s) => ({
            ...s,
            costUsd: s.costUsd.toString(),
          })),
          timestamp: new Date().toISOString(),
        };
      };

      // Send initial state immediately
      const initial = await poll();
      if (initial) {
        send(initial);
        if (TERMINAL.has(initial.plan.status)) {
          send({ done: true, status: initial.plan.status });
          try { controller.close(); } catch {}
          return;
        }
      }

      // Poll every second for changes
      intervalId = setInterval(async () => {
        try {
          const update = await poll();
          if (update) {
            send(update);
            if (TERMINAL.has(update.plan.status)) {
              send({ done: true, status: update.plan.status });
              if (intervalId) clearInterval(intervalId);
              try { controller.close(); } catch {}
            }
          }
        } catch (err) {
          console.error('[SSE]', err);
        }
      }, 1000);

      req.signal.addEventListener('abort', () => {
        if (intervalId) clearInterval(intervalId);
        try { controller.close(); } catch {}
      });
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
