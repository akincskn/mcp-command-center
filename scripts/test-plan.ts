import 'dotenv/config';
import { generatePlan } from '../lib/ai/planGenerator';

async function test() {
  console.log('Testing plan generation...\n');

  const commands = [
    "akincskn/rivalradar son 5 issue'sunu listele, web'de benzer açık-kaynak projeleri ara, karşılaştırma yap",
    "Geçen seferki RivalRadar comparison'ını hatırla, GitHub'daki güncellemelerle karşılaştır",
    'MCP protokolü hakkında 5 makale bul, key insights çıkar',
  ];

  for (const command of commands) {
    console.log('='.repeat(60));
    console.log('Command:', command);
    console.log('='.repeat(60));

    const start = Date.now();
    try {
      const result = await generatePlan({ command });
      const duration = Date.now() - start;

      console.log('\nPlan generated in', duration, 'ms');
      console.log('Description:', result.plan.description);
      console.log('Estimated duration:', result.plan.estimatedDuration, 's');
      console.log('Steps:', result.plan.steps.length);
      console.log(
        'Tokens:',
        result.usage.inputTokens,
        '+',
        result.usage.outputTokens
      );
      console.log('\nSteps:');
      result.plan.steps.forEach((s) => {
        console.log(`  ${s.order}. [${s.type}] ${s.title}`);
        if (s.toolName) console.log(`     tool: ${s.toolName}`);
        if (s.agentTier) console.log(`     agent: ${s.agentTier}`);
      });
    } catch (e) {
      console.error('Failed:', e);
    }

    console.log();
  }
}

test().catch(console.error);
