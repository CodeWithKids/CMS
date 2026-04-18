-- Link learners to a parent auth user; broaden parent SELECT RLS.
-- Run in Supabase SQL Editor after `public.learners` and base policies from SUPABASE_LEARNERS_RLS.sql exist.

begin;

alter table public.learners
  add column if not exists parent_user_id uuid null references auth.users(id) on delete set null;

create index if not exists learners_parent_user_id_idx on public.learners (parent_user_id);

drop policy if exists learners_select_parent_scope on public.learners;

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
    and (
      lower(coalesce(learners.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      or learners.parent_user_id = auth.uid()
    )
  );

commit;
