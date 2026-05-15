import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/crypto';
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

        if (account.provider === 'github' && account.access_token) {
          const encryptedToken = encrypt(account.access_token);
          await db.user.update({
            where: { id: user.id as string },
            data: {
              githubToken: encryptedToken,
              githubUsername: token.name ?? null,
            },
          });
        }
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
          key: 'rivalradar-comparison-seed',
          value: {
            summary:
              'Previous comparison of akincskn/rivalradar with similar AI competitor analysis tools',
            repos: ['competitor-1', 'competitor-2', 'competitor-3'],
            keyFindings: [
              'RivalRadar has stronger N8N integration',
              'Competitor-1 has better OAuth flow',
              'Competitor-2 lacks PostgreSQL support',
            ],
            timestamp: '2026-05-01T10:00:00Z',
          },
          tags: ['comparison', 'github', 'rivalradar', 'demo-seed'],
          source: 'seed',
        },
      });
    },
  },
});
