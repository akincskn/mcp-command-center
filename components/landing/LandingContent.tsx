'use client';

import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/actions/auth';
import { easeOut } from '@/lib/motion';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

const FEATURES = [
  {
    n: '01',
    title: 'Plan-then-execute',
    desc: 'Every command becomes a structured plan you review before anything runs. No black-box surprises.',
  },
  {
    n: '02',
    title: 'Multi-tool orchestration',
    desc: 'GitHub, Tavily, and Memory work in a single coordinated flow. One command, many tools.',
  },
  {
    n: '03',
    title: 'Live execution graph',
    desc: 'Each step streams in real time. Token costs tracked per step, errors surfaced immediately.',
  },
] as const;

const DEMO_STEPS = [
  { label: 'Fetch recent GitHub issues', status: 'done', cost: '$0.001' },
  { label: 'Search web via Tavily', status: 'done', cost: '$0.003' },
  { label: 'Analyze and compare results', status: 'running', cost: null },
  { label: 'Save summary to memory', status: 'pending', cost: null },
] as const;

function StepDot({ status }: { status: 'done' | 'running' | 'pending' }) {
  if (status === 'done')
    return <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />;
  if (status === 'running')
    return (
      <span
        className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400 animate-pulse"
        aria-hidden="true"
      />
    );
  return <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-zinc-700" aria-hidden="true" />;
}

export function LandingContent() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
            <Terminal className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight">MCP Command Center</span>
        </div>
        <a
          href="/login"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Sign in
        </a>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl space-y-10">
          {/* Hero */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...easeOut, delay: 0 }}
              className="space-y-3"
            >
              <p className="font-mono text-xs tracking-widest text-primary/70 uppercase">
                MCP Ecosystem
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-balance leading-snug">
                Plan-then-execute orchestration for AI tools.
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...easeOut, delay: 0.06 }}
              className="text-base leading-relaxed text-muted-foreground"
            >
              Type a command in plain language. The AI builds a structured step-by-step plan.
              GitHub, Tavily, and Memory execute each step while you watch it happen live.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...easeOut, delay: 0.11 }}
              className="space-y-2"
            >
              <form action={signInWithGoogle}>
                <Button
                  type="submit"
                  size="lg"
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <GoogleIcon />
                  Sign in with Google
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Demo mode · No production data stored
              </p>
            </motion.div>
          </div>

          {/* Demo preview */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...easeOut, delay: 0.17 }}
            className="rounded-xl border border-border bg-card/50 p-5 space-y-4"
            aria-label="Demo preview"
          >
            <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
              <p className="font-mono text-sm text-muted-foreground line-clamp-2">
                List recent issues from akincskn/mcp-command-center, search the web for similar AI
                orchestration tools, and summarize how they compare
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                Execution Plan
              </p>
              {DEMO_STEPS.map((step) => (
                <div key={step.label} className="flex items-start gap-3">
                  <StepDot status={step.status} />
                  <span
                    className={`flex-1 text-sm ${step.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'}`}
                  >
                    {step.label}
                  </span>
                  {step.cost && (
                    <span className="font-mono text-xs text-muted-foreground">{step.cost}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...easeOut, delay: 0.24 }}
            className="divide-y divide-border/50"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.n}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...easeOut, delay: 0.26 + i * 0.06 }}
                className="flex gap-6 py-5"
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-primary/50">{f.n}</span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-border/40 px-6 py-4 text-xs text-muted-foreground">
        <span>Built by Akın Coşkun</span>
        <a
          href="https://github.com/akincskn/mcp-command-center"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 fill-current"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          akincskn/mcp-command-center
        </a>
      </footer>
    </div>
  );
}
