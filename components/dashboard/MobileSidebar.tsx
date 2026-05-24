'use client';

import { useState } from 'react';
import { Menu, Terminal } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { NavLinks } from './NavLinks';
import { UserMenu } from './UserMenu';

interface MobileSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function MobileSidebar({ user }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9 -ml-1"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <SheetContent
        side="left"
        className="flex w-60 flex-col p-0 bg-card"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SheetDescription className="sr-only">
          Main navigation links for the dashboard
        </SheetDescription>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 px-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">MCP Command Center</span>
        </div>

        <Separator />

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4" onClick={() => setOpen(false)}>
          <NavLinks />
        </div>

        <Separator />

        {/* User */}
        <div className="p-3">
          <UserMenu user={user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
