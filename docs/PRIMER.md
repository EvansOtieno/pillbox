# Primer: Next.js + Supabase for a Java/Spring/Oracle developer

Short and practical: only what this project uses. Versions at setup (2026-09-30): **Next.js 16.3**, React 19.2,
Tailwind 4, Supabase CLI 2.118 (Postgres 17). Next 16 changed several APIs; the version-matched docs are in
`node_modules/next/dist/docs/` (see `AGENTS.md`).

## 1. The mental map

| Spring / Oracle world | This project |
|---|---|
| Spring MVC `@Controller` + `@GetMapping("/product/{slug}")` + Thymeleaf view | A folder `src/app/product/[slug]/page.tsx` that exports a React component |
| Shared Thymeleaf layout / decorator | `layout.tsx` in a folder wraps every page below it |
| Servlet `Filter` / `HandlerInterceptor` | `src/proxy.ts` (called **middleware** before Next 16; the plan says "middleware", same thing) |
| `@PostMapping` form handler | **Server Action**: an `async` function marked `'use server'`, called straight from a `<form action={...}>` |
| `@Cacheable("products")` / `@CacheEvict` | `'use cache'` + `cacheTag('products')` / `revalidateTag('products', 'max')` or `updateTag(...)` |
| Flyway `V1__init.sql` | `supabase/migrations/<timestamp>_name.sql`, applied by `supabase db reset` / `db push` |
| Spring Data REST (auto REST over tables) | PostgREST: Supabase exposes every table/function over HTTP; `supabase-js` is the client |
| Spring Security `@PreAuthorize` | **Row Level Security** policies inside Postgres (below) |
| Oracle **VPD** (`DBMS_RLS` predicate appended to every query) | RLS: exactly this idea, in Postgres |
| PL/SQL package, `AUTHID DEFINER` (the default) | `create function ... security definer` (Postgres defaults to *invoker* rights) |
| `application-local.properties` | `.env.local` (git-ignored); `.env.example` is the committed template |

## 2. App Router: files are routes
```
src/app/layout.tsx                → wraps everything (<html>, header, dock)
src/app/(shop)/page.tsx           → "/"            (shop) is a route group: organises folders, no URL segment
src/app/(shop)/product/[slug]/page.tsx → "/product/paracetamol-500mg"
src/app/admin/orders/[id]/page.tsx     → "/admin/orders/42"
```
Special files per folder: `page.tsx` (the view), `layout.tsx`, `loading.tsx` (skeleton while data loads),
`error.tsx`, `not-found.tsx`. Route params arrive as a **Promise** (`const { slug } = await params`).

## 3. Server Components vs Client Components
- **Server Components** are the default. They run only on the server, like a controller and template in one: they
  can `await` a DB query directly, and their code never ships to the browser. No `useState`, no click handlers.
- **Client Components** start with `'use client'`. They're the interactive "islands": cart drawer, dock, search box,
  the "open now" badge. They are rendered on the server first, then *hydrated* in the browser.
- Rule of thumb: keep pages as Server Components and push `'use client'` down to the smallest interactive leaf.
  A server component can render a client one and pass it serialisable props (like a DTO), not functions.

## 4. Server Actions: the POST handler
```ts
'use server'
export async function placeOrder(formData: FormData) {
  const input = checkoutSchema.parse(Object.fromEntries(formData)) // zod ≈ Bean Validation
  const { data, error } = await supabase.rpc('place_order', { ... }) // calls our SQL function
  ...
}
```
It looks like a function call, but Next turns it into an HTTP POST endpoint. **Treat it as a public endpoint**:
validate input and never trust prices sent by the browser. That's why `place_order` recalculates prices in SQL.

## 5. Caching and freshness (Next 16 "Cache Components")
Storefront pages are pre-rendered (like a static HTML cache). Data functions opt in:
```ts
async function getProduct(slug: string) {
  'use cache'
  cacheTag('products', `product:${slug}`)
  ...
}
```
When an admin saves a price, the Server Action calls `updateTag('product:x')` (the admin sees the change on
the very next render) or `revalidateTag('products', 'max')` (stale-while-revalidate for everyone else).
That is `@CacheEvict` with named keys. This is also why "open now" is decided **in the browser**: a cached
page can't know the current time.

## 6. Supabase in one paragraph
Supabase is a Postgres database plus services around it: **Auth** (GoTrue: sign-in, issues a JWT),
**PostgREST** (the HTTP API over your schema), **Storage** (S3-like buckets for product images), and **Studio**
(a web admin UI, like SQL Developer). Locally it all runs in Docker (`pnpm db:start`); in the cloud it is one
hosted project. There is no Java service layer in between: the browser/Next server talks to PostgREST with a
JWT, and **Postgres itself decides what that user may see**.

## 7. What's running on your laptop (the local stack)

The project runs as **two separate programs**:
1. **The website (Next.js)** runs directly on Windows via `pnpm dev`, like running a Spring Boot app from the IDE.
   It is **not** in Docker.
2. **The backend (Supabase)** runs in Docker via `pnpm db:start`: Postgres plus the services around it, prepackaged.

A Docker *container* is a small isolated program bundled with everything it needs, started from a downloaded *image*
(that's why the first `supabase start` was slow). The Supabase CLI decides which containers to start and how to
wire them, using `supabase/config.toml`. You never manage them by hand.

```mermaid
flowchart TB
  browser["Your browser"] --> next["Next.js dev server<br/>pnpm dev · :3000 · not in Docker"]
  subgraph docker["Docker Desktop · pnpm db:start"]
    kong["Kong API gateway<br/>:54321 · the one front door"]
    kong --> auth["Auth<br/>logins, JWTs"]
    kong --> rest["REST API (PostgREST)<br/>tables as HTTP"]
    kong --> storage["Storage<br/>product images"]
    kong --> realtime["Realtime<br/>live updates"]
    auth & rest & storage & realtime --> db[("Postgres<br/>:54322 · tables, RLS, SQL")]
    studio["Studio<br/>:54323 · DB admin site"] --> db
    mailpit["Mailpit<br/>:54324 · fake inbox"]
    edge["Edge runtime<br/>unused for now"]
  end
  next --> kong
  browser --> kong
```

| Container (`*_afya-corner`) | What it is | Spring/Oracle comparison | Will you touch it? |
|---|---|---|---|
| `supabase_db` | **Postgres**: all tables, rows, RLS policies, `place_order` | Your Oracle instance | **Yes**, via SQL migrations |
| `supabase_kong` | **API gateway** on :54321; routes `/auth/…`, `/rest/…`, `/storage/…` to the right service | Reverse proxy / Spring Cloud Gateway | No |
| `supabase_auth` | **Login server** (GoTrue): sign-in, issues a JWT; users stored in Postgres | Spring Security login + token issuer | Indirectly (admin login) |
| `supabase_rest` | **PostgREST**: tables/functions become HTTP; `GET /rest/v1/products` → `SELECT`, filtered by RLS for the caller's JWT | Spring Data REST, no Java code | Indirectly, via `supabase-js` |
| `supabase_storage` | **File storage** for product images; permissions are Postgres rows, so RLS applies | S3 bucket / file server | In M4 (image upload) |
| `supabase_realtime` | Pushes DB changes to browsers over websockets | JMS / websocket push | Probably not |
| `supabase_studio` | **Database admin website**, http://127.0.0.1:54323: tables, SQL editor, users, files | SQL Developer in a browser | **Yes**, to look at data |
| `supabase_pg_meta` | Studio's helper that reads the schema | SQL Developer internals | No |
| `supabase_inbucket` (Mailpit) | **Fake inbox**, http://127.0.0.1:54324: local auth emails land here | Mock SMTP server | Sometimes (admin login tests) |
| `supabase_edge_runtime` | Host for Supabase "Edge Functions" (small serverless scripts) | Tiny serverless host | No; Server Actions do this job |

`vector` and `analytics` (log shipping for Studio's log viewer) are **disabled** in `config.toml` because they
crash-loop on Windows.

**One request, end to end** (a shopper opens a product page):
1. Browser asks **Next.js** (:3000) for `/product/paracetamol`.
2. Our page code asks Supabase for the product: request → **Kong** (:54321) → **PostgREST**.
3. PostgREST runs a `SELECT` on **Postgres**; RLS adds its filter (published products only for the public); JSON comes back.
4. Next.js renders HTML and sends it to the browser.

The browser can also call Kong directly (admin login, image upload). That's safe because Postgres enforces RLS on
every query, whoever sends it.

**Day to day:** `pnpm db:stop` stops the containers and keeps your data; `pnpm db:start` brings them back in seconds
(Docker Desktop must be running); `pnpm db:reset` rebuilds the database from the migration files. In the cloud,
Supabase Cloud runs this same set of services and Vercel runs Next.js: same code, different URLs and keys in the
environment variables.

## 8. RLS vs Spring Security
In Spring you secure the *service method*. Here the security lives on the *table*, so it applies no matter which
client asks (web, admin, a curl with the public key):
```sql
alter table orders enable row level security;          -- default: deny everything
create policy "staff read orders" on orders
  for select using (is_staff());                        -- predicate appended to every SELECT
```
- `auth.uid()` returns the id of the signed-in user from the JWT (like `SecurityContextHolder`).
- **anon/publishable key**: public, safe in the browser, and restricted by RLS.
- **service_role/secret key**: bypasses RLS (like connecting as the schema owner). **Server-only, never in git,
  never in a `NEXT_PUBLIC_*` variable.**
- Customers can't `insert into orders` directly. They call `place_order(...)`, a `security definer` function
  that runs with the owner's rights (like a PL/SQL package granted `EXECUTE` to a role). It checks stock, Rx
  class and prices, then inserts. That is the only door.

## 9. Everyday commands
Run these in any terminal opened in the project folder. `pnpm dev` keeps its terminal busy until Ctrl+C,
so use a second tab for everything else.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on http://localhost:3000 (hot reload) |
| `pnpm db:start` / `db:stop` / `db:status` | Local Supabase in Docker; `status` prints URLs and keys |
| `pnpm db:reset` | Drop, re-run all migrations and `seed.sql` (Flyway clean + migrate) |
| `pnpm db:types` | Generate TypeScript types from the schema (like JPA metamodel / jOOQ codegen); run after changing a migration |
| `pnpm seed:generate` | Rebuild `supabase/seed.sql` from `scripts/` (fictional catalogue and content), then `db:reset` |
| `pnpm test` / `test:watch` | Vitest unit tests (JUnit equivalent): pure logic, no database |
| `pnpm test:db` | pgTAP tests inside Postgres (`supabase/tests/`): `place_order` rules, RLS, search |
| `pnpm test:integration` | Vitest against the running local Supabase API: the storefront's real data path |
| `pnpm e2e` | Playwright browser tests (starts the dev server itself) |
| `pnpm lint` / `typecheck` | ESLint / TypeScript compiler check |

Local URLs: API http://127.0.0.1:54321 · Studio http://127.0.0.1:54323 · Mailpit (captured auth emails) http://127.0.0.1:54324 ·
Postgres `postgresql://postgres:postgres@127.0.0.1:54322/postgres` (connect with DBeaver/psql like any DB).
