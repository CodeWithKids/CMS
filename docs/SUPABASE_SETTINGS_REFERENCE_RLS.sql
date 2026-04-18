-- Reference tables for Admin Settings (academic + finance lists).
-- Used by src/lib/settingsReferenceDataSupabase.ts when Supabase is the backend.
-- Terms live in public.terms — apply docs/SUPABASE_TERMS_RLS.sql first.
-- Staff write access: admin, finance, ld_manager (match terms policies).

begin;

-- ——— Programs ———
create table if not exists public.programs (
  id text primary key,
  name text not null,
  description text,
  track_id text
);

create index if not exists programs_name_idx on public.programs (name);

alter table public.programs enable row level security;

drop policy if exists programs_select_authenticated on public.programs;
create policy programs_select_authenticated
  on public.programs for select to authenticated using (true);

drop policy if exists programs_insert_staff on public.programs;
create policy programs_insert_staff
  on public.programs for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists programs_update_staff on public.programs;
create policy programs_update_staff
  on public.programs for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists programs_delete_staff on public.programs;
create policy programs_delete_staff
  on public.programs for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

-- ——— Locations ———
create table if not exists public.locations (
  id text primary key,
  name text not null,
  address text
);

create index if not exists locations_name_idx on public.locations (name);

alter table public.locations enable row level security;

drop policy if exists locations_select_authenticated on public.locations;
create policy locations_select_authenticated
  on public.locations for select to authenticated using (true);

drop policy if exists locations_insert_staff on public.locations;
create policy locations_insert_staff
  on public.locations for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists locations_update_staff on public.locations;
create policy locations_update_staff
  on public.locations for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists locations_delete_staff on public.locations;
create policy locations_delete_staff
  on public.locations for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

-- ——— Age groups ———
create table if not exists public.age_groups (
  id text primary key,
  name text not null,
  min_age integer,
  max_age integer
);

create index if not exists age_groups_name_idx on public.age_groups (name);

alter table public.age_groups enable row level security;

drop policy if exists age_groups_select_authenticated on public.age_groups;
create policy age_groups_select_authenticated
  on public.age_groups for select to authenticated using (true);

drop policy if exists age_groups_insert_staff on public.age_groups;
create policy age_groups_insert_staff
  on public.age_groups for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists age_groups_update_staff on public.age_groups;
create policy age_groups_update_staff
  on public.age_groups for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists age_groups_delete_staff on public.age_groups;
create policy age_groups_delete_staff
  on public.age_groups for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

-- ——— Income sources ———
create table if not exists public.income_sources (
  id text primary key,
  name text not null,
  code text
);

create index if not exists income_sources_name_idx on public.income_sources (name);

alter table public.income_sources enable row level security;

drop policy if exists income_sources_select_authenticated on public.income_sources;
create policy income_sources_select_authenticated
  on public.income_sources for select to authenticated using (true);

drop policy if exists income_sources_insert_staff on public.income_sources;
create policy income_sources_insert_staff
  on public.income_sources for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists income_sources_update_staff on public.income_sources;
create policy income_sources_update_staff
  on public.income_sources for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists income_sources_delete_staff on public.income_sources;
create policy income_sources_delete_staff
  on public.income_sources for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

-- ——— Expense categories ———
create table if not exists public.expense_categories (
  id text primary key,
  name text not null,
  code text
);

create index if not exists expense_categories_name_idx on public.expense_categories (name);

alter table public.expense_categories enable row level security;

drop policy if exists expense_categories_select_authenticated on public.expense_categories;
create policy expense_categories_select_authenticated
  on public.expense_categories for select to authenticated using (true);

drop policy if exists expense_categories_insert_staff on public.expense_categories;
create policy expense_categories_insert_staff
  on public.expense_categories for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists expense_categories_update_staff on public.expense_categories;
create policy expense_categories_update_staff
  on public.expense_categories for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

drop policy if exists expense_categories_delete_staff on public.expense_categories;
create policy expense_categories_delete_staff
  on public.expense_categories for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

commit;
