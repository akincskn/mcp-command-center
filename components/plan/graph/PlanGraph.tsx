'use client';

import { useMemo } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { StepNode } from './StepNode';
import { buildGraphFromSteps } from './buildGraph';
import type { PlanStep } from '../usePlanQueries';

const nodeTypes = { stepNode: StepNode };

interface PlanGraphProps {
  steps: PlanStep[];
}

export function PlanGraph({ steps }: PlanGraphProps) {
  const { nodes, edges } = useMemo(() => buildGraphFromSteps(steps), [steps]);

  return (
    <div className="h-[500px] w-full rounded-lg border border-border bg-zinc-950/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll
      >
        <Background color="var(--graph-grid)" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
