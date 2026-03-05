# Deploy CWK Hub to Render – Step by Step

You’ll create **three** things on Render:

1. **PostgreSQL database** – for your data  
2. **Web Service** – the backend API (Node/Express in `server/`)  
3. **Static Site** – the frontend (Vite/React)

Do them in this order. You need the database first, then the API, then the frontend (so you can point it at the API URL).

---

## Prerequisites

- Code pushed to **GitHub** (or GitLab) so Render can connect the repo  
- A **Render** account: [render.com](https://render.com) → Sign up / Log in  

---

## Step 1: Create the PostgreSQL database

1. In the Render dashboard, click **New +** → **PostgreSQL**.  
2. **Name:** e.g. `cwk-hub-db`.  
3. **Region:** choose the one closest to you (and your users).  
4. **Plan:** Free is fine to start (it will spin down when idle).  
5. Click **Create Database**.  
6. Wait until the DB is **Available**.  
7. Open the database; in **Connections** you’ll see **Internal Database URL** (and External).  
8. Copy the **Internal Database URL** – it looks like:  
   `postgresql://user:password@host/dbname?sslmode=require`  
   You’ll use this as `DATABASE_URL` for the API.  
   - Prefer **Internal** if the API will run on Render (same region). Use **External** only if the API runs elsewhere.

---

## Step 2: Create the Backend (Web Service)

1. In the Render dashboard, click **New +** → **Web Service**.  
2. **Connect** your GitHub (or GitLab) account and select the **CMS** repo.  
3. Configure the service:

   | Field | Value |
   |-------|--------|
   | **Name** | `cwk-hub-api` (or any name) |
   | **Region** | Same as the database |
   | **Root Directory** | `server` |
   | **Runtime** | Node |
   | **Build Command** | `npm install && npx prisma generate && npm run build` |
   | **Start Command** | `npm start` |

4. **Plan:** Free or paid, as you prefer.  
5. **Environment variables** – click **Add Environment Variable** and add:

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | Paste the **Internal Database URL** from Step 1 (from the DB’s Connections tab) |
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | A long random string (e.g. run `openssl rand -base64 32` in your terminal and paste the result) |
   | `CORS_ORIGIN` | Leave empty for now; you’ll set it in Step 3 after you have the frontend URL |

6. Click **Create Web Service**.  
7. Wait for the first **build and deploy** to finish (green “Live” or “Deployed”).  
8. Copy the service URL (e.g. `https://cwk-hub-api.onrender.com`). This is your **API URL**.  
9. **Run database setup once** (create tables + seed admin):  
   - On your own machine, in the project folder, set `DATABASE_URL` to the **same** Internal Database URL (or the External URL if you’re not on Render).  
   - In a terminal:

     ```bash
     cd server
     export DATABASE_URL="postgresql://..."   # paste your DB URL
     npx prisma db push
     npx prisma db seed
     ```

   After this, the API can log users in (admin email/password from the seed).

---

## Step 3: Create the Frontend (Static Site)

1. In the Render dashboard, click **New +** → **Static Site**.  
2. **Connect** the same repo and select the **CMS** project.  
3. Configure the site:

   | Field | Value |
   |-------|--------|
   | **Name** | `cwk-hub` (or any name) |
   | **Root Directory** | Leave **empty** (repo root) |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `dist` |

4. **Environment variable** – add one so the frontend knows the live API:

   | Key | Value |
   |-----|--------|
   | `VITE_API_URL` | Your API URL from Step 2 (e.g. `https://cwk-hub-api.onrender.com`) – **no trailing slash** |

5. Click **Create Static Site**.  
6. Wait for the build to finish.  
7. Copy the site URL (e.g. `https://cwk-hub.onrender.com`). This is your **app URL**.  

---

## Step 4: Point the API at your frontend (CORS)

1. Go back to your **Web Service** (backend) in the Render dashboard.  
2. Open **Environment** and **edit** `CORS_ORIGIN`.  
3. Set it to your **Static Site URL** from Step 3, e.g. `https://cwk-hub.onrender.com` (no trailing slash).  
4. Save. Render will redeploy the API; wait for it to go live.  

---

## Step 5: Test

1. Open your **Static Site URL** in a browser.  
2. Log in with the **admin** account from the seed:  
   - Email: `codewithkidsafrica@gmail.com`  
   - Password: `password`  
3. If login works, the app is live.  

---

## Summary

| What | URL / value |
|------|-------------|
| Database | Internal URL used as `DATABASE_URL` in the Web Service |
| Backend API | e.g. `https://cwk-hub-api.onrender.com` → set as `VITE_API_URL` for the frontend |
| Frontend | e.g. `https://cwk-hub.onrender.com` → set as `CORS_ORIGIN` for the API |
| One-time DB setup | On your machine: `cd server`, set `DATABASE_URL`, then `npx prisma db push` and `npx prisma db seed` |

---

## Troubleshooting

- **“Invalid email or password”**  
  Make sure you ran `npx prisma db push` and `npx prisma db seed` against the **same** database whose URL is in the Web Service’s `DATABASE_URL`.

- **CORS or blank screen / API errors from the browser**  
  - Check that `CORS_ORIGIN` on the Web Service is exactly your Static Site URL (same scheme and host, no trailing slash).  
  - Check that `VITE_API_URL` on the Static Site is exactly your Web Service URL.

- **Build fails on “prisma not found”**  
  The repo already has `prisma` in the server’s `dependencies`. If you use an older copy, ensure the **Build Command** is exactly:  
  `npm install && npx prisma generate && npm run build`

- **Free tier spin-down**  
  On the free plan, the Web Service may sleep after inactivity. The first request after that can be slow; that’s expected.
