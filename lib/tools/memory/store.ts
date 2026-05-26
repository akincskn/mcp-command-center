import type { MCPTool } from '../types';
import { db } from '@/lib/db';

export const memoryStore: MCPTool = {
  name: 'memory.store',
  description: 'Save or update a value in user memory',
  inputSchema: {
    type: 'object',
    properties: {
      key: { type: 'string' },
      value: { type: 'object' },
      tags: { type: 'array', items: { type: 'string' } },
      namespace: { type: 'string', default: 'default' },
    },
    required: ['key', 'value'],
  },
  async execute(input, ctx) {
    const startedAt = Date.now();
    const { key, value, tags = [], namespace = 'default' } = input as {
      key: string;
      value: unknown;
      tags?: string[];
      namespace?: string;
    };

    if (!key) throw new Error('memory.store requires a key');

    // Prisma JSON fields reject undefined; wrap plain strings too
    const safeValue: unknown =
      value === undefined || value === null
        ? { note: 'No content provided' }
        : typeof value === 'string'
          ? { text: value }
          : value;

    const memory = await db.memory.upsert({
      where: {
        userId_namespace_key: {
          userId: ctx.userId,
          namespace,
          key,
        },
      },
      update: {
        value: safeValue as Parameters<typeof db.memory.upsert>[0]['update']['value'],
        tags,
      },
      create: {
        userId: ctx.userId,
        namespace,
        key,
        value: safeValue as Parameters<typeof db.memory.upsert>[0]['create']['value'],
        tags,
      },
      select: {
        id: true,
        key: true,
        namespace: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      content: [{ type: 'json', data: memory }],
      metadata: { durationMs: Date.now() - startedAt },
    };
  },
};
