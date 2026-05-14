import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Prisma } from '@/app/generated/prisma/client';
import { getOctokit } from '@/lib/tools/github/client';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Serve from cache if fresh
  const cached = await db.mcpResourceCache.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (cached.length > 0) {
    return NextResponse.json({ resources: cached });
  }

  const resources: Array<{
    userId: string;
    mcpServer: string;
    uri: string;
    name: string;
    type: string;
    metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    expiresAt: Date;
  }> = [];

  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

  // GitHub repos
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { githubToken: true, githubUsername: true },
  });

  if (user?.githubToken || process.env.GITHUB_DEMO_TOKEN) {
    try {
      const octokit = getOctokit({ githubToken: user?.githubToken ?? undefined });
      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        per_page: 20,
        sort: 'updated',
      });

      for (const repo of repos) {
        resources.push({
          userId,
          mcpServer: 'github',
          uri: `github://${repo.full_name}`,
          name: repo.full_name,
          type: 'repository',
          metadata: {
            description: repo.description ?? null,
            stars: repo.stargazers_count,
            language: repo.language ?? null,
          } satisfies Prisma.InputJsonValue,
          expiresAt,
        });
      }
    } catch {
      // GitHub fetch failed — skip, don't block
    }
  }

  // Memory resources
  try {
    const memories = await db.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { key: true, namespace: true, tags: true },
    });

    for (const mem of memories) {
      resources.push({
        userId,
        mcpServer: 'memory',
        uri: `memory://${mem.namespace}/${mem.key}`,
        name: mem.key,
        type: 'memory',
        metadata: { namespace: mem.namespace, tags: mem.tags } satisfies Prisma.InputJsonValue,
        expiresAt,
      });
    }
  } catch {
    // Memory fetch failed — skip
  }

  // Upsert all into cache
  if (resources.length > 0) {
    await Promise.all(
      resources.map(r =>
        db.mcpResourceCache.upsert({
          where: {
            userId_mcpServer_uri: {
              userId: r.userId,
              mcpServer: r.mcpServer,
              uri: r.uri,
            },
          },
          update: { name: r.name, type: r.type, metadata: r.metadata, expiresAt: r.expiresAt },
          create: r,
        }),
      ),
    );
  }

  return NextResponse.json({ resources });
}
