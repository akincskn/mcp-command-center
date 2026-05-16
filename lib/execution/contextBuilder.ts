const MAX_CONTEXT_CHARS = 8000; // ~2000 tokens

interface StepLike {
  order: number;
  title: string;
  status: string;
  output: unknown;
}

export function buildLLMContext(allSteps: StepLike[], currentOrder: number): string {
  const previousSteps = allSteps
    .filter(s => s.order < currentOrder && s.status === 'COMPLETED' && s.output)
    .sort((a, b) => a.order - b.order);

  if (previousSteps.length === 0) {
    return 'No previous step outputs.';
  }

  const parts: string[] = [];
  let totalChars = 0;

  for (const step of previousSteps) {
    const outputStr = JSON.stringify(step.output, null, 2);
    let truncated = outputStr;

    if (totalChars + outputStr.length > MAX_CONTEXT_CHARS) {
      const remaining = MAX_CONTEXT_CHARS - totalChars;
      if (remaining > 100) {
        truncated = outputStr.substring(0, remaining) + '\n... [TRUNCATED]';
      } else {
        truncated = '... [STEP TOO LARGE, SKIPPED]';
      }
    }

    parts.push(`--- Step ${step.order}: ${step.title} ---\n${truncated}`);
    totalChars += truncated.length;

    if (totalChars >= MAX_CONTEXT_CHARS) break;
  }

  return parts.join('\n\n');
}
