import type { MCPTool } from '../types';
import { getOctokit } from './client';

export const githubGetRepo: MCPTool = {
  name: 'github.get_repo',
  description: 'Get repository metadata from GitHub',
  inputSchema: {
    type: 'object',
    properties: {
      owner: { type: 'string' },
      repo: { type: 'string' },
    },
    required: ['owner', 'repo'],
  },
  async execute(input, ctx) {
    const startedAt = Date.now();
    const octokit = getOctokit(ctx);

    const { owner, repo } = input as { owner: string; repo: string };

    const { data } = await octokit.repos.get({ owner, repo });

    return {
      content: [
        {
          type: 'json',
          data: {
            name: data.name,
            fullName: data.full_name,
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            openIssues: data.open_issues_count,
            language: data.language,
            topics: data.topics,
            url: data.html_url,
            defaultBranch: data.default_branch,
            updatedAt: data.updated_at,
          },
        },
      ],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
