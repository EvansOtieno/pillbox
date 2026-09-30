# Afya Corner

A demo pharmacy shop (fictional brand, fictional data) built with **Next.js 16** (App Router, TypeScript, Tailwind)
and **Supabase** (Postgres, Auth, Storage, Row Level Security). Portfolio/learning project.

- Primer for Java/Spring developers: [`docs/PRIMER.md`](docs/PRIMER.md)

## Run locally
Requires Node 20+, pnpm (`corepack enable`) and Docker Desktop.

```bash
pnpm install
pnpm db:start          # local Supabase in Docker; copy the printed keys into .env.local (see .env.example)
pnpm dev               # http://localhost:3000
```

Tests: `pnpm test` (Vitest) · `pnpm e2e` (Playwright) · `pnpm lint` · `pnpm typecheck`.
