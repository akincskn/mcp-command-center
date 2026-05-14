import type { MCPTool } from '../types';
import { tavilyApiCall } from './client';

interface TavilyExtractResult {
  url: string;
  raw_content: string;
}

interface TavilyExtractResponse {
  results: TavilyExtractResult[];
}

export const tavilyWebFetch: MCPTool = {
  name: 'tavily.web_fetch',
  description: 'Fetch and extract content from a URL using Tavily',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
    },
    required: ['url'],
  },
  async execute(input) {
    const startedAt = Date.now();
    const { url } = input as { url: string };

    const raw = await tavilyApiCall('/extract', { urls: [url] });

    const response = raw as TavilyExtractResponse;
    const first = response.results[0];

    if (!first) {
      throw new Error(`No content extracted from ${url}`);
    }

    return {
      content: [
        {
          type: 'json',
          data: {
            url: first.url,
            content: first.raw_content,
          },
        },
      ],
      metadata: {
        durationMs: Date.now() - startedAt,
        sourceUrl: first.url,
      },
    };
  },
};
