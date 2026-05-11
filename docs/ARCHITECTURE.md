# MCP Command Center — ARCHITECTURE

> **Status:** v2 (MCP transport revised) | **Last updated:** 2026-05-11

---

## 1. Stack

| Katman | Teknoloji | Sebep |
|---|---|---|
| Framework | Next.js 14 (App Router) | Monolith, free tier optimum |
| Dil | TypeScript strict | Type safety |
| Auth | NextAuth.js v5 | Google + GitHub provider |
| DB | Neon PostgreSQL | Free tier 0.5GB |
| ORM | Prisma 5+ | Schema-first |
| AI SDK | Vercel AI SDK | Multi-provider abstraction |
| AI: Speed | Groq Llama 3.1 8B Instant | Hızlı planning |
| AI: Balanced | Gemini 2.5 Flash | Orta seviye reasoning |
| AI: Quality | Groq Llama 3.3 70B Versatile | Kompleks synthesis |
| GitHub | @octokit/rest | Direct API |
| Brave Search | fetch + Brave Search API | Direct API |
| Memory | Prisma + Postgres | Direct DB |
| UI | shadcn/ui + Tailwind | Compose-able |
| Animation | Framer Motion | Polished motion |
| Visualization | React Flow | Plan graph |
| Command palette | cmdk | Raycast-style |
| Validation | Zod | Type-safe parsing |
| Encryption | Node crypto (AES-256-GCM) | Token storage |
| Deploy | Vercel + Neon | $0/ay |

## 2. Mimari Diyagram

```
┌──────────────────────────────────────────────────┐
│           Next.js 14 (Vercel fra1)               │
│                                                  │
│  ┌──────────────┐      ┌────────────────────┐   │
│  │  React UI    │◄─SSE─│  Route Handlers    │   │
│  │              │      │                    │   │
│  │  Dashboard   │      │  /api/auth/*       │   │
│  │  Cmd+K       │      │  /api/plan         │   │
│  │  React Flow  │      │  /api/execute      │   │
│  │              │      │  /api/step/[id]    │   │
│  │              │      │  /api/status (SSE) │   │
│  │              │      │  /api/tools/*      │   │
│  └──────────────┘      └─────┬──────────────┘   │
└─────────────────────────────┼────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌──────────────┐  ┌──────────┐    ┌─────────────────┐
     │ Neon Postgres│  │ AI APIs  │    │ Tool Backends   │
     │              │  │          │    │                 │
     │ users        │  │ Groq     │    │ GitHub API      │
     │ plans        │  │ Gemini   │    │  (Octokit)      │
     │ steps        │  │          │    │ Brave Search    │
     │ memories     │  │          │    │  (REST)         │
     │ usage_logs   │  │          │    │ Memory          │
     │              │  │          │    │  (Postgres)     │
     └──────────────┘  └──────────┘    └─────────────────┘
```

## 3. Tool Abstraction Layer (MCP-shaped)

### Tool Interface

Her tool MCP `tools/list` ve `tools/call` shape'ini taklit eder:

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema; // MCP format
  execute(input: unknown, context: ToolContext): Promise<ToolResult>;
}

interface ToolContext {
  userId: string;
  planId: string;
  stepId: string;
  githubToken?: string; // encrypted, decrypted at runtime
}

interface ToolResult {
  content: Array<{ type: 'text' | 'json'; data: unknown }>;
  isError?: boolean;
  metadata?: { tokensUsed?: number };
}
```

### Tool Registry

`lib/tools/registry.ts`:
```typescript
export const toolRegistry: Record<string, MCPTool> = {
  'github.list_issues': githubListIssues,
  'github.get_repo': githubGetRepo,
  'github.search_code': githubSearchCode,
  'github.get_file_content': githubGetFile,
  
  'brave-search.web_search': braveWebSearch,
  'brave-search.web_fetch': braveWebFetch,
  
  'memory.recall': memoryRecall,
  'memory.store': memoryStore,
  'memory.list': memoryList,
};
```

### Tool Implementation Pattern

```typescript
// lib/tools/github/listIssues.ts
import { Octokit } from '@octokit/rest';

export const githubListIssues: MCPTool = {
  name: 'github.list_issues',
  description: 'List issues from a GitHub repository',
  inputSchema: {
    type: 'object',
    properties: {
      owner: { type: 'string' },
      repo: { type: 'string' },
      state: { type: 'string', enum: ['open', 'closed', 'all'] },
      perPage: { type: 'number', default: 5 }
    },
    required: ['owner', 'repo']
  },
  async execute(input, ctx) {
    const { owner, repo, state = 'open', perPage = 5 } = input;
    const token = ctx.githubToken ?? process.env.GITHUB_DEMO_TOKEN;
    const octokit = new Octokit({ auth: token });
    
    const { data } = await octokit.issues.listForRepo({
      owner, repo, state, per_page: perPage
    });
    
    return {
      content: [{ type: 'json', data: data.map(i => ({
        number: i.number, title: i.title, state: i.state,
        labels: i.labels.map(l => typeof l === 'string' ? l : l.name)
      }))}]
    };
  }
};
```

## 4. Background Execution Pattern

**Problem:** Vercel Hobby 10s timeout. Multi-tool plan 15-30s.

**Çözüm:** State machine + self-invoking fetch chain.

### Akış

```
1. POST /api/plan
   → Speed agent plan üretir (<10s)
   → DB'ye Plan + Steps (status: PENDING_APPROVAL)
   → planId döner

2. UI [Execute] basar
   POST /api/execute { planId }
   → Plan status: EXECUTING
   → fetch('/api/step/{firstStepId}') // fire-and-forget
   → 200 OK döner

3. /api/step/[id] çalışır
   → Step status: RUNNING
   → Tool veya LLM çağrılır
   → Sonuç DB'ye yazılır
   → Step status: COMPLETED veya FAILED
   → Eğer COMPLETED ve sonraki step varsa:
     fetch('/api/step/{nextStepId}') // fire-and-forget
   → Eğer FAILED:
     Plan status: FAILED, dur
   → Eğer son step:
     Plan status: COMPLETED

4. Client SSE ile durumu izler
   GET /api/status?planId=...
   → Her 1s'de DB query
   → Değişiklik varsa event push
   → Plan tamamlanınca stream kapat
```

### Self-invoking fetch — pratik notlar

```typescript
// app/api/step/[id]/route.ts
export async function POST(req, { params }) {
  const step = await processStep(params.id);
  
  if (step.status === 'COMPLETED' && step.nextStepId) {
    // Fire-and-forget: don't await
    fetch(`${process.env.NEXTAUTH_URL}/api/step/${step.nextStepId}`, {
      method: 'POST',
      headers: { 'x-internal-call': process.env.INTERNAL_SECRET }
    }).catch(() => {}); // silent fail OK, SSE detects
  }
  
  return Response.json({ ok: true });
}
```

**Backup plan:** Vercel Cron her 30sn'de pending step'leri pickup eder (eğer fetch chain kırıldıysa).

## 5. State Machine

**Plan:**
```
DRAFT → PENDING_APPROVAL → EXECUTING → COMPLETED
                       ↓                ↓
                   CANCELLED         FAILED → (retry) → EXECUTING
```

**Step:**
```
PENDING → RUNNING → COMPLETED
               ↓
            FAILED → (retry) → RUNNING
```

## 6. AI Agent Architecture

### Tier Definitions

| Tier | Model | Use Case |
|---|---|---|
| Speed | Groq Llama 3.1 8B Instant | Plan generation, simple synthesis |
| Balanced | Gemini 2.5 Flash | Filtering, extraction |
| Quality | Groq Llama 3.3 70B Versatile | Comparison, deep analysis |

### Auto Mode Logic

```typescript
function selectAgent(stepType: string, promptHint: string): AgentTier {
  if (stepType === 'plan_generation') return 'speed';
  
  const hint = promptHint.toLowerCase();
  if (/(compare|analyze|synthesize|deep)/.test(hint)) return 'quality';
  if (/(filter|extract|format|summarize)/.test(hint)) return 'balanced';
  return 'balanced'; // default
}
```

### Rate Limit Handling

Basit retry-with-backoff:
```typescript
async function callAgent(tier, prompt, retries = 2) {
  try {
    return await agents[tier].generateText({ prompt });
  } catch (e) {
    if (e.status === 429 && retries > 0) {
      await sleep(2000 * (3 - retries));
      return callAgent(tier, prompt, retries - 1);
    }
    throw e;
  }
}
```

## 7. Authentication

- **Primary:** Google OAuth (demo izleyici)
- **Secondary:** GitHub OAuth (developer + token reuse)
- **Session:** JWT, 30 gün
- **GitHub scope:** `read:user, public_repo`

### Token Storage

GitHub OAuth access token → `User.githubToken` (AES-256-GCM encrypted).

GitHub tool çağrılırken decrypt edilir, Octokit'e verilir.

## 8. Multi-tenancy

Row-level isolation, query-level enforcement:

```typescript
// lib/db/withUser.ts
export async function withUser<T>(
  userId: string,
  fn: (uid: string) => Promise<T>
): Promise<T> {
  if (!userId) throw new Error('Unauthorized');
  return fn(userId);
}
```

Tüm tool çağrıları `withUser` wrapper'ından geçer.

## 9. Frontend Layout

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── page.tsx                # Dashboard
│   ├── settings/page.tsx
│   ├── history/page.tsx
│   ├── plans/[id]/page.tsx     # Plan detail
│   └── layout.tsx
├── api/
│   ├── auth/[...nextauth]/route.ts
│   ├── plan/route.ts
│   ├── execute/route.ts
│   ├── step/[id]/route.ts
│   ├── status/route.ts
│   ├── tools/list/route.ts
│   └── tools/resources/route.ts
├── page.tsx                    # Landing
└── layout.tsx

components/
├── ui/                         # shadcn primitives
├── command/
│   ├── CommandPalette.tsx
│   ├── CommandInput.tsx
│   └── ResourceMention.tsx
├── plan/
│   ├── PlanView.tsx
│   ├── PlanStep.tsx
│   └── PlanActions.tsx
├── execution/
│   ├── ExecutionGraph.tsx
│   ├── StepNode.tsx
│   └── ExecutionLog.tsx
├── dashboard/
│   ├── ExampleCommands.tsx
│   ├── ConnectedServers.tsx
│   ├── CostBadge.tsx
│   └── AgentPicker.tsx
└── shared/

lib/
├── db.ts                       # Prisma client
├── auth.ts
├── crypto.ts                   # AES-256-GCM
├── session.ts
├── usage.ts                    # Cost tracking
├── ai/
│   ├── agents.ts
│   └── selectAgent.ts
├── tools/
│   ├── registry.ts
│   ├── types.ts
│   ├── github/
│   ├── braveSearch/
│   └── memory/
├── prompts/
│   ├── planGeneration.ts
│   ├── extraction.ts
│   └── synthesis.ts
├── schemas/
│   ├── plan.ts
│   └── step.ts
└── execution/
    ├── runner.ts
    └── stateMachine.ts
```

## 10. State Management

- **Server state:** TanStack Query
- **Real-time:** SSE via `useExecutionStream`
- **Client state:** Zustand (UI state, palette)
- **Form state:** React Hook Form + Zod

## 11. Animation

- Framer Motion `LayoutGroup` for plan transitions
- `AnimatePresence` for status changes
- Spring physics (no easing curves)
- Stagger for list animations

## 12. Deploy

**Vercel:**
- Project: `mcp-command-center`
- Plan: Hobby (free)
- Region: fra1

**Env vars:**
```
DATABASE_URL
DIRECT_URL
NEXTAUTH_URL
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GROQ_API_KEY
GEMINI_API_KEY
BRAVE_API_KEY
GITHUB_DEMO_TOKEN
ENCRYPTION_KEY
INTERNAL_SECRET
```

**Build:**
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

## 13. Quality Gates

- TypeScript strict
- ESLint pass
- Build pass before merge
- Conventional commits
- Max 200 lines/file (guideline)
- No `any`, no `@ts-ignore`
- All errors caught and logged

## 14. Observability

- Vercel Analytics (free)
- Structured console.log: `{ level, userId, planId, stepId, message }`
- Faz 2: Sentry, Posthog