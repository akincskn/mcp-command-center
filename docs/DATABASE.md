# MCP Command Center — DATABASE

> **Status:** v2 | **Last updated:** 2026-05-11

---

## 1. Overview

- **Engine:** PostgreSQL 16 (Neon)
- **ORM:** Prisma 5+
- **Migration:** `prisma migrate dev` (local) → `prisma migrate deploy` (Vercel build)
- **Connection:** Neon serverless adapter
- **Region:** eu-central-1

## 2. Connection Strategy

Two connection strings:
- `DATABASE_URL` → pooled (port 6543) for queries
- `DIRECT_URL` → direct (port 5432) for migrations

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 3. Full Schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

// ============ Auth (NextAuth) ============

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  image           String?
  emailVerified   DateTime?
  
  githubToken     String?   // encrypted
  githubUsername  String?
  agentPreference String    @default("auto")
  
  accounts        Account[]
  sessions        Session[]
  plans           Plan[]
  memories        Memory[]
  usageLogs       UsageLog[]
  apiKeys         UserApiKey[]
  resourceCache   McpResourceCache[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([email])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
}

// ============ Core Domain ============

model Plan {
  id          String     @id @default(cuid())
  userId      String
  
  command     String     @db.Text
  description String?    @db.Text
  
  status      PlanStatus @default(PENDING_APPROVAL)
  agentMode   String     @default("auto")
  
  totalTokens     Int     @default(0)
  totalCostUsd    Decimal @default(0) @db.Decimal(10, 6)
  
  estimatedDuration Int?
  actualDuration    Int?
  
  startedAt    DateTime?
  completedAt  DateTime?
  failedAt     DateTime?
  errorMessage String?    @db.Text
  
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  steps     Step[]
  usageLogs UsageLog[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId, status])
  @@index([userId, createdAt(sort: Desc)])
}

enum PlanStatus {
  PENDING_APPROVAL
  EXECUTING
  COMPLETED
  FAILED
  CANCELLED
}

model Step {
  id          String     @id @default(cuid())
  planId      String
  
  order       Int
  title       String
  description String     @db.Text
  
  type        StepType
  
  // For TOOL_CALL
  toolName    String?
  toolInput   Json?
  
  // For LLM_STEP
  agentTier   String?
  promptHint  String?
  
  // Result
  output      Json?
  
  status      StepStatus @default(PENDING)
  
  inputTokens  Int      @default(0)
  outputTokens Int      @default(0)
  costUsd      Decimal  @default(0) @db.Decimal(10, 6)
  
  startedAt    DateTime?
  completedAt  DateTime?
  duration     Int?
  
  errorMessage String?  @db.Text
  retryCount   Int      @default(0)
  
  plan Plan @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  @@unique([planId, order])
  @@index([planId])
  @@index([status])
}

enum StepType {
  TOOL_CALL
  LLM_STEP
}

enum StepStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  SKIPPED
}

model Memory {
  id         String   @id @default(cuid())
  userId     String
  
  namespace  String   @default("default")
  key        String
  value      Json
  
  tags       String[]
  source     String?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, namespace, key])
  @@index([userId, namespace])
  @@index([userId, createdAt(sort: Desc)])
}

model UsageLog {
  id           String   @id @default(cuid())
  userId       String
  planId       String?
  
  provider     String
  model        String?
  operation    String
  
  inputTokens  Int     @default(0)
  outputTokens Int     @default(0)
  costUsd      Decimal @default(0) @db.Decimal(10, 6)
  
  durationMs   Int?
  success      Boolean @default(true)
  errorMessage String? @db.Text
  
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan Plan? @relation(fields: [planId], references: [id], onDelete: SetNull)
  
  createdAt DateTime @default(now())
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([planId])
}

model UserApiKey {
  id           String   @id @default(cuid())
  userId       String
  
  provider     String
  keyEncrypted String   @db.Text
  keyHint      String
  
  isActive     Boolean  @default(true)
  lastUsedAt   DateTime?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([userId, provider])
  @@index([userId])
}

model McpResourceCache {
  id        String   @id @default(cuid())
  userId    String
  
  mcpServer String
  uri       String
  name      String
  type      String
  metadata  Json?
  
  expiresAt DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  // mcpServer values: "github", "tavily", "memory"
  @@unique([userId, mcpServer, uri])
  @@index([userId, mcpServer])
  @@index([expiresAt])
}
```

## 4. Encryption

- **Algorithm:** AES-256-GCM
- **Format:** `<iv_base64>:<authTag_base64>:<ciphertext_base64>`
- **Master key:** `ENCRYPTION_KEY` env var (32 byte base64)
- **Encrypted fields:** `User.githubToken`, `UserApiKey.keyEncrypted`

## 5. Seeding (Auto on signup)

NextAuth `events.signIn`:

```typescript
events: {
  async createUser({ user }) {
    await db.memory.create({
      data: {
        userId: user.id,
        namespace: 'default',
        key: 'mcp-command-center-roadmap-seed',
        value: {
          summary: "Previous analysis of mcp-command-center roadmap and open issues",
          repos: ["competitor-orchestrator-1", "competitor-orchestrator-2"],
          keyFindings: [
            "MCP Command Center has stronger plan-then-execute UX",
            "Competitor-1 lacks multi-agent routing",
            "Competitor-2 doesn't expose cost transparency"
          ],
          timestamp: "2026-05-01T10:00:00Z"
        },
        tags: ["roadmap", "mcp-command-center", "demo-seed"],
        source: "seed"
      }
    });
  }
}
```

## 6. Migration Workflow

**Local:**
```bash
npx prisma migrate dev --name descriptive_name
```

**Production (Vercel):**
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

## 7. Connection Pool

Neon serverless adapter:

```typescript
// lib/db.ts
import { neon } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

const sql = neon(process.env.DATABASE_URL!);
const adapter = new PrismaNeon(sql);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

## 8. Retention

Faz 1: yok. Faz 2: failed plans 30 gün, completed 90 gün, logs 1 yıl.

## 9. Schema Evolution Rules

1. No breaking changes in production
2. New columns nullable or default
3. Migrations tested on dev branch first
4. Reverse SQL planned for rollback