-- Terms: table + RLS for src/hooks/useTerms.ts (public.terms, snake_case)
-- Run after public.profiles (optional but recommended before classes/learners if UI needs terms).

begin;

create table if not exists public.terms (
  id text primary key,
  name text not null,
  start_date text not null,
  end_date text not null,
  is_current boolean not null default false
);

create index if not exists terms_is_current_idx on public.terms (is_current);

alter table public.terms enable row level security;

drop policy if exists terms_select_authenticated on public.terms;
create policy terms_select_authenticated
  on public.terms
  for select
  to authenticated
  using (true);

commit;

-- ---------------------------------------------------------------------------
-- 6) Writes — admin / finance / ld_manager (adjust if only admins should edit)
-- ---------------------------------------------------------------------------

drop policy if exists terms_insert_staff on public.terms;
create policy terms_insert_staff
  on public.terms
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists terms_update_staff on public.terms;
create policy terms_update_staff
  on public.terms
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists terms_delete_staff on public.terms;
create policy terms_delete_staff
  on public.terms
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

-- Example seed (edit IDs/dates for your org)
-- insert into public.terms (id, name, start_date, end_date, is_current) values
--   ('t1', 'Term 1 2026', '2026-01-15', '2026-04-15', true);
