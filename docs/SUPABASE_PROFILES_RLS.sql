-- Profiles: table + trigger (new auth users) + RLS
-- Run FIRST in Supabase SQL Editor before learners/classes policies that reference public.profiles.
--
-- App expectations: src/context/AuthContext.tsx reads public.profiles by id = auth.users.id
--   role, status, name, email, organization_id, membership_status, avatar_id (snake_case in DB).

begin;

-- 1) Table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text null,
  name text null,
  role text not null default 'educator'
    check (role in (
      'admin', 'educator', 'finance', 'student', 'parent', 'organisation',
      'partnerships', 'marketing', 'social_media', 'ld_manager'
    )),
  status text not null default 'active'
    check (status in ('pending', 'active', 'rejected')),
  organization_id text null,
  membership_status text null
    check (membership_status is null or membership_status in ('active', 'inactive', 'expired')),
  avatar_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If `profiles` already existed (e.g. Supabase starter / old template), CREATE TABLE does nothing
-- and columns like `email` may be missing. Add any missing columns the app expects.
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists role text default 'educator';
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists organization_id text;
alter table public.profiles add column if not exists membership_status text;
alter table public.profiles add column if not exists avatar_id text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_org_idx on public.profiles (organization_id);

-- 2) Keep updated_at fresh (optional)
create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_profiles_updated_at();

-- 3) New Supabase Auth user → profile row (runs with definer rights; bypasses RLS on insert)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text;
  meta_name text;
  meta_status text;
begin
  meta_role := lower(trim(coalesce(new.raw_user_meta_data->>'role', '')));
  if meta_role = '' or meta_role not in (
    'admin', 'educator', 'finance', 'student', 'parent', 'organisation',
    'partnerships', 'marketing', 'social_media', 'ld_manager'
  ) then
    meta_role := 'educator';
  end if;

  meta_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');
  if meta_name is null then
    meta_name := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  meta_status := lower(trim(coalesce(new.raw_user_meta_data->>'status', '')));
  if meta_status not in ('pending', 'active', 'rejected') then
    meta_status := 'active';
  end if;

  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    new.email,
    meta_name,
    meta_role,
    meta_status
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Backfill profiles for existing auth.users (run once after adding trigger)
insert into public.profiles (id, email, name, role, status)
select
  u.id,
  u.email,
  coalesce(
    nullif(trim(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')), ''),
    split_part(coalesce(u.email, 'user'), '@', 1)
  ),
  case
    when lower(trim(coalesce(u.raw_user_meta_data->>'role', ''))) in (
      'admin', 'educator', 'finance', 'student', 'parent', 'organisation',
      'partnerships', 'marketing', 'social_media', 'ld_manager'
    ) then lower(trim(u.raw_user_meta_data->>'role'))
    else 'educator'
  end,
  'active'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- 5) RLS
alter table public.profiles enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

-- Staff roles can list all profiles (subquery only touches own row → no recursion)
drop policy if exists profiles_select_staff on public.profiles;
create policy profiles_select_staff
  on public.profiles
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

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

commit;

-- ---------------------------------------------------------------------------
-- 6) Staff updates (admin / finance) — optional; for staff directory / approvals
-- ---------------------------------------------------------------------------

drop policy if exists profiles_update_admin_finance on public.profiles;
create policy profiles_update_admin_finance
  on public.profiles
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

-- Manual bootstrap: set first user to admin (run in SQL Editor once you know their UUID)
-- update public.profiles set role = 'admin', status = 'active' where email = 'you@example.com';
