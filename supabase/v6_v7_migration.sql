-- v5 -> v6/v7 migration
-- Run this in Supabase SQL Editor after v1 through v5 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'asset_category' and typnamespace = 'public'::regnamespace) then
    create type public.asset_category as enum ('equipment', 'fixture', 'disaster', 'document', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'asset_status' and typnamespace = 'public'::regnamespace) then
    create type public.asset_status as enum ('active', 'inspection_due', 'repair_needed', 'retired');
  end if;

  if not exists (select 1 from pg_type where typname = 'contract_status' and typnamespace = 'public'::regnamespace) then
    create type public.contract_status as enum ('active', 'renewal_due', 'expired', 'terminated');
  end if;
end $$;

create table if not exists public.asset_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.asset_category not null default 'other',
  status public.asset_status not null default 'active',
  location text not null,
  inspection_due_at date,
  note text,
  managed_by uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  contact_name text,
  phone text,
  email text,
  note text,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vendor_contracts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  title text not null,
  status public.contract_status not null default 'active',
  start_date date not null,
  end_date date not null,
  amount integer check (amount is null or amount >= 0),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vendor_contract_time_order check (end_date >= start_date)
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'assets_set_updated_at') then
    create trigger assets_set_updated_at
    before update on public.asset_items
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'vendors_set_updated_at') then
    create trigger vendors_set_updated_at
    before update on public.vendors
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'vendor_contracts_set_updated_at') then
    create trigger vendor_contracts_set_updated_at
    before update on public.vendor_contracts
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.asset_items enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_contracts enable row level security;

drop policy if exists "assets_select_authenticated" on public.asset_items;
create policy "assets_select_authenticated"
on public.asset_items for select
to authenticated
using (true);

drop policy if exists "assets_manager_insert" on public.asset_items;
create policy "assets_manager_insert"
on public.asset_items for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "assets_manager_update" on public.asset_items;
create policy "assets_manager_update"
on public.asset_items for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "vendors_select_authenticated" on public.vendors;
create policy "vendors_select_authenticated"
on public.vendors for select
to authenticated
using (true);

drop policy if exists "vendors_manager_insert" on public.vendors;
create policy "vendors_manager_insert"
on public.vendors for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "vendors_manager_update" on public.vendors;
create policy "vendors_manager_update"
on public.vendors for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "vendor_contracts_select_authenticated" on public.vendor_contracts;
create policy "vendor_contracts_select_authenticated"
on public.vendor_contracts for select
to authenticated
using (true);

drop policy if exists "vendor_contracts_manager_insert" on public.vendor_contracts;
create policy "vendor_contracts_manager_insert"
on public.vendor_contracts for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "vendor_contracts_manager_update" on public.vendor_contracts;
create policy "vendor_contracts_manager_update"
on public.vendor_contracts for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

grant usage on schema public to authenticated;
grant select, insert, update on public.asset_items to authenticated;
grant select, insert, update on public.vendors to authenticated;
grant select, insert, update on public.vendor_contracts to authenticated;
