-- Finance account expenses: table + RLS
-- Used by `FinanceAccountContext` for expenses pages.

begin;

create table if not exists public.finance_account_expenses (
  id text primary key,
  category text not null,
  description text not null,
  amount numeric not null default 0,
  date text not null,
  paid_to text not null default '',
  reference text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_account_expenses_date_idx
  on public.finance_account_expenses (date);
create index if not exists finance_account_expenses_category_idx
  on public.finance_account_expenses (category);

create or replace function public.set_finance_account_expenses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_finance_account_expenses_updated_at on public.finance_account_expenses;
create trigger trg_finance_account_expenses_updated_at
before update on public.finance_account_expenses
for each row execute function public.set_finance_account_expenses_updated_at();

alter table public.finance_account_expenses enable row level security;

drop policy if exists finance_account_expenses_select_authenticated on public.finance_account_expenses;
drop policy if exists finance_account_expenses_write_admin_finance on public.finance_account_expenses;

create policy finance_account_expenses_select_authenticated
  on public.finance_account_expenses
  for select
  to authenticated
  using (true);

create policy finance_account_expenses_write_admin_finance
  on public.finance_account_expenses
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

commit;
