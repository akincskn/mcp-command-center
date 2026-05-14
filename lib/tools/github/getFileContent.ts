import type { MCPTool } from '../types';
import { getOctokit } from './client';

export const githubGetFile: MCPTool = {
  name: 'github.get_file_content',
  description: 'Get the content of a specific file from a GitHub repository',
  inputSchema: {
    type: 'object',
    properties: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      path: { type: 'string' },
      ref: { type: 'string' },
    },
    required: ['owner', 'repo', 'path'],
  },
  async execute(input, ctx) {
    const startedAt = Date.now();
    const octokit = getOctokit(ctx);

    const { owner, repo, path, ref } = input as {
      owner: string;
      repo: string;
      path: string;
      ref?: string;
    };

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ...(ref ? { ref } : {}),
    });

    if (Array.isArray(data)) {
      return {
        content: [{ type: 'json', data: data.map(f => ({ name: f.name, path: f.path, type: f.type })) }],
        metadata: { durationMs: Date.now() - startedAt },
      };
    }

    if (data.type !== 'file' || !('content' in data)) {
      throw new Error(`Path '${path}' is not a file`);
    }

    const content = Buffer.from(data.content, 'base64').toString('utf8');

    return {
      content: [
        {
          type: 'json',
          data: {
            name: data.name,
            path: data.path,
            size: data.size,
            content,
            url: data.html_url,
          },
        },
      ],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
