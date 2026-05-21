'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandEmpty,
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

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Type a command or search... (@ for resources)"
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {showResources ? (
          <CommandGroup heading="Resources">
            {resources.length === 0 ? (
              <CommandItem disabled>Fetching resources…</CommandItem>
            ) : (
              resources.map((r) => (
                <CommandItem key={r.uri} onSelect={() => runExample(`@${r.name}`)}>
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
            <CommandGroup heading="Example Commands">
              {EXAMPLE_COMMANDS.map((ex) => (
                <CommandItem key={ex.label} onSelect={() => runExample(ex.command)}>
                  <ex.icon className="mr-2 h-4 w-4" />
                  <span>{ex.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                <Sparkles className="mr-2 h-4 w-4" />
                <span>New Command</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/history'))}>
                <History className="mr-2 h-4 w-4" />
                <span>History</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Preferences">
              <CommandItem
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
