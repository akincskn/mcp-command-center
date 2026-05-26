import { generateObject } from 'ai';
import { agents } from './agents';
import { PlanSchema, type PlanData } from '@/lib/schemas/plan';
import {
  PLAN_GENERATION_SYSTEM_PROMPT,
  buildPlanUserPrompt,
} from '@/lib/prompts/planGeneration';
import { db } from '@/lib/db';

export interface PlanGenerationInput {
  command: string;
  userId: string;
  agentMode?: 'auto' | 'speed' | 'balanced' | 'quality';
}

export interface PlanGenerationResult {
  plan: PlanData;
  usage: {
    inputTokens: number;
    outputTokens: number;
    model: string;
    provider: string;
  };
}

export async function generatePlan(
  input: PlanGenerationInput,
  retries = 2,
  lastError?: string
): Promise<PlanGenerationResult> {
  // Fetch recent 5 memories for user context
  const recentMemories = await db.memory.findMany({
    where: { userId: input.userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { key: true, tags: true },
  });

  // PROMPTS.md Section 5: On retry 2, inject the previous error into system prompt
  const systemPrompt =
    lastError && retries < 2
      ? `${PLAN_GENERATION_SYSTEM_PROMPT}\n\nPREVIOUS ATTEMPT FAILED. ERROR: ${lastError}. Return valid JSON only.`
      : PLAN_GENERATION_SYSTEM_PROMPT;

  try {
    const result = await generateObject({
      model: agents.speed,
      schema: PlanSchema,
      // structuredOutputs:false → json_object mode; Zod validates post-hoc.
      // Groq json_schema strict mode rejects .optional() fields and propertyNames.
      providerOptions: { groq: { structuredOutputs: false } },
      system: systemPrompt,
      prompt: buildPlanUserPrompt({ command: input.command, recentMemories }),
      temperature: 0.3,
    });

    return {
      plan: result.object,
      usage: {
        inputTokens: result.usage.inputTokens ?? 0,
        outputTokens: result.usage.outputTokens ?? 0,
        model: 'openai/gpt-oss-20b',
        provider: 'groq',
      },
    };
  } catch (error) {
    if (retries > 0) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);
      console.warn(`Plan generation failed (${retries} retries left):`, errorMsg);
      return generatePlan(input, retries - 1, errorMsg);
    }
    throw error;
  }
}
