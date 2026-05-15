import { defineConfig } from "prisma/config";

// DIRECT_URL (port 5432) for CLI: migrate + studio
// DATABASE_URL (port 6543, pooled) used at runtime via Neon adapter in lib/db.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"]!,
  },
});
