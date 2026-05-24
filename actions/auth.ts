'use server';

import { signIn, signOut } from '@/auth';

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/dashboard' });
}

// export async function signInWithGitHub() { // GitHub provider disabled in Phase 5.5
//   await signIn('github', { redirectTo: '/' });
// }

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}
