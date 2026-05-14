import { groq } from '@ai-sdk/groq';
import { google } from '@ai-sdk/google';

export const agents = {
  speed: groq('openai/gpt-oss-20b'),
  balanced: google('gemini-2.5-flash'),
  quality: groq('openai/gpt-oss-120b'),
} as const;

export type AgentTier = keyof typeof agents;

export const agentMetadata: Record<
  AgentTier,
  { name: string; description: string; provider: 'groq' | 'google'; model: string }
> = {
  speed: {
    name: 'Speed',
    description: 'Fast, cheap, for simple tasks',
    provider: 'groq',
    model: 'openai/gpt-oss-20b',
  },
  balanced: {
    name: 'Balanced',
    description: 'Middle tier, for moderate reasoning',
    provider: 'google',
    model: 'gemini-2.5-flash',
  },
  quality: {
    name: 'Quality',
    description: 'Deep reasoning, for synthesis/comparison/analysis',
    provider: 'groq',
    model: 'openai/gpt-oss-120b',
  },
};
