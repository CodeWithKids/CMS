-- Learners slice: table + RLS policies
-- Run this in Supabase SQL Editor before enabling the frontend learners hook.

begin;

-- 1) Table (snake_case canonical)
create table if not exists public.learners (
  id text primary key,
  first_name text not null,
  last_name text not null,
  date_of_birth text not null,
  school text not null,
  enrolment_type text not null check (enrolment_type in ('member', 'partner_org')),
  program_type text not null check (program_type in ('MAKERSPACE', 'SCHOOL_CLUB', 'ORGANISATION')),
  membership_status text null check (membership_status in ('active', 'inactive', 'expired')),
  user_id uuid null references auth.users(id) on delete set null,
  parent_name text null,
  parent_phone text null,
  parent_email text null,
  organization_id text null,
  status text not null default 'active' check (status in ('active', 'alumni')),
  gender text null check (gender in ('male', 'female', 'other')),
  joined_at text null
);

-- 2) Helpful indexes
create index if not exists learners_org_idx on public.learners (organization_id);
create index if not exists learners_user_id_idx on public.learners (user_id);
create index if not exists learners_status_idx on public.learners (status);
create index if not exists learners_parent_email_idx on public.learners (parent_email);

-- 3) Enable RLS
alter table public.learners enable row level security;

-- 4) Drop old policies so reruns are safe
drop policy if exists learners_select_admin_finance_ld on public.learners;
drop policy if exists learners_select_organisation_scope on public.learners;
drop policy if exists learners_select_parent_scope on public.learners;
drop policy if exists learners_select_student_self on public.learners;
drop policy if exists learners_select_educator_class_scope on public.learners;

-- 5) Read policies

-- Admin / finance / ld manager can read all learners
create policy learners_select_admin_finance_ld
  on public.learners
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

-- Organisation users can read learners in their organisation only
create policy learners_select_organisation_scope
  on public.learners
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'organisation'
        and p.organization_id is not null
        and p.organization_id = learners.organization_id
    )
  );

-- Parents can read learners where learner.parent_email matches logged-in email
create policy learners_select_parent_scope
  on public.learners
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'parent'
    )
    and lower(coalesce(learners.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Student can only read learner row linked to their auth user id
create policy learners_select_student_self
  on public.learners
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
    )
    and learners.user_id = auth.uid()
  );

-- Educator can read learners in classes where they are assigned educator
-- Assumes public.classes(educator_id text, learner_ids text[]).
do $$
begin
  if to_regclass('public.classes') is not null then
    execute $policy$
      create policy learners_select_educator_class_scope
        on public.learners
        for select
        to authenticated
        using (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'educator'
          )
          and exists (
            select 1
            from public.classes c
            where c.educator_id = auth.uid()::text
              and learners.id = any(c.learner_ids)
          )
        );
    $policy$;
  end if;
end;
$$;

commit;

-- ---------------------------------------------------------------------------
-- 6) Write policies (admin + finance) — run this block after the block above
--    so the app can insert / update / delete learners from Admin → Learners.
-- ---------------------------------------------------------------------------

drop policy if exists learners_insert_admin_finance on public.learners;
create policy learners_insert_admin_finance
  on public.learners
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance')
    )
  );

drop policy if exists learners_update_admin_finance on public.learners;
create policy learners_update_admin_finance
  on public.learners
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance')
    )
  );

drop policy if exists learners_delete_admin_finance on public.learners;
create policy learners_delete_admin_finance
  on public.learners
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance')
    )
  );
