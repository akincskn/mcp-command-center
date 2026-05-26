'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Inline types matching the Prisma schema (avoids generated client import on client-side)
export type PlanStatus =
  | 'PENDING_APPROVAL'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type StepType = 'TOOL_CALL' | 'LLM_STEP';
export type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface PlanStep {
  id: string;
  planId: string;
  order: number;
  title: string;
  description: string;
  type: StepType;
  toolName: string | null;
  toolInput: unknown;
  agentTier: string | null;
  promptHint: string | null;
  output: unknown;
  status: StepStatus;
  inputTokens: number;
  outputTokens: number;
  costUsd: string;
  duration: number | null;
  retryCount: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface PlanWithSteps {
  id: string;
  userId: string;
  command: string;
  description: string | null;
  status: PlanStatus;
  agentMode: string;
  estimatedDuration: number | null;
  actualDuration: number | null;
  totalTokens: number;
  totalCostUsd: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  steps: PlanStep[];
  createdAt: string;
  updatedAt: string;
}

interface CreatePlanInput {
  command: string;
  agentMode?: 'auto' | 'speed' | 'balanced' | 'quality';
}

interface CreatePlanResponse {
  planId: string;
}

// Fetchers

async function createPlanFn(input: CreatePlanInput): Promise<CreatePlanResponse> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; message?: string };
    throw new Error(err.error ?? err.message ?? 'Plan creation failed');
  }
  return res.json();
}

async function getPlanFn(planId: string): Promise<{ plan: PlanWithSteps }> {
  const res = await fetch(`/api/plan/${planId}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Plan not found');
    throw new Error('Failed to fetch plan');
  }
  return res.json();
}

async function cancelPlanFn(planId: string): Promise<{ status: PlanStatus }> {
  const res = await fetch(`/api/plan/${planId}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to cancel plan');
  return res.json();
}

// Hooks

export function useCreatePlan() {
  return useMutation({
    mutationFn: createPlanFn,
  });
}

export function usePlan(planId: string | null) {
  return useQuery({
    queryKey: ['plan', planId],
    queryFn: () => getPlanFn(planId!),
    enabled: !!planId,
  });
}

export function useCancelPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelPlanFn,
    onSuccess: (_data, planId) => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}

async function executePlanFn(planId: string): Promise<{ status: string }> {
  const res = await fetch(`/api/plan/${planId}/execute`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Execution failed');
  }
  return res.json();
}

export function useExecutePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: executePlanFn,
    onSuccess: (_data, planId) => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}

async function retryStepFn(stepId: string): Promise<{ status: string }> {
  const res = await fetch(`/api/step/${stepId}/retry`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'Retry failed');
  }
  return res.json();
}

export function useRetryStep(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: retryStepFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
    },
  });
}
