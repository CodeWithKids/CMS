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

## Migration status

- Auth: Supabase-first with fallback compatibility in `src/context/AuthContext.tsx`
- Terms: Supabase-first in `src/hooks/useTerms.ts`
- Learners: Supabase-first list + by-id + admin CRUD in hooks/pages (RLS SQL in `docs/SUPABASE_LEARNERS_RLS.sql` — include section 6 write policies for create/update/delete)
- Classes: pending
- Sessions/attendance: pending
- Finance: pending

## RLS checklist by slice

Use this checklist before exposing each slice to the client:

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
