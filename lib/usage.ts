import { db } from '@/lib/db';

export interface LogUsageParams {
  userId: string;
  planId?: string;
  provider: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  durationMs?: number;
  success?: boolean;
  errorMessage?: string;
}

// Approximate — verify against current Groq pricing page before production
const PRICING: Record<string, { input: number; output: number }> = {
  'groq:openai/gpt-oss-20b': { input: 0.10, output: 0.50 },
  'groq:openai/gpt-oss-120b': { input: 0.15, output: 0.75 },
  'google:gemini-2.5-flash': { input: 0.075, output: 0.30 },
};

function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[`${provider}:${model}`];
  if (!pricing) return 0;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

export async function logUsage(params: LogUsageParams): Promise<number> {
  const costUsd = calculateCost(
    params.provider,
    params.model,
    params.inputTokens,
    params.outputTokens
  );

  await db.usageLog.create({
    data: {
      userId: params.userId,
      planId: params.planId,
      provider: params.provider,
      model: params.model,
      operation: params.operation,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      costUsd,
      durationMs: params.durationMs,
      success: params.success ?? true,
      errorMessage: params.errorMessage,
    },
  });

  return costUsd;
}
