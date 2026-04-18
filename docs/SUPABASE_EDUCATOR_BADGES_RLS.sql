-- Educator badges: table + RLS
-- Mirrors Prisma `EducatorBadge` / REST `GET /v1/educators/:id/badges` (see `server/prisma/schema.prisma`).
-- Used by `src/hooks/useEducatorBadges.ts` for admin educator profile detail and educator self-profile.
--
-- Prerequisites: `public.profiles` exists (`docs/SUPABASE_PROFILES_RLS.sql`).

begin;

create table if not exists public.educator_badges (
  id text primary key,
  educator_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  track_id text null,
  earned_at text not null
);

create index if not exists educator_badges_educator_id_idx
  on public.educator_badges (educator_id);
create index if not exists educator_badges_earned_at_idx
  on public.educator_badges (earned_at desc);

alter table public.educator_badges enable row level security;

drop policy if exists educator_badges_select_scope on public.educator_badges;

-- Educators see their own rows; admin / finance / LD see all (team profiles, reporting).
create policy educator_badges_select_scope
  on public.educator_badges
  for select
  to authenticated
  using (
    educator_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager')
    )
  );

commit;

-- ---------------------------------------------------------------------------
-- 6) Writes — staff only (award / correct badge rows from admin tools or API)
-- ---------------------------------------------------------------------------

drop policy if exists educator_badges_insert_staff on public.educator_badges;
create policy educator_badges_insert_staff
  on public.educator_badges
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

drop policy if exists educator_badges_update_staff on public.educator_badges;
create policy educator_badges_update_staff
  on public.educator_badges
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

drop policy if exists educator_badges_delete_staff on public.educator_badges;
create policy educator_badges_delete_staff
  on public.educator_badges
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
