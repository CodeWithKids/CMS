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

## Deploying to Render

1. **Build command:** `npm install && npx prisma generate && npm run build`
2. **Start command:** `npm start` (runs `prisma migrate deploy` then starts the server, so migrations apply on every deploy).
3. **Environment variables** (set in the Render dashboard; do not commit):
   - `DATABASE_URL` — from the Render Postgres service (Internal Database URL).
   - `JWT_SECRET` — use a long, random string (e.g. `openssl rand -base64 32`). Required in production; the server exits if unset or left as the dev default.
   - `NODE_ENV` — set to `production`.
   - Optional: `CORS_ORIGIN` — comma-separated allowed origins; if unset, production defaults to `https://cwk-hub.onrender.com`.
4. **Health check:** In Render, set the health check path to `/health`. The API responds with `{ "status": "ok", "service": "cwk-hub-api" }`.
5. **Cold start (free tier):** The first request after the service has been idle can be slow while the instance spins up. To reduce perceived delay you can use a cron job to ping `/health` periodically, or upgrade the service.
