# MCP Command Center

AI-powered task orchestration dashboard — natural language to multi-step execution plans.

## Stack

- **Framework:** Next.js 14.2.x (App Router) — pinned for ecosystem maturity
- **Language:** TypeScript strict
- **Auth:** NextAuth.js v5 (Google + GitHub)
- **Database:** Neon PostgreSQL via Prisma 5
- **AI:** Vercel AI SDK (Groq + Gemini)
- **UI:** shadcn/ui + Tailwind CSS v3

## Getting Started

```bash
cp .env.example .env.local
# fill in your values

npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check (no emit) |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## Docs

See [`docs/`](./docs/) for architecture, database schema, and vision.
