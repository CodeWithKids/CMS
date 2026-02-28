# CWK Hub Admin Flow – MVP Spec

This document describes the **admin** user flow in the CWK Hub MVP: what admins can do today and what can be improved.

---

## 1) Login and entry

**Who:** A user with role **admin**.

1. Admin opens CWK Hub and goes to **Login** (`/login`).
2. They sign in (MVP: select an admin user from the mock user list).
3. The app stores the current user and redirects to **Admin Dashboard** (`/admin/dashboard`).
4. Admin has access to all admin routes; other roles are blocked from admin paths.

---

## 2) Navigation (admin)

The admin sidebar is grouped into three buckets plus core operations:

| Section | Items |
|--------|--------|
| **Dashboard** | Dashboard → `/admin/dashboard` |
| **HR** | Staff directory → `/admin/hr/staff`, Staff profile → `/admin/hr/staff/:id` |
| **Finance oversight** | Educator payments → `/admin/finance/educator-payments`, Educator hours → `/admin/educator-hours`, Expenses → `/admin/finance/expenses` |
| **System setup** | Account approvals → `/admin/account-approvals`, Settings → `/admin/settings` |
| **Operations** | Learners → `/admin/learners`, Classes → `/admin/classes`, Session reports → `/admin/session-reports`, Schedules → `/admin/schedules`, Inventory → `/inventory` |

---

## 3) Dashboard (`/admin/dashboard`)

1. Admin lands on **Admin Dashboard** after login.
2. They see:
   - **Overview — active partners**: stat cards (Active schools, Active organisations, Active Miradi sites) and a **Partners** table (organisation name, type, active learners).
   - **Learning tracks**: learners-by-track counts (Game design, Web design, etc.), with track inferred from session reports when not set on the learner.
   - **People**: stat cards — Active learners, Active educators, Active parents, Pending accounts.
   - **Finance**: stat cards — Total invoiced, Total collected, Total pending, Learners with pending payments.
   - **Pending account approvals**: table of users awaiting approval (name, email, role, created).
   - **Learners with pending payments**: table with learner name (link to learner profile), payer type, payer/contact, phone, email, invoiced/paid/pending, status.
   - **Organisations with pending payments** (if any): table of partner orgs with outstanding amounts and overdue badge.

3. From the dashboard, admin can:
   - Open a learner from “Learners with pending payments” → **Learner detail** (`/admin/learners/:id`).
   - Go to **Account approvals**, **Learners**, **Classes**, **Session reports**, **Schedules**, or **Inventory** via the sidebar.

---

## 4) HR

### 4.1 Staff directory (`/admin/hr/staff`)

1. Admin opens **Staff directory** from the sidebar.
2. They see a list of staff (educators, admins, etc.).
3. Clicking a staff member goes to **Staff profile** (`/admin/hr/staff/:id`).

### 4.2 Staff profile (`/admin/hr/staff/:id`)

1. Admin sees details for one staff member.
2. They can go **Back to staff directory**.

---

## 5) Finance oversight

### 5.1 Educator payments (`/admin/finance/educator-payments`)

1. Admin opens **Educator payments** to view and manage educator stipends/salary/bonus payments.
2. They see payments with period, type, amount, status, date paid, notes.

### 5.2 Educator hours (`/admin/educator-hours`)

1. Admin opens **Educator hours** to see teaching hours (lead/coaching) per educator.
2. Used for oversight and payroll context.

### 5.3 Expenses (`/admin/finance/expenses`)

1. Admin opens **Expenses** to view organisational expenses (rent, travel, etc.).
2. They see expense records with category, amount, date, status.

---

## 6) System setup

### 6.1 Account approvals (`/admin/account-approvals`)

1. Admin opens **Account approvals** to approve or reject pending user accounts (e.g. new educators, organisation contacts).
2. Pending users also appear on the dashboard.

### 6.2 Settings (`/admin/settings`)

1. Admin opens **Settings** for system-wide configuration (e.g. terms, org types, feature flags in future).

---

## 7) Learners (`/admin/learners`)

1. Admin opens **Learners** from the sidebar.
2. They see a list of all learners with search/filter.
3. Clicking **View details** (or a learner name) goes to **Learner detail** (`/admin/learners/:id`).

### 7.1 Learner detail (`/admin/learners/:id`)

1. Admin sees a **full read-only** learner profile:
   - Header: name, programme type (Makerspace / School club / Organisation), status (Active / Alumni), avatar (preset or URL), organisation if linked.
   - Badges earned and attendance summary for the current term (present/absent/late counts, percentage).
   - Enrolment history: term, class, status (Current / Completed / Withdrawn).
   - Optional: contact/parent info, notes.
2. **Back to learners** returns to the list.

---

## 8) Classes (`/admin/classes`)

1. Admin opens **Classes** to see all classes (name, programme, term, educator, etc.).
2. For each class there is **Manage enrolments** → **Class enrolments** (`/admin/classes/:id/enrolments`).

### 8.1 Class enrolments (`/admin/classes/:id/enrolments`)

1. Admin sees learners enrolled in that class for the class’s term.
2. They can perform **bulk actions** (e.g. mark dropped, add learner), with safeguards and filters.
3. **Back to classes** returns to the class list.

---

## 9) Session reports (`/admin/session-reports`)

1. Admin opens **Session reports** to see all session reports with **filters** (e.g. date range, educator, status).
2. List shows session date, class, lead educator, status (Submitted / Missing), and actions.
3. For **missing** reports, admin can **Send reminder** to the educator in charge (toast confirms; in MVP no real email is sent).
4. Clicking a row opens **Session report detail** (`/admin/session-reports/:id`).

### 9.1 Session report detail (`/admin/session-reports/:id`)

1. If the report is **submitted**: admin sees full report (session info, attendance, engagement, badges awarded, notes).
2. If the report is **missing**: admin sees a “Session report — missing” view with session/class/lead educator info and a **Send reminder** button.
3. **Back to session reports** returns to the list.

---

## 10) Schedules (`/admin/schedules`)

1. Admin opens **Schedules** to see team/educator schedules (e.g. week view, educator selector).
2. Read-only visibility of who is facilitating, coaching, or unavailable.

---

## 11) Inventory (`/inventory`)

1. Admin opens **Inventory** (shared route with educator; educator has view-only).
2. Admin can **manage** inventory: list items, add new, edit, check out/return.
3. Full CRUD for inventory items; educators can only view and check out (where allowed).

---

## Summary — current admin flow

| Step | Route / action | What happens |
|------|----------------|---------------|
| Login | `/login` | Sign in as admin → redirect to `/admin/dashboard`. |
| Dashboard | `/admin/dashboard` | Overview (partners, tracks), People, Finance, Pending approvals, Learners/orgs with pending payments. |
| HR | `/admin/hr/staff`, `/admin/hr/staff/:id` | Staff list and staff profile. |
| Finance oversight | `/admin/finance/educator-payments`, `/admin/educator-hours`, `/admin/finance/expenses` | Educator payments, hours, expenses. |
| System setup | `/admin/account-approvals`, `/admin/settings` | Approve accounts; system settings. |
| Learners | `/admin/learners`, `/admin/learners/:id` | All learners; full read-only learner profile (badges, attendance, enrolments). |
| Classes | `/admin/classes`, `/admin/classes/:id/enrolments` | All classes; per-class enrolments with bulk actions. |
| Session reports | `/admin/session-reports`, `/admin/session-reports/:id` | List with filters; detail view; send reminder for missing reports. |
| Schedules | `/admin/schedules` | Team/educator schedule visibility. |
| Inventory | `/inventory`, `/inventory/new`, `/inventory/:id`, `/inventory/:id/edit` | Full inventory management (admin); educators view/checkout only. |

---

## What needs to be improved

These are gaps or enhancements that would make the admin flow more complete or consistent with other docs and prompts.

### Dashboard and overview

- **peopleHum-style polish**: Optional dashboard refinements such as clearer “pending items” summary (e.g. “5 session reports missing”, “3 account approvals”), quick links to each bucket, and a more scannable layout.
- **Loading / empty / error states**: Dashboard and key admin pages should show skeletons or spinners while data loads, friendly empty states when there are no records, and error banners with retry (especially once wired to a real API).

### HR

- **Staff profile depth**: Richer staff profile (e.g. assigned classes, sessions this term, hours summary) so admin has one place to see an educator’s workload and history.
- **Role/permission clarity**: Clear indication of which staff have which roles and what they can access.

### Finance oversight

- **Single finance “home”**: Optional admin finance summary page (or dashboard section) that links to educator payments, expenses, session expenses, and (when built) invoices/income, so “Finance oversight” feels like one place to go.
- **Session expense workflow**: Educators request session expenses; finance (or admin) approves and pays. Ensure admin/finance can see and process these in one place.
- **Income categorisation**: Finance can report by session type, organisation, programme, payer type (already scoped in prompts); admin dashboard could surface high-level income metrics.

### Learners and classes

- **Learner profile by term**: On admin learner detail, add a **term selector** (like organisation learner detail) so admin can see attendance and enrolment for Term 1, Term 2, Term 3, not only “current term”.
- **Bulk actions and filters**: Learners list and class enrolments already have or plan filters; ensure filters (e.g. by programme, org, term) are consistent and documented.

### Session reports

- **Reminder actually sent**: “Send reminder” currently shows a toast only; when backend/email exists, wire it to send a real email or in-app notification to the educator.
- **Coach feedback**: If session reports support coach feedback (from educator hardening), admin should see it on the report detail and optionally filter by “has feedback”.

### Schedules

- **Week/educator selectors**: Ensure admin can pick week and educator (or “all”) and see a clear read-only calendar; align with educator “team schedule” visibility.

### Inventory

- **Role enforcement**: Educators see list and checkout only; admin has full CRUD. Ensure permissions are enforced in UI and (when applicable) API.
- **Checkout status**: On list view, clearly show “Checked out by [Name] since [date]” and due date for checked-out items.

### System setup and approvals

- **Account approvals actions**: Approve/reject buttons with confirmation and clear success feedback; optional bulk approve.
- **Terms and academic setup**: If terms are managed in Settings, ensure admin can add/edit terms and that class enrolments and reports align with term boundaries.

### Consistency and UX

- **Confirmations for destructive actions**: Use `AlertDialog` for delete/remove actions (e.g. remove enrolment, delete expense, return device) across admin (and educator) flows.
- **Breadcrumbs**: Optional breadcrumbs on deep pages (e.g. Learners → [Name], Classes → [Class] → Enrolments) so admin can navigate back in one click.
- **Documentation**: Keep this doc and `ORGANISATION_FLOW_MVP.md`, `EDUCATOR_FLOW_MVP.md`, `LEARNER_FLOW_MVP.md` in sync as new admin features ship.

---

**Applies to:** Users with role **admin**. All admin routes are protected; only admins can access `/admin/*` and the shared inventory management experience.
