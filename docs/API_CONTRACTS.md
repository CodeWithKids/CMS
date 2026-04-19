# CWK Hub – API contracts (auth, learners, classes, sessions, finance, organisations)

This document defines **API contracts** for domains that power frontend flows. Response and request shapes align with existing frontend types where possible.

**Base URL:** `https://api.codewithkids.co.ke` (or `/api` when same-origin).  
**Version prefix:** `/v1` (e.g. `/v1/auth/me`).  
**Auth:** Protected routes use `Authorization: Bearer <access_token>` from `POST /v1/auth/login`. The reference server is Express + Prisma under `server/` (`server/src/index.ts` mounts routes).

---

## 0. Express server (`server/`) vs this document

| Kind | Meaning |
|------|--------|
| **Implemented** | Route exists in `server/src/routes/*.ts` as shipped in this repo. |
| **Target only** | Described for product/frontend alignment; **not** implemented in the Express server yet (or only partially). |

**Largest gaps today (contract vs `server/`):**

| Area | Status |
|------|--------|
| **Class enrollment REST** | **Not implemented.** There is no `GET/POST /v1/classes/:id/enrollments` or `PATCH /v1/enrollments/:id`. Classes use a `learnerIds` string array on the class record; set it via `POST/PATCH /v1/classes`. |
| **Finance beyond invoices + payments + educator payments** | **Not implemented** in `server/src/routes/finance.ts`: no invoice create, adjustments, session-expenses, receipts, expenses/income aggregates. |
| **`POST /v1/session-reports/:id/coach-feedback`** | **Not implemented** (no dedicated route; coach feedback would need a schema + route or reuse `PATCH` with fields once defined). |
| **Event registrations** | **Not implemented** in `server/src/routes/events.ts`: no `GET …/registrations` or `POST …/register`. |
| **Events detail key** | Detail and **`PATCH`** use **`:slug`** (URL segment is the event’s unique `slug`, not a separate numeric id). `GET /v1/events` returns rows that include both `id` and `slug`. |

The **summary tables** at the end list implemented routes explicitly, then target-only sketches.

---

## 1. Common conventions

### Response envelope (optional)

- **Success:** Return the resource or array directly (no wrapper), or a consistent wrapper if you prefer: `{ "data": { ... } }`.
- **List responses:** Pagination when needed: `{ "items": [...], "nextCursor": "optional", "total": 123 }`. For MVP, a plain array `[...]` is acceptable.

### Errors

- **HTTP status:** `400` (validation), `401` (unauthorized), `403` (forbidden), `404` (not found), `422` (business rule), `500` (server error).
- **Body (JSON):** `{ "code": "VALIDATION_ERROR", "message": "…", "details": { "field": ["error1"] } }`

### Auth context

- After login, the backend issues an **access token**. The frontend sends it on protected requests.
- On the reference server, `requireAuth` validates JWT and attaches `req.auth.user` (id, role, organizationId, etc.).

---

## 2. Auth

### POST `/v1/auth/login`

**Request:** `{ "email": "string", "password": "string" }`

**Response (200):** `accessToken`, `expiresIn`, `user` (id, name, role, email, status, organizationId, membershipStatus, avatarId). *(Reference server sets `refreshToken` equal to `accessToken`; no refresh rotation.)*

### GET `/v1/auth/me`

**Auth:** Required. **Response (200):** Same user shape as login.

### POST `/v1/auth/logout`

**Response (204):** No body.

---

## 3. Learners (implemented + extensions)

### GET `/v1/learners` — **implemented**

**Query:** `organisationId?`, `status?`, `search?`, `userId?`, `enrollmentType?` or `enrolmentType?` (alias).  
**Response (200):** Array of learners from Prisma.

### POST `/v1/learners` — **implemented** (admin + Bearer)

Creates a learner. Required: `firstName`, `lastName`, `dateOfBirth`, `school`, `enrollmentType` (or `enrolmentType`), `programType`. Optional: `membershipStatus`, `userId`, parent fields, `organizationId`, `status`, `gender`, `joinedAt`.

### PATCH `/v1/learners/:id` — **implemented** (admin)

Partial update; accepts `enrollmentType` or `enrolmentType`.

### DELETE `/v1/learners/:id` — **implemented** (admin)

**Response (204).**

### GET `/v1/learners/:id` — **implemented**

### GET `/v1/learners/:id/badges` — **implemented**

Lists `LearnerBadgeAward` rows for the learner.

### POST `/v1/learners/:id/badges` — **implemented**

**Body:** `badgeId` (required), `sessionId` (required), `awardedAt?`, `awardedBy?`. **Response (201):** Created award.

**Target only (not on server):** Organisation-scoped list rules beyond admin; extended `LearnerAdminProfile` shape.

---

## 4. Classes (implemented) and enrollments (gap)

### GET `/v1/classes` — **implemented**

**Query:** `termId?`, `program?`, `educatorId?`, `trackId?`.

### GET `/v1/classes/:id` — **implemented**

### POST `/v1/classes` — **implemented** (admin)

**Body:** `name`, `program`, `ageGroup`, `location`, `educatorId`, `termId` required; optional `learnerIds[]`, `capacity`, `schoolOrOrganisationName`, `trackId`. **Response (201):** Class.

### PATCH `/v1/classes/:id` — **implemented** (admin)

Partial update including `learnerIds` to manage roster **without** a separate enrollments API.

### DELETE `/v1/classes/:id` — **implemented** (admin)

Deletes class and related sessions/reports.

### Class enrollment REST — **target only (not implemented)**

The following were **design targets** only; they are **not** in `server/src/routes/classes.ts`:

- `GET /v1/classes/:id/enrollments?termId=…`
- `POST /v1/classes/:id/enrollments`
- `PATCH /v1/enrollments/:id`

Use **`learnerIds`** on the class resource instead.

---

## 5. Sessions and attendance

### GET `/v1/sessions` — **implemented**

**Query:** `classId?`, `termId?`, `dateFrom?`, `dateTo?`, plus **`educatorId?`** (filters sessions where user is lead or assistant).  
**Note:** `learnerId` query filter is **target only** (not implemented on server).

### GET `/v1/sessions/:id` — **implemented**

### GET `/v1/sessions/:id/attendance` — **implemented**

### PUT `/v1/sessions/:id/attendance` — **implemented**

**Body:** Array of `{ learnerId, status, stars?, notes? }`. Replaces all attendance rows for the session.

---

## 6. Finance — **implemented in `server/`**

`server/src/routes/finance.ts` currently exposes:

| Method | Path |
|--------|------|
| GET | `/v1/finance/invoices` — query: `termId`, `status`, `payerType`, `organisationId`, `learnerId` |
| GET | `/v1/finance/invoices/:id` |
| GET | `/v1/finance/invoices/:id/payments` |
| POST | `/v1/finance/invoices/:id/payments` — body: `amount`, `method`, `reference`, `date`, `recordedBy` |
| GET | `/v1/finance/educator-payments` — query: `educatorId`, `period`, `status` |

Invoice list objects match the frontend `FinanceInvoice` shape where fields exist in Prisma.

---

## 7. Finance — **target only (not in Express server)**

The following sections describe **intended** contracts for pages that may still use mocks or Supabase; they are **not** implemented in `server/src/routes/finance.ts` today:

- Invoice **create** / **PATCH** invoice, **GET receipt**
- **Adjustments:** `GET|POST /v1/finance/invoices/:id/adjustments`, `GET|PATCH /v1/finance/adjustments…`
- **Session expenses:** `GET|POST|PATCH /v1/finance/session-expenses…`
- **Reporting:** `GET /v1/finance/expenses`, `GET /v1/finance/income`

*(Previous numbered sections in older versions of this file matched those targets; they are omitted here to avoid implying the server supports them.)*

---

## 8. Organisations

### POST `/v1/organisations/signup` — **implemented** (public)

Creates a **pending signup** row (`pendingSignup`); admin approves via `/v1/admin/pending-signups/...`. **Response (201):** `{ id, message, accountCreated: false }`.

### GET `/v1/organisations/:id` — **implemented**

### GET `/v1/organisations/:id/learners` — **implemented**

### GET `/v1/organisations/:id/invoices` — **implemented**

### PATCH `/v1/organisations/:id` — **implemented** (admin or `partnerships` role)

### DELETE `/v1/organisations/:id` — **implemented** (admin or `partnerships`; blocked if learners still reference org)

---

## 9. Parents (public signup)

### POST `/v1/parents/signup` — **implemented** (public)

Creates pending parent signup; same admin approval flow as org signups.

---

## 10. Admin

| Method | Path | Notes |
|--------|------|--------|
| POST | `/v1/admin/accounts` | Admin: create team user (password, role, etc.) |
| POST | `/v1/admin/accounts/organisation` | Admin: create org + linked org user |
| GET | `/v1/admin/accounts` | Query `status`; list users |
| PATCH | `/v1/admin/accounts/:id` | Approve/reject (`status`), update fields |
| DELETE | `/v1/admin/accounts/:id` | Admin cannot delete self |
| GET | `/v1/admin/overview` | Dashboard aggregates (admin) |
| GET | `/v1/admin/pending-signups` | List pending requests |
| POST | `/v1/admin/pending-signups/:id/approve` | Approve org or parent signup |
| POST | `/v1/admin/pending-signups/:id/reject` | Reject signup |
| POST | `/v1/admin/provision-supabase-user` | **Hybrid:** `Authorization: Bearer <Supabase access_token>` (admin session). Body: `email`, `password`, `name`, `role`. Creates `auth.users` via GoTrue Admin API with `email_confirm: true` (no confirmation email). Requires server env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`. |

---

## 11. Terms (reference data)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/v1/terms` | |
| GET | `/v1/terms/current` | 404 if none marked current |
| POST | `/v1/terms` | Admin + Bearer |
| PATCH | `/v1/terms/:id` | Admin |
| DELETE | `/v1/terms/:id` | Admin |

---

## 12. Session reports

| Method | Path | Notes |
|--------|------|--------|
| GET | `/v1/session-reports` | Query: `dateFrom?`, `dateTo?`, `educatorId?` |
| GET | `/v1/session-reports/by-session/:sessionId` | |
| GET | `/v1/session-reports/:id` | |
| POST | `/v1/session-reports` | |
| PATCH | `/v1/session-reports/:id` | Partial update |

### Coach feedback — **not implemented**

**`POST /v1/session-reports/:id/coach-feedback`** is **not** present in `server/src/routes/sessionReports.ts`. Define persistence (fields on report vs child table) before adding to server and UI.

---

## 13. Educators / staff

| Method | Path | Notes |
|--------|------|--------|
| GET | `/v1/educators` | Query `role?`, `status?`; staff roles subset |
| GET | `/v1/educators/:id` | |
| GET | `/v1/educators/:id/badges` | |
| POST | `/v1/educators/:id/badges` | Body: `badgeId`, optional `trackId`, `earnedAt` |

---

## 14. Events

**List:** `GET /v1/events` — query `status?`, `dateFrom?`, `dateTo?`.

**Detail:** `GET /v1/events/:slug` — parameter is the **`slug`** (stable URL key), **not** the internal `id`.

**Create:** `POST /v1/events` — body includes `title`, **`slug`** (unique), `startDate`, `location`, optional `description`, `endDate`, `capacity`, `price`, `tracks[]`, `status`, `createdById`.

**Update:** `PATCH /v1/events/:slug` — same `:slug` routing; body may include a new `slug` to rename.

**Registrations:** **not implemented** — no `GET /v1/events/:slug/registrations` or `POST …/register` in server.

---

## 15. Partners (admin directory)

All **admin + Bearer**:

- `GET /v1/partners/organisations`
- `GET /v1/partners/parents`
- `GET /v1/partners/learners`

---

## 16. Inventory

| Method | Path |
|--------|------|
| GET | `/v1/inventory/items` — query `status?`, `category?`, `educatorId?` |
| POST | `/v1/inventory/items` |
| PATCH | `/v1/inventory/items/:id` |
| DELETE | `/v1/inventory/items/:id` |

---

## 17. Lesson plans

| Method | Path |
|--------|------|
| GET | `/v1/lesson-plans/templates` |
| POST | `/v1/lesson-plans/templates` |
| PATCH | `/v1/lesson-plans/templates/:id` |
| GET | `/v1/lesson-plans/instances` — query `sessionId?`, `educatorId?` |
| POST | `/v1/lesson-plans/instances` |
| PATCH | `/v1/lesson-plans/instances/:id` |

---

## 18. Coaching notes

| Method | Path |
|--------|------|
| GET | `/v1/coaching-notes` — query `educatorId?` |
| POST | `/v1/coaching-notes` — body: `educatorId`, `authorId`, `text`, optional `date`, `trackRef`, `sessionId` |

---

## 19. Settings reference lists (programs, locations, age groups, finance labels, tracks)

Admin CRUD uses **`requireAuth`** + admin check on mutating routes unless noted.

| Resource | Base path | GET list | POST | PATCH | DELETE |
|----------|-----------|----------|------|-------|--------|
| Programs | `/v1/programs` | yes | admin | `/:id` admin | `/:id` admin |
| Locations | `/v1/locations` | yes | admin | `/:id` admin | `/:id` admin |
| Age groups | `/v1/age-groups` | yes | admin | `/:id` admin | `/:id` admin |
| Income sources | `/v1/income-sources` | yes | admin | `/:id` admin | `/:id` admin |
| Expense categories | `/v1/expense-categories` | yes | admin | `/:id` admin | `/:id` admin |
| Focus areas | `/v1/focus-areas` | **GET only** (nested tracks in payload) | — | — | — |

---

## Summary table A — **implemented** in `server/`

| Domain | Endpoints |
|--------|-----------|
| Auth | `POST /v1/auth/login`, `GET /v1/auth/me`, `POST /v1/auth/logout` |
| Terms | `GET /v1/terms`, `GET /v1/terms/current`, `POST /v1/terms`, `PATCH /v1/terms/:id`, `DELETE /v1/terms/:id` |
| Learners | `GET /v1/learners`, `POST /v1/learners`, `PATCH /v1/learners/:id`, `DELETE /v1/learners/:id`, `GET /v1/learners/:id`, `GET|POST /v1/learners/:id/badges` |
| Classes | `GET /v1/classes`, `GET /v1/classes/:id`, `POST /v1/classes`, `PATCH /v1/classes/:id`, `DELETE /v1/classes/:id` |
| Sessions | `GET /v1/sessions`, `GET /v1/sessions/:id`, `GET|PUT /v1/sessions/:id/attendance` |
| Session reports | `GET /v1/session-reports`, `GET /v1/session-reports/:id`, `GET /v1/session-reports/by-session/:sessionId`, `POST /v1/session-reports`, `PATCH /v1/session-reports/:id` |
| Educators | `GET /v1/educators`, `GET /v1/educators/:id`, `GET|POST /v1/educators/:id/badges` |
| Finance | `GET /v1/finance/invoices`, `GET /v1/finance/invoices/:id`, `GET|POST /v1/finance/invoices/:id/payments`, `GET /v1/finance/educator-payments` |
| Organisations | `POST /v1/organisations/signup`, `GET /v1/organisations/:id`, `GET /v1/organisations/:id/learners`, `GET /v1/organisations/:id/invoices`, `PATCH /v1/organisations/:id`, `DELETE /v1/organisations/:id` |
| Parents | `POST /v1/parents/signup` |
| Admin | `POST /v1/admin/accounts`, `POST /v1/admin/accounts/organisation`, `GET /v1/admin/accounts`, `PATCH /v1/admin/accounts/:id`, `DELETE /v1/admin/accounts/:id`, `GET /v1/admin/overview`, `GET /v1/admin/pending-signups`, `POST /v1/admin/pending-signups/:id/approve`, `POST /v1/admin/pending-signups/:id/reject`, `POST /v1/admin/provision-supabase-user` (Supabase hybrid; see §10) |
| Events | `GET /v1/events`, `GET /v1/events/:slug`, `POST /v1/events`, `PATCH /v1/events/:slug` |
| Partners | `GET /v1/partners/organisations`, `GET /v1/partners/parents`, `GET /v1/partners/learners` |
| Inventory | `GET|POST /v1/inventory/items`, `PATCH|DELETE /v1/inventory/items/:id` |
| Lesson plans | `GET|POST|PATCH /v1/lesson-plans/templates`, `GET|POST /v1/lesson-plans/instances`, `PATCH /v1/lesson-plans/instances/:id` |
| Coaching notes | `GET /v1/coaching-notes`, `POST /v1/coaching-notes` |
| Reference data | `GET|POST|PATCH|DELETE /v1/programs`, `/v1/locations`, `/v1/age-groups`, `/v1/income-sources`, `/v1/expense-categories`; `GET /v1/focus-areas` |

---

## Summary table B — **target / not in Express server** (or misleading in older docs)

| Area | Notes |
|------|--------|
| Class enrollments REST | Use class `learnerIds` via `POST/PATCH /v1/classes`. |
| Finance | Invoice CRUD beyond read, adjustments, session-expenses, receipts, expenses/income reporting. |
| Session report coach feedback | Dedicated `POST …/coach-feedback` — add when schema exists. |
| Events | Registrations list/create APIs. |
| Auth | Separate refresh rotation (`POST /v1/auth/refresh`). |
| Sessions | `learnerId` query on list. |
| Partnerships / marketing / social | Prospects, campaigns, posts (frontend-heavy today). |

---

## Coverage and next steps

- **Single source for mounts:** `server/src/index.ts`.
- **Align frontend:** Prefer `events` detail/`PATCH` by **`slug`** from `GET /v1/events`; avoid assuming `:id` is numeric or equals `slug`.
- **Close biggest gaps:** If the product needs enrollment rows, session-expense approval, or event registration in the Node API, add routes under `server/src/routes/` and extend this document’s **table A**.

Request/response bodies should continue to match frontend types (`AppUser`, `Learner`, `ClassEntity`, `Session`, `SessionReport`, `FinanceInvoice`, `Payment`, etc.) so the UI can switch between **Express**, **Supabase**, and mocks with minimal friction.
