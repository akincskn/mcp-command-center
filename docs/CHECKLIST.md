# MCP Command Center — BUILD CHECKLIST

> **Status:** v2 | **Last updated:** 2026-05-11

Bu döküman adım adım build sırasıdır. Her phase tamamlanmadan bir sonrakine geçilmez. Her phase sonunda build test + git commit yapılır.

---

## Phase 0 — Project Setup (1-2 saat)

- [ ] Next.js 14 project init: `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-git`
- [ ] TypeScript strict: `tsconfig.json` → `"strict": true`, `"noUncheckedIndexedAccess": true`
- [ ] ESLint: `next/core-web-vitals` + prettier
- [ ] Prettier: `.prettierrc.json`
- [ ] Git init + GitHub repo: `mcp-command-center`
- [ ] `.gitignore` complete (.env.local, node_modules, .next, prisma migrations lock)
- [ ] `.env.example` tüm env var'larla
- [ ] `package.json` scripts: dev, build, lint, type-check, db:migrate, db:studio
- [ ] README.md placeholder

**Test:** `npm run dev` → http://localhost:3000 açılır  
**Commit:** `chore: initial project setup`

---

## Phase 1 — Database Foundation (2-3 saat)

- [ ] Prisma install: `npm i prisma @prisma/client @neondatabase/serverless @prisma/adapter-neon`
- [ ] `npx prisma init`
- [ ] Neon project oluştur (free, eu-central-1)
- [ ] `DATABASE_URL` + `DIRECT_URL` `.env.local`'e
- [ ] DATABASE.md'deki modelleri `schema.prisma`'ya yaz
- [ ] `npx prisma migrate dev --name init`
- [ ] Prisma Client singleton: `lib/db.ts`
- [ ] Encryption helper: `lib/crypto.ts` (AES-256-GCM)
- [ ] `ENCRYPTION_KEY` generate + `.env.local`'e

**Test:** `npx prisma studio` → tüm tablolar görünür  
**Commit:** `feat: prisma schema and database setup`

---

## Phase 2 — Authentication (3-4 saat)

- [ ] NextAuth.js v5: `npm i next-auth@beta @auth/prisma-adapter`
- [ ] `auth.config.ts` (Edge-compatible)
- [ ] `auth.ts` (server-only)
- [ ] `middleware.ts` (route protection)
- [ ] Google OAuth credentials (Google Cloud Console)
- [ ] GitHub OAuth credentials (GitHub Developer Settings)
- [ ] Login page: `app/(auth)/login/page.tsx`
- [ ] `signIn` event → user seed (agent pref + seeded memory)
- [ ] Session helper: `lib/session.ts`
- [ ] Auth guard middleware

**Test:** Google login → user DB'de oluşur, seeded memory eklenir, dashboard redirect  
**Commit:** `feat: authentication with google and github oauth`

---

## Phase 3 — UI Foundation (4-5 saat)

- [ ] shadcn/ui setup: `npx shadcn@latest init` (dark default)
- [ ] Base components: button, input, dialog, dropdown, badge, card, toast, tabs, popover
- [ ] Theme provider (dark default)
- [ ] Layout: `app/(dashboard)/layout.tsx` (sidebar + main)
- [ ] Sidebar: logo + nav + user menu
- [ ] Empty dashboard placeholder
- [ ] Font: Geist Sans + Geist Mono
- [ ] Color tokens: zinc-950 bg, zinc-50 text, emerald-400 accent
- [ ] Framer Motion install + page transition
- [ ] Sonner toast setup

**Test:** Login sonrası dashboard layout görünür, dark mode default  
**Commit:** `feat: dashboard layout and design system`

---

## Phase 4 — AI Provider Layer (3-4 saat)

- [ ] Vercel AI SDK: `npm i ai @ai-sdk/groq @ai-sdk/google`
- [ ] Groq + Gemini API key env'e
- [ ] Agent abstraction: `lib/ai/agents.ts` (3 tier)
- [ ] Plan generation prompt: `lib/prompts/planGeneration.ts` (PROMPTS.md'den)
- [ ] Plan Zod schema: `lib/schemas/plan.ts`
- [ ] Test endpoint: `/api/test/plan` — hardcoded command
- [ ] Usage log helper: `lib/usage.ts`

**Test:** curl `/api/test/plan` → valid plan JSON, UsageLog yazılır  
**Commit:** `feat: ai provider layer with plan generation`

---

## Phase 5 — Tool Abstraction Layer (5-7 saat)

> **DİKKAT:** MCP transport revize edildi. Subprocess YOK. Direkt API kullanıyoruz.

- [ ] Tool interface: `lib/tools/types.ts`
- [ ] Tool registry: `lib/tools/registry.ts`
- [ ] GitHub tools: `lib/tools/github/` (Octokit-based)
  - [ ] `npm i @octokit/rest`
  - [ ] list_issues, get_repo, search_code, get_file_content
- [ ] Tavily tools: `lib/tools/tavily/`
  - [ ] TAVILY_API_KEY env
  - [ ] web_search, web_fetch
- [ ] Memory tools: `lib/tools/memory/`
  - [ ] Prisma-based, user-isolated namespace
  - [ ] recall, store, list
- [ ] Test endpoint: `/api/test/tools/[name]` per tool
- [ ] Resource listing: `/api/tools/resources` (15dk cache)
- [ ] Error handling per tool

**Test:**
- GitHub → `list_issues` `akincskn/rivalradar` → real data
- Tavily → "test query" → results
- Memory → store + recall round-trip

**Commit:** `feat: mcp-shaped tool abstraction layer`

---

## Phase 6 — Plan Generation Endpoint (2-3 saat)

- [ ] `app/api/plan/route.ts` POST
- [ ] Auth check → user context
- [ ] Command → Speed agent → Plan JSON
- [ ] Plan + Steps DB'ye yaz
- [ ] planId döndür
- [ ] Error handling (Zod fail → retry; LLM fail → user message)

**Test:** UI'dan komut → `/api/plan` → DB'de Plan + Steps  
**Commit:** `feat: plan generation endpoint`

---

## Phase 7 — Plan View UI (3-4 saat)

- [ ] `components/plan/PlanView.tsx`
- [ ] `components/plan/PlanStep.tsx`
- [ ] `components/plan/PlanActions.tsx`
- [ ] Step icons (lucide): GitHub, Search, Brain, Database
- [ ] Token + duration display
- [ ] Animated entry (Framer Motion stagger)
- [ ] TanStack Query setup
- [ ] `useCreatePlan` mutation
- [ ] `usePlan(planId)` query

**Test:** Komut yaz → plan UI'da, [Execute] var (fonksiyonsuz)  
**Commit:** `feat: plan view ui with animations`

---

## Phase 8 — Background Execution Engine (6-8 saat) ⚠️ EN KARMAŞIK

- [ ] `app/api/execute/route.ts` POST: planId → başlat
- [ ] `app/api/step/[id]/route.ts` single step
- [ ] Step executor: `lib/execution/runner.ts`
  - [ ] TOOL_CALL handler: tool registry call
  - [ ] LLM_STEP handler: agent + previous context
- [ ] Self-invoking pattern: step bitince fetch next-step
- [ ] State transitions: PENDING → RUNNING → COMPLETED/FAILED
- [ ] Plan aggregate state update
- [ ] Retry logic: failed step → retry button
- [ ] Cost calculation per step
- [ ] Internal secret header check

**Test:** Execute → step'ler sırayla çalışır, state ilerler, final result var  
**Commit:** `feat: background execution engine`

---

## Phase 9 — SSE Status Stream (3-4 saat)

- [ ] `app/api/status/route.ts` SSE (planId query)
- [ ] Polling fallback (her 1s DB query) → SSE push
- [ ] Client hook: `useExecutionStream(planId)` EventSource
- [ ] PlanView live status binding
- [ ] Status değişikliği animasyonu (AnimatePresence)
- [ ] Token counter live update

**Test:** Execute → UI canlı RUNNING → COMPLETED  
**Commit:** `feat: server-sent events for live execution status`

---

## Phase 10 — React Flow Execution Graph (4-5 saat)

- [ ] React Flow: `npm i reactflow`
- [ ] `components/execution/ExecutionGraph.tsx`
- [ ] Custom node: `StepNode.tsx` (status colors, icons, tokens)
- [ ] Edge animations (animated while RUNNING)
- [ ] Auto-layout: dagre/elk vertical flow
- [ ] Zoom/pan controls
- [ ] Click step → detail panel (input/output)

**Test:** Execute → graph node'ları sırayla yeşil olur, animated edges  
**Commit:** `feat: react flow execution graph`

---

## Phase 11 — Command Palette + Input (4-5 saat)

- [ ] cmdk: `npm i cmdk`
- [ ] `components/command/CommandPalette.tsx` Cmd+K
- [ ] Recent commands (last 10) DB query
- [ ] Example commands (3 hardcoded senaryo)
- [ ] Agent picker dropdown
- [ ] Main input on dashboard
- [ ] `@` autocomplete:
  - [ ] Trigger detection
  - [ ] Resource cache query
  - [ ] Mention component (chip)
- [ ] Submit → `/api/plan` → plan view

**Test:** Cmd+K → example tıklanır → @ ile resource eklenir → plan üretilir  
**Commit:** `feat: command palette with resource autocomplete`

---

## Phase 12 — Cost Dashboard + Settings (3-4 saat)

- [ ] `components/dashboard/CostBadge.tsx` top-right
- [ ] Popover: pie chart (agent breakdown)
- [ ] Recent 10 plans timeline
- [ ] `app/(dashboard)/settings/page.tsx`
- [ ] Agent preference selector
- [ ] Connected tools list
- [ ] GitHub disconnect/reconnect
- [ ] Theme toggle

**Test:** Settings → agent değiştir → yeni plan kullanır; cost gerçek değer  
**Commit:** `feat: cost dashboard and settings`

---

## Phase 13 — Demo Polish (4-5 saat)

- [ ] Landing: `app/page.tsx` minimal hero + login CTA
- [ ] Onboarding tour (Framer Motion custom)
- [ ] Empty states (skeletons)
- [ ] Error states (toast + recovery)
- [ ] Loading animations
- [ ] Keyboard shortcuts overlay (`?`)
- [ ] Mobile responsive (basic)
- [ ] Favicon + OG image

**Test:** Yeni user incognito → onboarding → 1dk'da ilk komut  
**Commit:** `feat: demo polish and onboarding`

---

## Phase 14 — Production Deploy (2-3 saat)

- [ ] Vercel project (GitHub bağla)
- [ ] Env var'lar Vercel'e
- [ ] Build: `prisma generate && prisma migrate deploy && next build`
- [ ] Region: fra1
- [ ] Domain: `mcp-command-center.vercel.app`
- [ ] Google OAuth redirect URI production
- [ ] GitHub OAuth callback URL production
- [ ] Vercel Analytics enable
- [ ] Production smoke test (3 senaryo)

**Test:** Production URL'de 3 senaryo çalışır, $0  
**Commit:** `chore: production deployment`

---

## Phase 15 — Final QA + Portfolio (2-3 saat)

- [ ] 3 senaryoyu 5'er kez çalıştır → consistency
- [ ] Console error'lar temizle
- [ ] Lighthouse audit (Performance > 80)
- [ ] README.md final (screenshots, demo link, stack)
- [ ] Portfolio site'a ekle (akin-coskun.web.app)
- [ ] LinkedIn post + Dev.to article draft
- [ ] Upwork portfolio item

**Test:** Portfolio'dan demo link → çalışır  
**Commit:** `docs: readme and portfolio integration`

---

## Total Effort

| Phase | Süre |
|---|---|
| 0-2 | 6-9 saat |
| 3-5 | 12-16 saat |
| 6-8 | 11-15 saat |
| 9-11 | 11-14 saat |
| 12-15 | 11-15 saat |
| **TOPLAM** | **51-69 saat** |

Part-time (15-20h/hafta): 3-4 hafta  
Full-time (35h+/hafta): 1.5-2 hafta

---

## Risk Flags

- ⚠️ **Phase 5:** Tool abstraction yeni, MCP-shaped interface ilk kez. +30% time.
- ⚠️ **Phase 8:** Self-invoking fetch Vercel'de tutarsız olabilir. Cron fallback hazır.
- ⚠️ **Phase 10:** React Flow animation tuning uzun. "Yeterince iyi" eşiği koy.
- ⚠️ **Phase 13:** Polish trap. 5 saat hard cap.

---

## Definition of Done

Her phase için:
1. ✅ TypeScript build PASS (`npm run build`)
2. ✅ ESLint PASS (`npm run lint`)
3. ✅ Manuel test geçti
4. ✅ Git commit pushed
5. ✅ Vercel preview deploy yeşil (Phase 2+)

**Phase fail ederse:** Bir sonrakine geçme. 2 saat geçti çakıldıysan → benimle (mentor) tartış.