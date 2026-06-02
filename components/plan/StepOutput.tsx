'use client';

import { GithubIssuesOutput } from './outputs/GithubIssuesOutput';
import { TavilyResultsOutput } from './outputs/TavilyResultsOutput';
import { LLMTextOutput } from './outputs/LLMTextOutput';
import { MemoryOutput } from './outputs/MemoryOutput';
import { JsonFallback } from './outputs/JsonFallback';

interface StepOutputProps {
  step: {
    type: string;
    toolName: string | null;
    output: unknown;
  };
}

export function StepOutput({ step }: StepOutputProps) {
  if (!step.output) return null;

  if (step.type === 'LLM_STEP') {
    return <LLMTextOutput output={step.output} />;
  }

  if (step.toolName === 'github.list_issues') {
    return <GithubIssuesOutput output={step.output} />;
  }

  if (step.toolName?.startsWith('tavily.')) {
    return <TavilyResultsOutput output={step.output} />;
  }

  if (step.toolName?.startsWith('memory.')) {
    return <MemoryOutput output={step.output} />;
  }

  return <JsonFallback output={step.output} />;
}
