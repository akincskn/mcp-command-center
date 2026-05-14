import type { MCPTool } from '../types';
import { db } from '@/lib/db';

export const memoryList: MCPTool = {
  name: 'memory.list',
  description: 'List user memories with optional namespace filter and pagination',
  inputSchema: {
    type: 'object',
    properties: {
      namespace: { type: 'string' },
      limit: { type: 'number', default: 10 },
      offset: { type: 'number', default: 0 },
    },
  },
  async execute(input, ctx) {
    const startedAt = Date.now();
    const { namespace, limit = 10, offset = 0 } = input as {
      namespace?: string;
      limit?: number;
      offset?: number;
    };

    const where = {
      userId: ctx.userId,
      ...(namespace ? { namespace } : {}),
    };

    const [memories, total] = await Promise.all([
      db.memory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 20),
        skip: Number(offset),
        select: {
          id: true,
          key: true,
          namespace: true,
          tags: true,
          createdAt: true,
        },
      }),
      db.memory.count({ where }),
    ]);

    return {
      content: [{ type: 'json', data: { memories, total } }],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
