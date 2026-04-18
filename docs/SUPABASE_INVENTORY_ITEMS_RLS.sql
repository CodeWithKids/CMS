-- Inventory items: table upgrades + RLS
-- Keeps compatibility with older inventory schema while enabling Supabase-first context usage.

begin;

create table if not exists public.inventory_items (
  id text primary key,
  name text not null,
  category text not null,
  status text not null default 'available',
  asset_tag text null,
  quantity int not null default 1,
  location text not null default 'Main store',
  purchase_date text null,
  checked_out_by_educator_id text null,
  assigned_educator_id text null,
  checked_out_at text null,
  due_at text null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory_items add column if not exists asset_tag text null;
alter table public.inventory_items add column if not exists quantity int not null default 1;
alter table public.inventory_items add column if not exists location text not null default 'Main store';
alter table public.inventory_items add column if not exists purchase_date text null;
alter table public.inventory_items add column if not exists checked_out_by_educator_id text null;
alter table public.inventory_items add column if not exists assigned_educator_id text null;
alter table public.inventory_items add column if not exists checked_out_at text null;
alter table public.inventory_items add column if not exists due_at text null;
alter table public.inventory_items add column if not exists notes text null;
alter table public.inventory_items add column if not exists created_at timestamptz not null default now();
alter table public.inventory_items add column if not exists updated_at timestamptz not null default now();

create index if not exists inventory_items_category_idx on public.inventory_items (category);
create index if not exists inventory_items_status_idx on public.inventory_items (status);
create index if not exists inventory_items_assigned_educator_idx on public.inventory_items (assigned_educator_id);

create or replace function public.set_inventory_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_inventory_items_updated_at on public.inventory_items;
create trigger trg_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.set_inventory_items_updated_at();

alter table public.inventory_items enable row level security;

drop policy if exists inventory_items_select_admin_finance_educator on public.inventory_items;
drop policy if exists inventory_items_write_admin_finance on public.inventory_items;

create policy inventory_items_select_admin_finance_educator
  on public.inventory_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'finance', 'educator', 'ld_manager')
    )
  );

create policy inventory_items_write_admin_finance
  on public.inventory_items
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
