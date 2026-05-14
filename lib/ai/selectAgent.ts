import type { AgentTier } from './agents';

export function selectAgent(stepType: string, promptHint?: string): AgentTier {
  if (stepType === 'plan_generation') return 'speed';

  if (!promptHint) return 'balanced';

  const hint = promptHint.toLowerCase();
  if (/(compare|analyze|synthesize|deep|reasoning)/.test(hint)) return 'quality';
  if (/(filter|extract|format|summarize)/.test(hint)) return 'balanced';
  return 'balanced';
}
