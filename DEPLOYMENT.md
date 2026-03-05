# Putting CWK Hub Live

This app has **three parts** to deploy:

1. **PostgreSQL database** (hosted)
2. **Backend API** (Node/Express in `server/`)
3. **Frontend** (Vite/React SPA)

---

## 1. Database (PostgreSQL)

Use a hosted Postgres provider and get a connection URL. Examples:

- [Neon](https://neon.tech) – free tier, good for small apps
- [Supabase](https://supabase.com) – Postgres + extras
- [Railway](https://railway.app) – can host DB + API together
- [Render](https://render.com) – Postgres + services

You’ll get a **DATABASE_URL** like:

`postgresql://user:password@host.region.provider.com:5432/dbname?sslmode=require`

Save this for the backend.

---

## 2. Backend API

The API runs in the `server/` folder. It needs:

- **DATABASE_URL** – your Postgres connection string
- **JWT_SECRET** (production) – a long random string, e.g. `openssl rand -base64 32`
- **CORS_ORIGIN** (production) – your frontend URL, e.g. `https://hub.codewithkids.co.ke`
- **NODE_ENV=production**
- **PORT** – optional; default is 3001

### Option A: Deploy to Railway / Render / Fly.io

1. Connect your repo (GitHub/GitLab).
2. Set **root directory** to `server` (or build/start from `server/`).
3. Set env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`.
4. Build: `npm install && npx prisma generate && npm run build`
5. Start: `npm start` (runs `node dist/index.js`)
6. After first deploy, run migrations and seed once:
   - **Migrations:** `npx prisma db push` (or `prisma migrate deploy` if you use migrations)
   - **Seed admin:** `npx prisma db seed`

Note: If the platform doesn’t give you a shell, run `db push` and `db seed` from your machine with `DATABASE_URL` set to the hosted DB.

### Option B: Deploy with Docker

From the **server** directory (so `Dockerfile` and `prisma/` are in context):

```bash
cd server
docker build -t cwk-hub-api .
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  -e CORS_ORIGIN="https://your-frontend.com" \
  -e NODE_ENV=production \
  cwk-hub-api
```

Build and run the same image on any host (VPS, Railway, Render, etc.). Run `npx prisma db push` and `npx prisma db seed` separately against your production DB (from your machine or a one-off job).

---

## 3. Frontend (Vite/React)

The frontend is a static SPA. It must know the **live API URL** at **build time**.

### Set the API URL when building

Set `VITE_API_URL` to your live API base URL (no trailing slash), then build:

```bash
# Example: API at https://api.codewithkids.co.ke
export VITE_API_URL=https://api.codewithkids.co.ke
npm run build
```

The built files are in `dist/`. Upload that folder to any static host.

### Deploy to Vercel / Netlify / Cloudflare Pages

1. Connect the repo.
2. **Build command:** `npm run build`
3. **Publish directory:** `dist`
4. **Environment variable:**  
   `VITE_API_URL` = your live API URL (e.g. `https://your-api.railway.app` or `https://api.yourdomain.com`)

Rebuilds will pick up the current `VITE_API_URL`.

### Or serve from the same server as the API

You can build the frontend and let the Node server serve the `dist/` folder so one domain serves both. The repo doesn’t do this by default; you’d add something like `express.static("dist")` and a catch‑all for the SPA. Prefer the approach above for simplicity.

---

## 4. After going live

1. **Database**
   - Run `npx prisma db push` (or `prisma migrate deploy`) against the production `DATABASE_URL`.
   - Run `npx prisma db seed` once to create the admin user (or create it manually).

2. **Login**
   - Use the seeded admin email/password (see `server/prisma/seed.ts`), or create an admin via your own process.

3. **HTTPS**
   - Use HTTPS for both frontend and API (Vercel/Netlify/Railway/Render provide it).

4. **CORS**
   - Keep `CORS_ORIGIN` on the API set to your exact frontend origin (e.g. `https://hub.codewithkids.co.ke`) so only your site can call the API.

---

## Quick checklist

- [ ] Postgres database created; **DATABASE_URL** saved
- [ ] Backend deployed; **JWT_SECRET**, **CORS_ORIGIN**, **NODE_ENV=production** set
- [ ] `prisma db push` (or migrate) and `prisma db seed` run against production DB
- [ ] Frontend built with **VITE_API_URL** = live API URL
- [ ] Frontend deployed; users can open the app and log in
