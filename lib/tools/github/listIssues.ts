import type { MCPTool } from '../types';
import { getOctokit } from './client';

export const githubListIssues: MCPTool = {
  name: 'github.list_issues',
  description: 'List issues from a GitHub repository',
  inputSchema: {
    type: 'object',
    properties: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      state: { type: 'string', enum: ['open', 'closed', 'all'], default: 'open' },
      perPage: { type: 'number', default: 5, maximum: 20 },
    },
    required: ['owner', 'repo'],
  },
  async execute(input, ctx) {
    const startedAt = Date.now();
    const octokit = getOctokit(ctx);

    const { owner, repo, state = 'open', perPage = 5 } = input as {
      owner: string;
      repo: string;
      state?: 'open' | 'closed' | 'all';
      perPage?: number;
    };

    let data: Awaited<ReturnType<typeof octokit.issues.listForRepo>>['data'];
    try {
      ({ data } = await octokit.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: Math.min(Number(perPage), 20),
      }));
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
        throw new Error(
          `Repository "${owner}/${repo}" not found or not accessible. ` +
          `It may be private, renamed, or the name was inferred incorrectly.`
        );
      }
      throw err;
    }

    // Filter out pull requests (GitHub API returns both)
    const issues = data
      .filter(i => !('pull_request' in i))
      .map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        createdAt: i.created_at,
        author: i.user?.login,
        labels: i.labels.map(l => (typeof l === 'string' ? l : l.name)),
        url: i.html_url,
      }));

    return {
      content: [{ type: 'json', data: issues }],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
