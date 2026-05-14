import { Octokit } from '@octokit/rest';
import { decrypt } from '@/lib/crypto';

export function getOctokit(ctx: { githubToken?: string }): Octokit {
  let token: string | undefined;

  if (ctx.githubToken) {
    token = decrypt(ctx.githubToken);
  } else {
    token = process.env.GITHUB_DEMO_TOKEN;
  }

  if (!token) {
    throw new Error('No GitHub token available');
  }

  return new Octokit({ auth: token });
}
