import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MobileSidebar } from '@/components/dashboard/MobileSidebar';
import { CostBadge } from '@/components/dashboard/CostBadge';
import { CommandPalette } from '@/components/command/CommandPalette';
import { ActivePlanProvider } from '@/lib/activePlanContext';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  return (
    <ActivePlanProvider>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar user={user} />
        </div>

        <CommandPalette />

        {/* Content — no left offset on mobile, offset on md+ */}
        <div className="flex flex-1 flex-col md:pl-60">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-6">
            {/* Hamburger — mobile only */}
            <MobileSidebar user={user} />

            <div className="flex-1" />
            <CostBadge />
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ActivePlanProvider>
  );
}
