import { db } from '../lib/db';

async function test() {
  const count = await db.user.count();
  console.log('User count:', count);
  await db.$disconnect();
}

test().catch(console.error);
