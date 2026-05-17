-- v3 -> v4/v5 migration
-- Run this in Supabase SQL Editor after v1 plus v2/v3 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'maintenance_category' and typnamespace = 'public'::regnamespace) then
    create type public.maintenance_category as enum ('common_area', 'equipment', 'safety', 'cleaning', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'maintenance_priority' and typnamespace = 'public'::regnamespace) then
    create type public.maintenance_priority as enum ('normal', 'high', 'urgent');
  end if;

  if not exists (select 1 from pg_type where typname = 'maintenance_status' and typnamespace = 'public'::regnamespace) then
    create type public.maintenance_status as enum ('open', 'in_progress', 'resolved', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'finance_entry_type' and typnamespace = 'public'::regnamespace) then
    create type public.finance_entry_type as enum ('income', 'expense');
  end if;
end $$;

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.maintenance_category not null default 'other',
  priority public.maintenance_priority not null default 'normal',
  status public.maintenance_status not null default 'open',
  location text not null,
  description text not null,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  handled_by uuid references public.profiles(id),
  handler_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  entry_type public.finance_entry_type not null,
  category text not null,
  amount integer not null check (amount >= 0),
  entry_date date not null,
  note text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'maintenance_set_updated_at') then
    create trigger maintenance_set_updated_at
    before update on public.maintenance_requests
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'finance_set_updated_at') then
    create trigger finance_set_updated_at
    before update on public.finance_entries
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.maintenance_requests enable row level security;
alter table public.finance_entries enable row level security;

drop policy if exists "maintenance_select_own_or_manager" on public.maintenance_requests;
create policy "maintenance_select_own_or_manager"
on public.maintenance_requests for select
to authenticated
using (requester_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "maintenance_insert_own" on public.maintenance_requests;
create policy "maintenance_insert_own"
on public.maintenance_requests for insert
to authenticated
with check (requester_id = auth.uid() and status = 'open');

drop policy if exists "maintenance_update_own_or_manager" on public.maintenance_requests;
create policy "maintenance_update_own_or_manager"
on public.maintenance_requests for update
to authenticated
using (requester_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (requester_id = auth.uid() and status in ('open', 'closed'))
);

drop policy if exists "finance_select_authenticated" on public.finance_entries;
create policy "finance_select_authenticated"
on public.finance_entries for select
to authenticated
using (true);

drop policy if exists "finance_manager_insert" on public.finance_entries;
create policy "finance_manager_insert"
on public.finance_entries for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "finance_manager_update" on public.finance_entries;
create policy "finance_manager_update"
on public.finance_entries for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));
