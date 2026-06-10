// Startup environment validation.
// Imported by lib/db.ts so any server entrypoint that touches the database
// fails fast (at import time) when a required secret is missing — this also
// removes the "Bearer undefined" bypass class where an unset secret becomes a
// guessable literal in an auth comparison.

const required = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'ENCRYPTION_KEY',
  'INTERNAL_SECRET',
  'CRON_SECRET',
  'GROQ_API_KEY',
  'TAVILY_API_KEY',
  'GITHUB_DEMO_TOKEN',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;

export function validateEnv(): void {
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

// Auto-validate on the server at import time. Guarded so it never runs in the
// browser bundle.
if (typeof window === 'undefined') {
  validateEnv();
}
