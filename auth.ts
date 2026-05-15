import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
// import { encrypt } from '@/lib/crypto'; // Preserved for Phase 2 — see disabled GitHub provider in auth.config.ts
import { authConfig } from './auth.config';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (account && user) {
        token.userId = user.id;

        // Preserved for Phase 2 — see disabled GitHub provider in auth.config.ts
        // if (account.provider === 'github' && account.access_token) {
        //   const encryptedToken = encrypt(account.access_token);
        //   await db.user.update({
        //     where: { id: user.id as string },
        //     data: {
        //       githubToken: encryptedToken,
        //       githubUsername: token.name ?? null,
        //     },
        //   });
        // }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await db.memory.create({
        data: {
          userId: user.id,
          namespace: 'default',
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
          source: 'seed',
        },
      });
    },
  },
});
