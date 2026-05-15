import { Terminal } from 'lucide-react';
import { NavLinks } from './NavLinks';
import { UserMenu } from './UserMenu';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-6">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
          <Terminal className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          MCP Command Center
        </span>
      </div>

      <Separator />

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks />
      </div>

      <Separator />

      {/* User */}
      <div className="p-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
