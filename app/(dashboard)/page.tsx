import { auth } from '@/auth';
import { PageTransition } from '@/components/shared/PageTransition';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GitBranch, Search, Brain, ArrowRight } from 'lucide-react';

const exampleScenarios = [
  {
    id: 'A',
    title: 'Competitor Analysis',
    description:
      'Compare akincskn/rivalradar with similar repos and summarize key differences.',
    icon: GitBranch,
  },
  {
    id: 'B',
    title: 'Web Research',
    description:
      'Search for the latest AI tool integrations and compile a briefing.',
    icon: Search,
  },
  {
    id: 'C',
    title: 'Knowledge Workflow',
    description:
      'Recall past analysis and run a follow-up comparison with new data.',
    icon: Brain,
  },
];

const connectedServers = [
  { label: 'GitHub', color: 'bg-primary/10 text-primary border-primary/20' },
  {
    label: 'Brave Search',
    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  {
    label: 'Memory',
    color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-10">
        {/* Hero */}
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground">
            What do you want to do today?
          </p>
        </div>

        {/* Command input placeholder */}
        <div className="relative">
          <Input
            placeholder="Describe a task… (Cmd+K to open palette)"
            className="h-12 bg-card pr-12 text-sm"
            readOnly
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        {/* Example commands */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Example Commands
          </h2>
          <div className="grid gap-3">
            {exampleScenarios.map((s, i) => (
              <Card
                key={s.id}
                className="group cursor-pointer border-border bg-card transition-colors hover:border-primary/30 hover:bg-card/80"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardHeader className="flex-row items-center gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium">
                      Scenario {s.id} — {s.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5 line-clamp-1">
                      {s.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Connected servers */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Connected Servers
          </h2>
          <div className="flex flex-wrap gap-2">
            {connectedServers.map((s) => (
              <span
                key={s.label}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${s.color}`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
