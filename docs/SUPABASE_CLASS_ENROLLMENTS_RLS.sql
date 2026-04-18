-- Class enrollments slice: table + RLS policies
-- Run after profiles, classes, and learners scripts.

begin;

create table if not exists public.class_enrollments (
  id text primary key,
  class_id text not null,
  learner_id text not null,
  term_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists class_enrollments_unique_triplet_idx
  on public.class_enrollments (class_id, learner_id, term_id);
create index if not exists class_enrollments_class_id_idx on public.class_enrollments (class_id);
create index if not exists class_enrollments_learner_id_idx on public.class_enrollments (learner_id);
create index if not exists class_enrollments_term_id_idx on public.class_enrollments (term_id);

create or replace function public.set_class_enrollments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_class_enrollments_updated_at on public.class_enrollments;
create trigger trg_class_enrollments_updated_at
before update on public.class_enrollments
for each row execute function public.set_class_enrollments_updated_at();

alter table public.class_enrollments enable row level security;

drop policy if exists class_enrollments_select_admin_finance_ld on public.class_enrollments;
drop policy if exists class_enrollments_select_educator_scope on public.class_enrollments;
drop policy if exists class_enrollments_select_learner_scope on public.class_enrollments;
drop policy if exists class_enrollments_write_admin_finance on public.class_enrollments;
drop policy if exists class_enrollments_write_educator_scope on public.class_enrollments;

create policy class_enrollments_select_admin_finance_ld
  on public.class_enrollments
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

create policy class_enrollments_select_educator_scope
  on public.class_enrollments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.classes c
      where c.id = class_enrollments.class_id
        and c.educator_id = auth.uid()::text
    )
  );

create policy class_enrollments_select_learner_scope
  on public.class_enrollments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          (p.role = 'student' and class_enrollments.learner_id = p.id::text)
          or (
            p.role = 'parent'
            and exists (
              select 1
              from public.learners l
              where l.id = class_enrollments.learner_id
                and lower(l.parent_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
            )
          )
        )
    )
  );

create policy class_enrollments_write_admin_finance
  on public.class_enrollments
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

create policy class_enrollments_write_educator_scope
  on public.class_enrollments
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      join public.classes c on c.id = class_enrollments.class_id
      where p.id = auth.uid()
        and p.role = 'educator'
        and c.educator_id = p.id::text
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      join public.classes c on c.id = class_enrollments.class_id
      where p.id = auth.uid()
        and p.role = 'educator'
        and c.educator_id = p.id::text
    )
  );

commit;
