import { db } from '@/lib/db';
import { getTool } from '@/lib/tools/registry';
import { resolveDynamicInput } from './resolveDynamic';
import { buildLLMContext } from './contextBuilder';
import { agents, agentMetadata } from '@/lib/ai/agents';
import { generateText } from 'ai';
import { logUsage } from '@/lib/usage';

const EXTRACTION_PROMPT = `You are an extraction agent. Given raw tool output, extract specific information.

INPUT: {previousOutputs}
TASK: {description}
HINT: {hint}

Rules:
- Only extract from provided input, do not infer
- If information missing, mark fields as null
- Maximum response: 500 tokens
- Return structured JSON when possible`;

const SYNTHESIS_PROMPT = `You are a senior analysis agent. Synthesize information from multiple sources.

CONTEXT (previous step outputs):
{previousOutputs}

CURRENT TASK: {description}
HINT: {hint}

REQUIREMENTS:
- Provide structured analysis (not free prose)
- Cite which input data supports each finding
- Be specific, no vague generalizations
- Maximum 800 tokens`;

export async function runStep(stepId: string): Promise<void> {
  const startedAt = Date.now();

  const step = await db.step.findUnique({
    where: { id: stepId },
    include: {
      plan: {
        include: {
          user: { select: { id: true, githubToken: true } },
          steps: { orderBy: { order: 'asc' } },
        },
      },
    },
  });

  if (!step) throw new Error(`Step ${stepId} not found`);
  if (step.status !== 'PENDING') {
    console.log(`[runner] Step ${stepId} already in status ${step.status}, skipping`);
    return;
  }

  await db.step.update({
    where: { id: stepId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  try {
    let output: unknown;
    let inputTokens = 0;
    let outputTokens = 0;
    let provider: string | undefined;
    let modelName: string | undefined;

    if (step.type === 'TOOL_CALL') {
      const result = await executeToolStep(step);
      output = result.output;
    } else if (step.type === 'LLM_STEP') {
      const result = await executeLLMStep(step);
      output = result.output;
      inputTokens = result.inputTokens;
      outputTokens = result.outputTokens;
      provider = result.provider;
      modelName = result.model;
    }

    const duration = Date.now() - startedAt;

    let stepCostUsd = 0;
    if (step.type === 'LLM_STEP' && provider && modelName) {
      stepCostUsd = await logUsage({
        userId: step.plan.user.id,
        planId: step.planId,
        provider,
        model: modelName,
        operation: 'step_execution',
        inputTokens,
        outputTokens,
        durationMs: duration,
        success: true,
      });
    }

    await db.step.update({
      where: { id: stepId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        duration,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        output: output as any,
        inputTokens,
        outputTokens,
        costUsd: stepCostUsd,
      },
    });

    // Aggregate plan-level totals from all completed steps
    const completedSteps = await db.step.findMany({
      where: { planId: step.planId, status: 'COMPLETED' },
      select: { inputTokens: true, outputTokens: true, costUsd: true },
    });

    const totalTokens = completedSteps.reduce(
      (sum, s) => sum + (s.inputTokens ?? 0) + (s.outputTokens ?? 0),
      0
    );

    const totalCostUsd = completedSteps.reduce(
      (sum, s) => sum + Number(s.costUsd ?? 0),
      0
    );

    await db.plan.update({
      where: { id: step.planId },
      data: { totalTokens, totalCostUsd },
    });

    // Check if this was the last step → mark plan COMPLETED.
    // No self-trigger — runPlanSequential drives the chain in-process.
    const remainingPending = await db.step.count({
      where: { planId: step.planId, status: 'PENDING' },
    });

    if (remainingPending === 0) {
      const planStartedAt = step.plan.startedAt;
      await db.plan.update({
        where: { id: step.planId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          actualDuration: planStartedAt
            ? Math.floor((Date.now() - planStartedAt.getTime()) / 1000)
            : null,
        },
      });
    }
  } catch (error) {
    const duration = Date.now() - startedAt;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await db.step.update({
      where: { id: stepId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        duration,
        errorMessage,
      },
    });

    await db.plan.update({
      where: { id: step.planId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage: `Step ${step.order} (${step.title}) failed: ${errorMessage}`,
      },
    });

    console.error(`[runner] Step ${stepId} failed:`, error);
  }
}

/**
 * Execute all PENDING steps of a plan sequentially in a single function call.
 * Replaces the self-invoking fetch chain (which hits Vercel 508 INFINITE_LOOP
 * at depth 5+). The caller should wrap this in waitUntil() so it survives the
 * HTTP response returning.
 */
export async function runPlanSequential(planId: string): Promise<void> {
  console.log(`[runPlanSequential] starting plan ${planId}`);

  while (true) {
    // Find next PENDING step (ordered by `order`)
    const nextStep = await db.step.findFirst({
      where: { planId, status: 'PENDING' },
      orderBy: { order: 'asc' },
      select: { id: true, order: true },
    });

    if (!nextStep) {
      console.log(`[runPlanSequential] no more PENDING steps for plan ${planId}`);
      break;
    }

    console.log(`[runPlanSequential] executing step ${nextStep.order} (${nextStep.id})`);

    try {
      await runStep(nextStep.id);
    } catch (err) {
      // runStep already marks the plan FAILED in its own catch; break the chain.
      console.error(`[runPlanSequential] step ${nextStep.id} failed, stopping chain:`, err);
      break;
    }

    // If runStep marked the plan FAILED, stop.
    const plan = await db.plan.findUnique({
      where: { id: planId },
      select: { status: true },
    });
    if (plan?.status === 'FAILED') {
      console.log(`[runPlanSequential] plan ${planId} marked FAILED, stopping`);
      break;
    }
  }
}

async function executeToolStep(
  step: Awaited<ReturnType<typeof db.step.findUnique>> & {
    plan: { user: { id: string; githubToken: string | null } };
  }
) {
  if (!step) throw new Error('Step is null');
  if (!step.toolName) throw new Error('TOOL_CALL step missing toolName');

  const tool = getTool(step.toolName);
  if (!tool) throw new Error(`Tool ${step.toolName} not found`);

  const previousSteps = await db.step.findMany({
    where: {
      planId: step.planId,
      order: { lt: step.order },
      status: 'COMPLETED',
    },
    select: { order: true, output: true },
  });

  const rawInput = (step.toolInput as Record<string, unknown>) ?? {};
  const resolvedInput = resolveDynamicInput(rawInput, previousSteps);

  const ctx = {
    userId: step.plan.user.id,
    planId: step.planId,
    stepId: step.id,
    githubToken: step.plan.user.githubToken ?? undefined,
  };

  const result = await tool.execute(resolvedInput, ctx);

  if (result.isError) {
    throw new Error(`Tool ${step.toolName} returned error`);
  }

  return { output: result.content };
}

async function executeLLMStep(
  step: Awaited<ReturnType<typeof db.step.findUnique>> & {
    plan: {
      steps: Array<{
        order: number;
        title: string;
        status: string;
        output: unknown;
      }>;
    };
  }
) {
  if (!step) throw new Error('Step is null');
  if (!step.agentTier) throw new Error('LLM_STEP missing agentTier');

  const tier = step.agentTier as keyof typeof agents;
  const meta = agentMetadata[tier];
  if (!meta) throw new Error(`Unknown agentTier: ${step.agentTier}`);

  const previousOutputs = buildLLMContext(step.plan.steps, step.order);

  const promptTemplate = tier === 'quality' ? SYNTHESIS_PROMPT : EXTRACTION_PROMPT;
  const prompt = promptTemplate
    .replace('{previousOutputs}', previousOutputs)
    .replace('{description}', step.description)
    .replace('{hint}', step.promptHint ?? 'N/A');

  const model = agents[tier];

  const result = await generateText({
    model,
    prompt,
    temperature: 0.5,
    maxOutputTokens: 1000,
  });

  return {
    output: { text: result.text },
    inputTokens: result.usage.inputTokens ?? 0,
    outputTokens: result.usage.outputTokens ?? 0,
    provider: meta.provider,
    model: meta.model,
  };
}
