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
- **JWT secret:** Set `JWT_SECRET` in production (e.g. in Render Environment). The app will not start in production if `JWT_SECRET` is missing or still the dev default.

## Data

PostgreSQL via Prisma. Schema in `prisma/schema.prisma`. Seed data in `prisma/seed.ts` (users, terms, learners, classes, sessions, organisations, invoices, payments). All seeded users have password `password` for development.

## Frontend

Point the frontend API base URL to `http://localhost:3001` (e.g. via env or a shared config) and use the same paths under `/v1`.

For a **production** SPA (e.g. on Vercel at `https://app.codewithkids.africa`), set the frontend `VITE_API_URL` to this API’s **HTTPS** base URL. CORS is enforced **here on the API**, not on Vercel.

## Production API environment

Set these on **whatever runs Express** (Render, Railway, Fly.io, a VPS, etc.). Do **not** rely on Vercel env vars for CORS—those only apply to the static frontend build.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | Set to `production` so CORS uses the allow-list and JWT startup checks run. |
| `JWT_SECRET` | Yes | Strong random secret; server **exits** if missing or left as the dev default. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `CORS_ORIGIN` | No | Comma-separated browser **origins** allowed to call the API (scheme + host, no trailing slash). If omitted in production, defaults include `https://app.codewithkids.africa` and `https://cwk-hub.onrender.com` (see `src/config/corsOrigins.ts`). |

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

## Deploying to Render

1. **Build command:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`  
   Run migrations during build so the container **start** is fast (no DB work on wake-up). Ensure `DATABASE_URL` is available at build time (Render injects env by default).
2. **Start command:** `npm start` (starts the server only; migrations already ran at build).
3. **Environment variables** (set in the Render dashboard; do not commit). See [Production API environment](#production-api-environment) for the full list. Summary:
   - `DATABASE_URL` — from the Render Postgres service (Internal Database URL).
   - `JWT_SECRET` — use a long, random string (e.g. `openssl rand -base64 32`). Required in production; the server exits if unset or left as the dev default.
   - `NODE_ENV` — `production`.
   - `CORS_ORIGIN` — optional; comma-separated frontend origins. If unset, defaults include `https://app.codewithkids.africa` and `https://cwk-hub.onrender.com`.
4. **Health check:** In Render, set the health check path to `/health`. The API responds with `{ "status": "ok", "service": "cwk-hub-api" }`.
5. **Cold start (free tier):** The first request after the service has been idle can be slow while the instance spins up. To reduce perceived delay you can use a cron job to ping `/health` periodically, or upgrade the service.
