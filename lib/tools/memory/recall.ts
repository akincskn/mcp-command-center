import type { MCPTool } from '../types';
import { db } from '@/lib/db';
import type { Prisma } from '@/app/generated/prisma/client';

export const memoryRecall: MCPTool = {
  name: 'memory.recall',
  description: 'Retrieve from user memory by key or tags',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } },
      limit: { type: 'number', default: 5 },
    },
  },
  async execute(input, ctx) {
    const startedAt = Date.now();
    const { key, tags, limit = 5 } = input as {
      key?: string;
      tags?: string[];
      limit?: number;
    };

    const where: Prisma.MemoryWhereInput = { userId: ctx.userId };
    if (key) where.key = key;
    if (tags && tags.length > 0) where.tags = { hasSome: tags };

    const memories = await db.memory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(Number(limit), 10),
      select: {
        id: true,
        key: true,
        value: true,
        tags: true,
        createdAt: true,
      },
    });

    return {
      content: [{ type: 'json', data: memories }],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
