-- Attendance slice: table + RLS policies
-- Run after profiles, sessions, classes, and learners scripts.

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

create policy attendance_select_educator_scope
  on public.attendance_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = attendance_records.session_id
        and s.educator_id = auth.uid()::text
    )
  );

create policy attendance_select_parent_student_scope
  on public.attendance_records
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'student' and attendance_records.learner_id = p.id::text)
          or (
            p.role = 'parent'
            and exists (
              select 1
              from public.learners l
              where l.id = attendance_records.learner_id
                and lower(l.parent_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
            )
          )
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
        and s.educator_id = p.id::text
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      join public.sessions s on s.id = attendance_records.session_id
      where p.id = auth.uid()
        and p.role = 'educator'
        and s.educator_id = p.id::text
    )
  );

commit;
