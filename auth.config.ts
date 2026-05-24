import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
// import GitHub from 'next-auth/providers/github'; // GitHub provider disabled in Phase 5.5 — re-enable for Phase 2 BYOK feature

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // GitHub provider disabled in Phase 5.5 — re-enable for Phase 2 BYOK feature
    // GitHub({
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    //   authorization: {
    //     params: { scope: 'read:user user:email public_repo' },
    //   },
    // }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const isProtected =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/history') ||
        pathname.startsWith('/settings');
      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
