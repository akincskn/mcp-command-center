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

    let data: Awaited<ReturnType<typeof octokit.repos.get>>['data'];
    try {
      ({ data } = await octokit.repos.get({ owner, repo }));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        throw new Error(
          `Repository "${owner}/${repo}" not found or not accessible. ` +
          `It may be private, renamed, or the name was inferred incorrectly.`
        );
      }
      throw err;
    }

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
