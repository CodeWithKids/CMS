# CWK Hub API

Node.js + Express + TypeScript backend implementing the [API contracts](../../docs/API_CONTRACTS.md) for auth, learners, classes, sessions, finance, and organisations. Data is stored in **PostgreSQL** via Prisma.

## Setup (PostgreSQL)

1. Create a PostgreSQL database (e.g. `cwk_hub`).
2. Copy env and set your connection string:
   ```bash
   cp .env.example .env
   # Edit .env: set DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
   ```
3. Run migrations and seed:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npx prisma db seed
   ```
   Passwords in the seed are hashed with bcrypt (dev password: `password`). If you already had a DB with plain passwords, re-run `npx prisma db seed` after pulling the bcrypt changes.

## Run locally

```bash
cd server
npm run dev    # tsx watch (recommended)
# or
npx tsx src/index.ts
```

Server listens on **http://localhost:3001** (override with `PORT`). Ensure `DATABASE_URL` is set in `.env`.

## Database commands

| Command | Description |
|--------|-------------|
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:push` | Push schema without migration (prototype) |
| `npm run db:seed` | Seed database with initial data |

## Endpoints

| Area | Methods | Path |
|------|--------|------|
| Health | GET | `/health` |
| Auth | POST | `/v1/auth/login` |
| Auth | GET | `/v1/auth/me` (Bearer token) |
| Auth | POST | `/v1/auth/logout` |
| Terms | GET | `/v1/terms`, `/v1/terms/current` |
| Learners | GET | `/v1/learners`, `/v1/learners/:id` |
| Classes | GET | `/v1/classes`, `/v1/classes/:id` |
| Sessions | GET | `/v1/sessions`, `/v1/sessions/:id` |
| Finance | GET | `/v1/finance/invoices`, `/v1/finance/invoices/:id` |
| Finance | GET, POST | `/v1/finance/invoices/:id/payments` |
| Organisations | GET | `/v1/organisations/:id`, `.../learners`, `.../invoices` |

## Auth

- **Login:** `POST /v1/auth/login` with `{ "email": "...", "password": "..." }`. All seeded users have password `password`.
- **Protected routes:** Send `Authorization: Bearer <accessToken>`.
- **JWT secret:** Set `JWT_SECRET` in production on the API host. The app will not start in production if `JWT_SECRET` is missing or still the dev default.

## Data

PostgreSQL via Prisma. Schema in `prisma/schema.prisma`. Seed data in `prisma/seed.ts` (users, terms, learners, classes, sessions, organisations, invoices, payments). All seeded users have password `password` for development.

## Frontend

Point the frontend API base URL to `http://localhost:3001` (e.g. via env or a shared config) and use the same paths under `/v1`.

For a **production** SPA (e.g. on Vercel at `https://app.codewithkids.africa`), set the frontend `VITE_API_URL` to this API’s **HTTPS** base URL. CORS is enforced **here on the API**, not on Vercel.

## Full-stack Hub (SPA + API)

For **full Hub behaviour**—admin overview (`GET /v1/admin/overview`), pending signups, hybrid admin routes, finance aggregates, and other `/v1` features—the browser app and this server must be configured together.

### Client (Vite SPA, repo root `.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL (auth and data client). |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (with the URL, enables Supabase in the SPA). |
| `VITE_API_URL` | Base URL of **this** Express API, including **scheme and port** (e.g. `http://localhost:3001` or `https://api.example.com`). If unset, the SPA treats the API as disabled (`isApiEnabled()` is false) and many flows fall back to mocks or Supabase-only paths. |

**Rebuild or restart** the Vite dev server after changing any `VITE_*` variable; production builds must be **rebuilt** so `import.meta.env` is updated.

### CORS (this API)

- **Development** (`NODE_ENV` not `production`): the API uses a permissive CORS policy and **allows any browser origin** (see `src/config/corsOrigins.ts`). You usually do not need `CORS_ORIGIN` locally.
- **Production**: the allow-list is **`CORS_ORIGIN`** (comma-separated origins, no trailing slash) or, if omitted, the **defaults** in `corsOrigins.ts` (today that includes `https://app.codewithkids.africa` only). Add every origin where the Hub is hosted (production and preview URLs if you test PRs against this API).

### Server: Hub JWT vs Supabase session (hybrid)

Protected `/v1` routes accept **`Authorization: Bearer …`**. The token may be:

1. A **Hub** JWT from `POST /v1/auth/login` (validated with `JWT_SECRET`), or  
2. A **Supabase** session **access_token** when the admin is signed in via Supabase in the browser.

For (2), the API must verify the JWT and load `profiles.role` using Supabase’s service API. Set these on **this** server (never put the service role key in Vite):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Same as Supabase Dashboard → Settings → API → Project URL. |
| `SUPABASE_JWT_SECRET` | Dashboard → Settings → API → JWT Secret (used to verify user access tokens). |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Service role (secret); used for admin/profile checks over REST. |

If admins sign in with **Supabase only** and these are missing, hybrid calls to `/v1/...` can return **401** even when `VITE_SUPABASE_*` and `VITE_API_URL` are correct in the SPA.

## Production API environment

Set these on **whatever runs Express** (Railway, Fly.io, a VPS, Docker, etc.). `DATABASE_URL` can point at **Supabase Postgres** if you use Supabase for the database. Do **not** rely on static-host env vars for CORS—set `CORS_ORIGIN` on the API process.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | Set to `production` so CORS uses the allow-list and JWT startup checks run. |
| `JWT_SECRET` | Yes | Strong random secret; server **exits** if missing or left as the dev default. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `CORS_ORIGIN` | No | Comma-separated browser **origins** allowed to call the API (scheme + host, no trailing slash). If omitted in production, defaults include `https://app.codewithkids.africa` only (see `src/config/corsOrigins.ts`). Add your real Hub URL here or via env. |

**Recommended example** when the hub lives on Vercel:

```env
NODE_ENV=production
JWT_SECRET=<output of openssl rand -base64 32>
DATABASE_URL=postgresql://...
CORS_ORIGIN=https://app.codewithkids.africa
```

Add **Vercel preview** URLs if the team tests PRs against this API (comma-separated, no spaces unless trimmed by the server):

```env
CORS_ORIGIN=https://app.codewithkids.africa,https://cms-git-feature-branch-codewithkids.vercel.app
```

**After any env change:** redeploy or restart the API service so Node picks up new values.

### Cookies and `credentials`

This API authenticates protected routes with **`Authorization: Bearer <token>`** (see [Auth](#auth)); it does **not** set session cookies. The server still enables `credentials: true` in CORS for compatibility. If you later add cookie-based auth, you will need appropriate **`SameSite` / `Secure`** cookie attributes and the browser client must send `credentials: 'include'` on requests—say so in an issue and we can align CORS + client code.

## Deploying the API

1. **Build command (typical):** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`  
   Run migrations during build so **start** only runs Node. Ensure `DATABASE_URL` is available at build time on your host (Supabase connection string or other Postgres).
2. **Start command:** `npm start` (starts the server only; migrations already ran at build).
3. **Environment variables** on the API service (do not commit). See [Production API environment](#production-api-environment). Summary:
   - `DATABASE_URL` — Postgres URL (e.g. **Supabase → Project Settings → Database** connection string).
   - `JWT_SECRET` — long random string (e.g. `openssl rand -base64 32`). Required in production.
   - `NODE_ENV` — `production`.
   - `CORS_ORIGIN` — comma-separated frontend origins for your deployed Hub (see table above).
4. **Health check:** Configure your platform’s health check to `GET /health`. Response: `{ "status": "ok", "service": "cwk-hub-api" }`.
5. **Cold starts:** On hosts that sleep idle instances, the first request after idle may be slow; ping `/health` on a schedule if needed, or use a non-sleeping plan.
