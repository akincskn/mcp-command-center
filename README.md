# MCP Command Center

> Plan-then-execute AI orchestration for the MCP ecosystem.

Natural language commands → execution plan → multi-tool chain → live visualization.

## Stack

- **Framework:** Next.js 16 App Router, TypeScript strict
- **Auth:** NextAuth.js v5 (Google + GitHub)
- **DB:** Neon PostgreSQL + Prisma
- **AI:** Vercel AI SDK (Groq + Gemini)
- **Tools:** GitHub (Octokit), Brave Search, Memory (Postgres)
- **UI:** shadcn/ui, Tailwind CSS v4, Framer Motion, React Flow
- **Deploy:** Vercel + Neon ($0/mo)

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/akincskn/mcp-command-center
cd mcp-command-center
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in all values in .env.local

# 3. Database
npm run db:migrate

# 4. Run
npm run dev
```

## Demo

Live: [mcp-command-center.vercel.app](https://mcp-command-center.vercel.app)

## License

MIT
