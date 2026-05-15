import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function getSession() {
  return await auth();
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user;
}
