# Supabase Hybrid Migration Guide

This project is migrating feature-by-feature from the legacy API (`VITE_API_URL`) to Supabase (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`).

## Hybrid mode rules

- Keep `VITE_API_URL` set while any feature still uses `src/lib/api.ts`.
- Enable Supabase with:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Migrate one vertical slice at a time:
  1. Table/schema in Supabase
  2. RLS policies for the slice
  3. Frontend hook/service migration
  4. Manual role-based verification

## Environment setup

Use `.env.example` as the template and create your local `.env` in the project root.

Example:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
VITE_API_URL=http://localhost:3001
```

## What to run in the Supabase SQL Editor (order)

Run each file **from top to bottom** in **SQL → New query**. Re-runs are safe where scripts use `if not exists` / `drop policy if exists`.

1. **`docs/SUPABASE_PROFILES_RLS.sql`**  
   Creates `public.profiles`, RLS, `handle_new_user` trigger on `auth.users`, and backfills profiles for existing users.  
   Run through **`commit;`**, then **section 6** if staff (admin/finance) should **update** other users’ profiles from the app or SQL.  
   After first login, promote your account if needed, e.g.  
   `update public.profiles set role = 'admin', status = 'active' where email = 'you@example.com';`

2. **`docs/SUPABASE_TERMS_RLS.sql`** (recommended if you use Supabase for terms)  
   Creates `public.terms` + read for all authenticated users. Run through **`commit;`**, then **section 6** for staff writes. Seed rows as needed (example at bottom of file).

3. **`docs/SUPABASE_CLASSES_RLS.sql`**  
   Run through **`commit;`**, then **section 6** for admin/finance class writes.  
   Do this **before** learners if you want the educator-scoped learner policy to be created on the **first** learners script run (it only runs when `public.classes` exists).

4. **`docs/SUPABASE_LEARNERS_RLS.sql`**  
   Run through **`commit;`**, then **section 6** for admin/finance learner writes.  
   If you ran learners **before** classes existed, run the learners script again (or only the `learners_select_educator_class_scope` block from that file) so educator read access is applied.

5. **`docs/SUPABASE_SESSIONS_RLS.sql`**  
   Creates `public.sessions` (snake_case columns aligned with `SessionsContext` / Prisma). **Run this before attendance** — `docs/SUPABASE_ATTENDANCE_RLS.sql` joins `public.sessions` for educator and parent/student policies.  
   Run through **`commit;`**, then **section 6** for staff/educator session writes from the app.

6. **`docs/SUPABASE_CLASS_ENROLLMENTS_RLS.sql`**  
   Creates `public.class_enrollments` with RLS for admin/finance/educator workflows and learner/parent read scope.

7. **`docs/SUPABASE_ATTENDANCE_RLS.sql`**  
   Creates `public.attendance_records` with educator-scoped write/read policies and role-scoped access.

### Dashboard (not SQL)

- **Authentication → Providers**: enable **Email** (or your chosen provider).  
- **Project Settings → API**: copy URL and anon/publishable key into `.env` as `VITE_SUPABASE_*`.

## Migration status

- Auth: Supabase-first with fallback compatibility in `src/context/AuthContext.tsx` (expects `public.profiles`; SQL in `docs/SUPABASE_PROFILES_RLS.sql`)
- Terms: Supabase-first in `src/hooks/useTerms.ts` (table + RLS in `docs/SUPABASE_TERMS_RLS.sql`)
- Learners: Supabase-first list + by-id + admin CRUD in hooks/pages (RLS SQL in `docs/SUPABASE_LEARNERS_RLS.sql` — include section 6 write policies for create/update/delete)
- Classes: Supabase-first list + admin CRUD + hooks (`useClasses`, `useClass`); RLS in `docs/SUPABASE_CLASSES_RLS.sql` (include section 6 for writes)
- Class enrollments: Supabase-first context + admin class enrolments page (`docs/SUPABASE_CLASS_ENROLLMENTS_RLS.sql`)
- Sessions: table + RLS in `docs/SUPABASE_SESSIONS_RLS.sql` (run before attendance)
- Attendance: Supabase/API-backed persistence in `AttendanceContext` + attendance page (`docs/SUPABASE_ATTENDANCE_RLS.sql`)
- Finance: in progress (Supabase/API-backed invoice bootstrap in `FinanceContext`; legacy `FinanceAccountContext` now hydrates from finance context first)

## RLS checklist by slice

Use this checklist before exposing each slice to the client:

### Profiles

- [ ] `profiles` table exists (`docs/SUPABASE_PROFILES_RLS.sql`)
- [ ] Trigger creates a row on new `auth.users` sign-up
- [ ] At least one admin user (`update ... set role = 'admin'`) for bootstrapping

### Terms

- [ ] `terms` table exists (`docs/SUPABASE_TERMS_RLS.sql`)
- [ ] At least one term row with `is_current = true` if the UI expects a current term

### Learners

- [ ] `learners` table exists with production fields
- [ ] RLS enabled on `learners`
- [ ] Policies by role (admin/finance broad, educator scoped, parent scoped)
- [ ] Select queries tested with authenticated users from each role

### Classes

- [ ] `classes` table exists
- [ ] RLS enabled on `classes`
- [ ] Educators can only read classes they teach
- [ ] Admin/finance can read all required rows

### Sessions and attendance

- [ ] `sessions` and `attendance_records` tables exist
- [ ] RLS enabled on both
- [ ] Educators can only update attendance for their assigned sessions
- [ ] Parents/students can only read permitted session rows

### Finance

- [ ] `finance_invoices` and `payments` tables exist
- [ ] RLS enabled on both
- [ ] Only finance/admin can write payments
- [ ] Parent/organisation reads are scoped to related invoices only
- [ ] Any multi-table write is done through RPC/Edge Function if needed

## Operational guardrails

- Never put Supabase secret/service-role keys in frontend env vars.
- Keep legacy API routes running until the slice is fully moved and verified.
- Decommission `VITE_API_URL` only after all frontend API calls are migrated.
