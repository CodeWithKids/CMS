-- Classes slice: table + RLS policies
-- Run in Supabase SQL Editor after `public.profiles` and `public.learners` exist (policies reference learners).

begin;

-- 1) Table (snake_case canonical)
create table if not exists public.classes (
  id text primary key,
  name text not null,
  program text not null,
  age_group text not null,
  location text not null,
  educator_id text not null,
  term_id text not null,
  learner_ids text[] not null default '{}',
  capacity int null,
  school_or_organisation_name text null,
  track_id text null
);

create index if not exists classes_educator_id_idx on public.classes (educator_id);
create index if not exists classes_term_id_idx on public.classes (term_id);
create index if not exists classes_program_idx on public.classes (program);
create index if not exists classes_track_id_idx on public.classes (track_id);

alter table public.classes enable row level security;

drop policy if exists classes_select_admin_finance_ld on public.classes;
drop policy if exists classes_select_educator_own on public.classes;
drop policy if exists classes_select_organisation_scope on public.classes;
drop policy if exists classes_select_parent_scope on public.classes;
drop policy if exists classes_select_student_scope on public.classes;

-- Admin / finance / LD can read all classes
create policy classes_select_admin_finance_ld
  on public.classes
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

-- Educator sees classes they lead
create policy classes_select_educator_own
  on public.classes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'educator'
    )
    and classes.educator_id = auth.uid()::text
  );

-- Organisation users: class has at least one learner in their org
create policy classes_select_organisation_scope
  on public.classes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'organisation'
        and p.organization_id is not null
        and exists (
          select 1
          from public.learners l
          where l.organization_id = p.organization_id
            and l.id = any(classes.learner_ids)
        )
    )
  );

-- Parent: JWT email matches a learner on the class
create policy classes_select_parent_scope
  on public.classes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'parent'
    )
    and exists (
      select 1
      from public.learners l
      where lower(coalesce(l.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and l.id = any(classes.learner_ids)
    )
  );

-- Student: linked learner is on the class
create policy classes_select_student_scope
  on public.classes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'student'
    )
    and exists (
      select 1
      from public.learners l
      where l.user_id = auth.uid()
        and l.id = any(classes.learner_ids)
    )
  );

commit;

-- ---------------------------------------------------------------------------
-- 6) Write policies (admin + finance) — Admin → Classes CRUD from the app
-- ---------------------------------------------------------------------------

drop policy if exists classes_insert_admin_finance on public.classes;
create policy classes_insert_admin_finance
  on public.classes
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

drop policy if exists classes_update_admin_finance on public.classes;
create policy classes_update_admin_finance
  on public.classes
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

drop policy if exists classes_delete_admin_finance on public.classes;
create policy classes_delete_admin_finance
  on public.classes
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
