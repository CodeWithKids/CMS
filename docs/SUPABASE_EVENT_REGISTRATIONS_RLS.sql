-- Event registrations: table + RLS
-- Used by `EventRegistrationsContext` and parent/organisation event registration UI.

begin;

create table if not exists public.event_registrations (
  id text primary key,
  event_id text not null,
  learner_id text not null,
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists event_registrations_event_learner_unique
  on public.event_registrations (event_id, learner_id);
create index if not exists event_registrations_event_idx on public.event_registrations (event_id);
create index if not exists event_registrations_learner_idx on public.event_registrations (learner_id);

alter table public.event_registrations enable row level security;

drop policy if exists event_registrations_select_staff on public.event_registrations;
drop policy if exists event_registrations_select_parent on public.event_registrations;
drop policy if exists event_registrations_select_organisation on public.event_registrations;
drop policy if exists event_registrations_select_student on public.event_registrations;
drop policy if exists event_registrations_insert_staff on public.event_registrations;
drop policy if exists event_registrations_insert_parent on public.event_registrations;
drop policy if exists event_registrations_insert_organisation on public.event_registrations;
drop policy if exists event_registrations_delete_staff on public.event_registrations;
drop policy if exists event_registrations_delete_parent on public.event_registrations;
drop policy if exists event_registrations_delete_organisation on public.event_registrations;

create policy event_registrations_select_staff
  on public.event_registrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager', 'educator')
    )
  );

create policy event_registrations_select_parent
  on public.event_registrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.learners l on l.id = event_registrations.learner_id
      where p.id = auth.uid()
        and p.role = 'parent'
        and lower(coalesce(l.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy event_registrations_select_organisation
  on public.event_registrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.learners l on l.id = event_registrations.learner_id
      where p.id = auth.uid()
        and p.role = 'organisation'
        and p.organization_id is not null
        and l.organization_id = p.organization_id
    )
  );

create policy event_registrations_select_student
  on public.event_registrations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.learners l on l.id = event_registrations.learner_id
      where p.id = auth.uid()
        and p.role = 'student'
        and l.user_id = p.id
    )
  );

create policy event_registrations_insert_staff
  on public.event_registrations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager', 'educator')
    )
  );

create policy event_registrations_insert_parent
  on public.event_registrations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      join public.learners l on l.id = event_registrations.learner_id
      where p.id = auth.uid()
        and p.role = 'parent'
        and lower(coalesce(l.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy event_registrations_insert_organisation
  on public.event_registrations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      join public.learners l on l.id = event_registrations.learner_id
      where p.id = auth.uid()
        and p.role = 'organisation'
        and p.organization_id is not null
        and l.organization_id = p.organization_id
    )
  );

create policy event_registrations_delete_staff
  on public.event_registrations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'ld_manager', 'educator')
    )
  );

create policy event_registrations_delete_parent
  on public.event_registrations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.learners l on l.id = event_registrations.learner_id
      where p.id = auth.uid()
        and p.role = 'parent'
        and lower(coalesce(l.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy event_registrations_delete_organisation
  on public.event_registrations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.learners l on l.id = event_registrations.learner_id
      where p.id = auth.uid()
        and p.role = 'organisation'
        and p.organization_id is not null
        and l.organization_id = p.organization_id
    )
  );

commit;
