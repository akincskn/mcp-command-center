import { Suspense } from 'react';
import { auth } from '@/auth';
import { PageTransition } from '@/components/shared/PageTransition';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  return (
    <PageTransition>
      <Suspense fallback={null}>
        <DashboardContent firstName={firstName} />
      </Suspense>
    </PageTransition>
  );
}
