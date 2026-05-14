import type { MCPTool } from '../types';
import { getOctokit } from './client';

export const githubSearchCode: MCPTool = {
  name: 'github.search_code',
  description: 'Search code across GitHub repositories',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      language: { type: 'string' },
      perPage: { type: 'number', default: 5, maximum: 10 },
    },
    required: ['query'],
  },
  async execute(input, ctx) {
    const startedAt = Date.now();
    const octokit = getOctokit(ctx);

    const { query, language, perPage = 5 } = input as {
      query: string;
      language?: string;
      perPage?: number;
    };

    const q = language ? `${query} language:${language}` : query;

    const { data } = await octokit.search.code({
      q,
      per_page: Math.min(Number(perPage), 10),
    });

    const results = data.items.map(item => ({
      name: item.name,
      path: item.path,
      repo: item.repository.full_name,
      url: item.html_url,
      score: item.score,
    }));

    return {
      content: [{ type: 'json', data: results }],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
