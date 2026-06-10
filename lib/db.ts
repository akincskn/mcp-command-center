import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/app/generated/prisma/client';
import '@/lib/env'; // validate required env vars at startup (throws if missing)

// PrismaNeon uses WebSocket Pool — compatible with Neon pooled connection (port 6543)
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
