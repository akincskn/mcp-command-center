import { db } from '../lib/db';

async function migrateSeedMemory() {
  const oldSeeds = await db.memory.findMany({
    where: { key: 'rivalradar-comparison-seed' }
  });

  console.log(`Found ${oldSeeds.length} old seed memories to migrate`);

  for (const old of oldSeeds) {
    await db.memory.update({
      where: { id: old.id },
      data: {
        key: 'mcp-command-center-roadmap-seed',
        value: {
          summary: 'Previous analysis of mcp-command-center roadmap and open issues',
          repos: ['competitor-orchestrator-1', 'competitor-orchestrator-2'],
          keyFindings: [
            'MCP Command Center has stronger plan-then-execute UX',
            'Competitor-1 lacks multi-agent routing',
            "Competitor-2 doesn't expose cost transparency",
          ],
          timestamp: '2026-05-01T10:00:00Z',
        },
        tags: ['roadmap', 'mcp-command-center', 'demo-seed'],
      },
    });
    console.log(`Migrated memory ${old.id}`);
  }

  await db.$disconnect();
}

migrateSeedMemory().catch(console.error);
