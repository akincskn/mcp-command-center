'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Database, GitBranch, History, Moon, Search, Settings, Sparkles, Sun } from 'lucide-react';

interface Resource {
  mcpServer: string;
  uri: string;
  name: string;
  type: string;
}

const EXAMPLE_COMMANDS = [
  {
    label: 'Developer Workflow',
    command:
      'List recent issues from akincskn/mcp-command-center, search for similar projects on web, compare findings',
    icon: GitBranch,
  },
  {
    label: 'Research Workflow',
    command: 'Find 5 articles about MCP protocol, extract key insights, save to knowledge base',
    icon: Search,
  },
  {
    label: 'Knowledge Workflow',
    command: 'Recall previous comparison about mcp-command-center, diff with current GitHub state',
    icon: Database,
  },
];

const NAV_ITEMS = [
  { label: 'New Command', href: '/', icon: Sparkles },
  { label: 'History', href: '/history', icon: History },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesFetched, setResourcesFetched] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Fetch resources once when "@" is first typed
  useEffect(() => {
    if (inputValue.includes('@') && !resourcesFetched) {
      setResourcesFetched(true);
      fetch('/api/tools/resources')
        .then((r) => r.json())
        .then((data: { resources?: Resource[] }) => setResources(data.resources ?? []))
        .catch(() => setResources([]));
    }
  }, [inputValue, resourcesFetched]);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) setInputValue('');
  };

  const runCommand = useCallback((action: () => void) => {
    setOpen(false);
    setInputValue('');
    action();
  }, []);

  const runExample = (command: string) =>
    runCommand(() => router.push(`/?cmd=${encodeURIComponent(command)}`));

  const showResources = inputValue.includes('@');

  // Manual filtering for normal mode (cmdk filter disabled via shouldFilter={false})
  const query = showResources ? '' : inputValue.toLowerCase();
  const visibleExamples = query
    ? EXAMPLE_COMMANDS.filter(
        (ex) =>
          ex.label.toLowerCase().includes(query) ||
          ex.command.toLowerCase().includes(query)
      )
    : EXAMPLE_COMMANDS;
  const visibleNavItems = query
    ? NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(query))
    : NAV_ITEMS;
  const hasNoResults = !showResources && query && visibleExamples.length === 0 && visibleNavItems.length === 0;

  return (
    // shouldFilter={false}: cmdk's built-in filter is disabled so "@" doesn't hide resource items.
    // We do our own substring filtering for the normal (non-@) mode.
    <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Type a command or search... (@ for resources)"
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        {hasNoResults && (
          <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
        )}

        {showResources ? (
          <CommandGroup heading="Resources">
            {resources.length === 0 ? (
              <CommandItem disabled value="loading">
                Fetching resources…
              </CommandItem>
            ) : (
              resources.map((r) => (
                <CommandItem key={r.uri} value={r.uri} onSelect={() => runExample(`@${r.name}`)}>
                  {r.mcpServer === 'github' ? (
                    <GitBranch className="mr-2 h-4 w-4" />
                  ) : (
                    <Database className="mr-2 h-4 w-4" />
                  )}
                  <span>{r.name}</span>
                  <CommandShortcut>{r.type}</CommandShortcut>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        ) : (
          <>
            {visibleExamples.length > 0 && (
              <CommandGroup heading="Example Commands">
                {visibleExamples.map((ex) => (
                  <CommandItem
                    key={ex.label}
                    value={ex.label}
                    onSelect={() => runExample(ex.command)}
                  >
                    <ex.icon className="mr-2 h-4 w-4" />
                    <span>{ex.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {visibleNavItems.length > 0 && (
              <>
                {visibleExamples.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Navigation">
                  {visibleNavItems.map((item) => (
                    <CommandItem
                      key={item.href}
                      value={item.label}
                      onSelect={() => runCommand(() => router.push(item.href))}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            <CommandSeparator />

            <CommandGroup heading="Preferences">
              <CommandItem
                value="toggle-theme"
                onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : (
                  <Moon className="mr-2 h-4 w-4" />
                )}
                <span>Toggle Theme</span>
                <CommandShortcut>{theme === 'dark' ? 'Light' : 'Dark'}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
