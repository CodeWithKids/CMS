-- Organisations table + RLS (snake_case columns; matches `useOrganisation` / admin org creation from the app)
-- Run after `public.profiles` exists. If you already have `public.organisations` from Prisma with camelCase columns,
-- either migrate columns to snake_case or adjust `adminCreateOrganisationAccountSupabase` in `src/lib/adminAccountsSupabase.ts`.

begin;

create table if not exists public.organisations (
  id text primary key,
  name text not null,
  type text not null default 'organisation',
  contact_person text not null default '',
  contact_email text null,
  contact_phone text null,
  location text not null default ''
);

create index if not exists organisations_name_idx on public.organisations (name);

alter table public.organisations enable row level security;

drop policy if exists organisations_select_authenticated on public.organisations;
create policy organisations_select_authenticated
  on public.organisations
  for select
  to authenticated
  using (true);

drop policy if exists organisations_insert_admin_finance on public.organisations;
create policy organisations_insert_admin_finance
  on public.organisations
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

drop policy if exists organisations_update_admin_finance on public.organisations;
create policy organisations_update_admin_finance
  on public.organisations
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

commit;
