import type { Node, Edge } from '@xyflow/react';
import type { PlanStep } from '../usePlanQueries';

const NODE_HEIGHT = 100;
const NODE_GAP = 60;

export function buildGraphFromSteps(steps: PlanStep[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = steps.map((step, i) => ({
    id: step.id,
    type: 'stepNode',
    position: { x: 0, y: i * (NODE_HEIGHT + NODE_GAP) },
    data: {
      order: step.order,
      title: step.title,
      type: step.type,
      toolName: step.toolName,
      agentTier: step.agentTier,
      status: step.status,
      inputTokens: step.inputTokens,
      outputTokens: step.outputTokens,
      errorMessage: step.errorMessage,
    },
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    const source = steps[i];
    const target = steps[i + 1];
    if (!source || !target) continue;

    edges.push({
      id: `${source.id}-${target.id}`,
      source: source.id,
      target: target.id,
      type: 'smoothstep',
      animated: source.status === 'COMPLETED' && target.status === 'RUNNING',
      style: {
        stroke:
          source.status === 'COMPLETED' ? 'var(--edge-active)' : 'var(--edge-default)',
        strokeWidth: 2,
      },
    });
  }

  return { nodes, edges };
}
