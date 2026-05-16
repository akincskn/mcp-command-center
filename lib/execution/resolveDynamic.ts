interface PreviousStep {
  order: number;
  output: unknown;
}

export function resolveDynamicInput(
  input: Record<string, unknown>,
  previousSteps: PreviousStep[]
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value && typeof value === 'object' && '_dynamic' in value) {
      const path = (value as { _dynamic: string })._dynamic;
      resolved[key] = resolvePath(path, previousSteps);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

function resolvePath(path: string, previousSteps: PreviousStep[]): unknown {
  // Format: "step_N.output.path.to.field"
  const match = path.match(/^step_(\d+)\.output\.?(.*)$/);
  if (!match) {
    console.warn(`[resolvePath] Invalid path format: ${path}`);
    return null;
  }

  const [, orderStr, fieldPath] = match;
  const order = parseInt(orderStr!, 10);
  const step = previousSteps.find(s => s.order === order);

  if (!step || !step.output) {
    console.warn(`[resolvePath] No output for step ${order}`);
    return null;
  }

  let current: unknown = step.output;

  if (fieldPath) {
    const parts = fieldPath.split('.');
    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as object)) {
        current = (current as Record<string, unknown>)[part];
      } else if (Array.isArray(current) && /^\d+$/.test(part)) {
        current = current[parseInt(part, 10)];
      } else {
        console.warn(`[resolvePath] Path ${path} broken at: ${part}`);
        return null;
      }
    }
  }

  // Seçenek A: array dönerse stringify, loop yok
  if (Array.isArray(current)) {
    return JSON.stringify(current);
  }

  return current;
}
