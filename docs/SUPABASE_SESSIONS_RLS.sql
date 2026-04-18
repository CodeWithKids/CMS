-- Sessions slice: table + RLS policies
-- Run after `public.profiles`, `public.terms`, `public.classes`, and `public.learners` exist.
-- Required before `docs/SUPABASE_ATTENDANCE_RLS.sql` (attendance policies join this table).

begin;

create table if not exists public.sessions (
  id text primary key,
  class_id text not null references public.classes (id) on delete cascade,
  date text not null,
  start_time text not null default '09:00',
  end_time text not null default '10:00',
  topic text not null default '',
  session_type text not null default 'makerspace',
  duration_hours double precision not null default 1,
  learning_track text not null default 'computer_basics',
  term_id text not null,
  lead_educator_id text not null,
  assistant_educator_ids text[] not null default '{}'
);

create index if not exists sessions_class_id_idx on public.sessions (class_id);
create index if not exists sessions_term_id_idx on public.sessions (term_id);
create index if not exists sessions_lead_educator_id_idx on public.sessions (lead_educator_id);
create index if not exists sessions_date_idx on public.sessions (date);

alter table public.sessions enable row level security;

drop policy if exists sessions_select_admin_finance_ld on public.sessions;
drop policy if exists sessions_select_educator_scope on public.sessions;
drop policy if exists sessions_select_organisation_scope on public.sessions;
drop policy if exists sessions_select_parent_scope on public.sessions;
drop policy if exists sessions_select_student_scope on public.sessions;

-- Admin / finance / LD can read all sessions
create policy sessions_select_admin_finance_ld
  on public.sessions
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

-- Lead or assistant educator on the session
create policy sessions_select_educator_scope
  on public.sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'educator'
    )
    and (
      sessions.lead_educator_id = auth.uid()::text
      or auth.uid()::text = any (coalesce(sessions.assistant_educator_ids, '{}'))
    )
  );

-- Organisation: session's class includes a learner from their org
create policy sessions_select_organisation_scope
  on public.sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.classes c on c.id = sessions.class_id
      where p.id = auth.uid()
        and p.role = 'organisation'
        and p.organization_id is not null
        and exists (
          select 1
          from public.learners l
          where l.organization_id = p.organization_id
            and l.id = any (c.learner_ids)
        )
    )
  );

-- Parent: JWT email matches a learner on the session's class roster
create policy sessions_select_parent_scope
  on public.sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.classes c on c.id = sessions.class_id
      where p.id = auth.uid()
        and p.role = 'parent'
        and exists (
          select 1
          from public.learners l
          where lower(coalesce(l.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
            and l.id = any (c.learner_ids)
        )
    )
  );

-- Student: profile-linked learner is on the class roster
create policy sessions_select_student_scope
  on public.sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.classes c on c.id = sessions.class_id
      where p.id = auth.uid()
        and p.role = 'student'
        and exists (
          select 1
          from public.learners l
          where l.user_id = auth.uid()
            and l.id = any (c.learner_ids)
        )
    )
  );

commit;

-- ---------------------------------------------------------------------------
-- 6) Write policies — staff + educators (adjust if you prefer RPC-only writes)
-- ---------------------------------------------------------------------------

drop policy if exists sessions_insert_admin_finance on public.sessions;
create policy sessions_insert_admin_finance
  on public.sessions
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

drop policy if exists sessions_update_admin_finance on public.sessions;
create policy sessions_update_admin_finance
  on public.sessions
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

drop policy if exists sessions_delete_admin_finance on public.sessions;
create policy sessions_delete_admin_finance
  on public.sessions
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

drop policy if exists sessions_insert_educator_scope on public.sessions;
create policy sessions_insert_educator_scope
  on public.sessions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'educator'
    )
    and (
      sessions.lead_educator_id = auth.uid()::text
      or auth.uid()::text = any (coalesce(sessions.assistant_educator_ids, '{}'))
    )
  );

drop policy if exists sessions_update_educator_scope on public.sessions;
create policy sessions_update_educator_scope
  on public.sessions
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'educator'
    )
    and (
      sessions.lead_educator_id = auth.uid()::text
      or auth.uid()::text = any (coalesce(sessions.assistant_educator_ids, '{}'))
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'educator'
    )
    and (
      sessions.lead_educator_id = auth.uid()::text
      or auth.uid()::text = any (coalesce(sessions.assistant_educator_ids, '{}'))
    )
  );

drop policy if exists sessions_delete_educator_scope on public.sessions;
create policy sessions_delete_educator_scope
  on public.sessions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'educator'
    )
    and (
      sessions.lead_educator_id = auth.uid()::text
      or auth.uid()::text = any (coalesce(sessions.assistant_educator_ids, '{}'))
    )
  );
