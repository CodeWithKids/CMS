-- Attendance slice: table + RLS policies
-- Prerequisites: `public.profiles`, `public.classes`, `public.learners`, and **`public.sessions`**
-- (run `docs/SUPABASE_SESSIONS_RLS.sql` first — attendance policies join `sessions`).

begin;

create table if not exists public.attendance_records (
  session_id text not null,
  learner_id text not null,
  status text not null default 'present',
  stars int null,
  notes text null,
  marked_at timestamptz null,
  marked_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, learner_id)
);

create index if not exists attendance_records_learner_id_idx on public.attendance_records (learner_id);
create index if not exists attendance_records_marked_by_idx on public.attendance_records (marked_by);

create or replace function public.set_attendance_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_attendance_records_updated_at on public.attendance_records;
create trigger trg_attendance_records_updated_at
before update on public.attendance_records
for each row execute function public.set_attendance_updated_at();

alter table public.attendance_records enable row level security;

drop policy if exists attendance_select_admin_finance_ld on public.attendance_records;
drop policy if exists attendance_select_educator_scope on public.attendance_records;
drop policy if exists attendance_select_parent_scope on public.attendance_records;
drop policy if exists attendance_select_student_scope on public.attendance_records;
drop policy if exists attendance_select_parent_student_scope on public.attendance_records;
drop policy if exists attendance_write_admin_finance on public.attendance_records;
drop policy if exists attendance_write_educator_scope on public.attendance_records;

create policy attendance_select_admin_finance_ld
  on public.attendance_records
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

-- Lead or assistant on the session (matches app: `lead_educator_id` / `assistant_educator_ids`)
create policy attendance_select_educator_scope
  on public.attendance_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = attendance_records.session_id
        and (
          s.lead_educator_id = auth.uid()::text
          or auth.uid()::text = any (coalesce(s.assistant_educator_ids, '{}'))
        )
    )
  );

-- Parent: learner on this row is their child and on the session's class roster
create policy attendance_select_parent_scope
  on public.attendance_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      join public.classes c on c.id = s.class_id
      where s.id = attendance_records.session_id
        and exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'parent'
        )
        and exists (
          select 1
          from public.learners l
          where l.id = attendance_records.learner_id
            and l.id = any (c.learner_ids)
            and lower(coalesce(l.parent_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
  );

-- Student: linked learner matches row and is on the class roster
create policy attendance_select_student_scope
  on public.attendance_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      join public.classes c on c.id = s.class_id
      where s.id = attendance_records.session_id
        and exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and p.role = 'student'
        )
        and exists (
          select 1
          from public.learners l
          where l.id = attendance_records.learner_id
            and l.user_id = auth.uid()
            and l.id = any (c.learner_ids)
        )
    )
  );

create policy attendance_write_admin_finance
  on public.attendance_records
  for all
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

create policy attendance_write_educator_scope
  on public.attendance_records
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.sessions s on s.id = attendance_records.session_id
      where p.id = auth.uid()
        and p.role = 'educator'
        and (
          s.lead_educator_id = p.id::text
          or p.id::text = any (coalesce(s.assistant_educator_ids, '{}'))
        )
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      join public.sessions s on s.id = attendance_records.session_id
      where p.id = auth.uid()
        and p.role = 'educator'
        and (
          s.lead_educator_id = p.id::text
          or p.id::text = any (coalesce(s.assistant_educator_ids, '{}'))
        )
    )
  );

commit;
