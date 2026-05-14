import { z } from 'zod';

export const StepSchema = z.object({
  order: z.number().int().min(1).max(8),
  title: z.string().min(3).max(60),
  description: z.string().min(10).max(300),
  type: z.enum(['TOOL_CALL', 'LLM_STEP']),
  toolName: z.string().optional(),
  toolInput: z.any().optional(),
  agentTier: z.enum(['speed', 'balanced', 'quality']).optional(),
  promptHint: z.string().optional(),
});

export const PlanSchema = z
  .object({
    description: z.string().min(10).max(200),
    estimatedDuration: z.number().int().min(5).max(120),
    steps: z.array(StepSchema).min(1).max(8),
    error: z.string().optional(),
  })
  .refine(
    (data) =>
      data.steps.every((s) => {
        if (s.type === 'TOOL_CALL') return !!s.toolName;
        if (s.type === 'LLM_STEP') return !!s.agentTier;
        return false;
      }),
    { message: 'Invalid step configuration' }
  );

export type PlanData = z.infer<typeof PlanSchema>;
export type StepData = z.infer<typeof StepSchema>;
