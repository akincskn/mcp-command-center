import type { MCPTool } from '../types';
import { tavilyApiCall } from './client';

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilySearchResponse {
  results: TavilySearchResult[];
}

export const tavilyWebSearch: MCPTool = {
  name: 'tavily.web_search',
  description: 'Search the web using Tavily',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      maxResults: { type: 'number', default: 5, maximum: 10 },
    },
    required: ['query'],
  },
  async execute(input) {
    const startedAt = Date.now();
    const { query, maxResults = 5 } = input as { query: string; maxResults?: number };

    const raw = await tavilyApiCall('/search', {
      query,
      max_results: Math.min(Number(maxResults), 10),
      search_depth: 'basic',
      include_answer: false,
    });

    const response = raw as TavilySearchResponse;
    const results = response.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      score: r.score,
    }));

    return {
      content: [{ type: 'json', data: results }],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
