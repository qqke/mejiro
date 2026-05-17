-- v11 -> v12/v13 migration
-- Run this in Supabase SQL Editor after v1 through v11 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'parking_space_kind' and typnamespace = 'public'::regnamespace) then
    create type public.parking_space_kind as enum ('car', 'bicycle', 'motorbike');
  end if;

  if not exists (select 1 from pg_type where typname = 'parking_permit_status' and typnamespace = 'public'::regnamespace) then
    create type public.parking_permit_status as enum ('pending', 'active', 'rejected', 'ended');
  end if;

  if not exists (select 1 from pg_type where typname = 'resident_request_category' and typnamespace = 'public'::regnamespace) then
    create type public.resident_request_category as enum ('noise', 'rule', 'neighbor', 'common_area', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'resident_request_status' and typnamespace = 'public'::regnamespace) then
    create type public.resident_request_status as enum ('open', 'in_progress', 'resolved', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'resident_request_visibility' and typnamespace = 'public'::regnamespace) then
    create type public.resident_request_visibility as enum ('private', 'board', 'public');
  end if;
end $$;

create table if not exists public.parking_spaces (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  kind public.parking_space_kind not null,
  location text,
  monthly_fee integer check (monthly_fee is null or monthly_fee >= 0),
  is_active boolean not null default true,
  is_available boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, kind)
);

create table if not exists public.parking_permits (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.parking_spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_label text not null,
  status public.parking_permit_status not null default 'pending',
  start_date date not null,
  end_date date,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parking_permit_date_order check (end_date is null or end_date >= start_date)
);

alter table public.parking_spaces
add column if not exists is_available boolean not null default true;

create unique index if not exists parking_permits_one_active_per_space
on public.parking_permits(space_id)
where status = 'active';

create table if not exists public.resident_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.resident_request_category not null default 'other',
  visibility public.resident_request_visibility not null default 'private',
  status public.resident_request_status not null default 'open',
  body text not null,
  response text,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  handled_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'parking_spaces_set_updated_at') then
    create trigger parking_spaces_set_updated_at
    before update on public.parking_spaces
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'parking_permits_set_updated_at') then
    create trigger parking_permits_set_updated_at
    before update on public.parking_permits
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'resident_requests_set_updated_at') then
    create trigger resident_requests_set_updated_at
    before update on public.resident_requests
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.parking_spaces enable row level security;
alter table public.parking_permits enable row level security;
alter table public.resident_requests enable row level security;

drop policy if exists "parking_spaces_select_authenticated" on public.parking_spaces;
create policy "parking_spaces_select_authenticated"
on public.parking_spaces for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "parking_spaces_manager_insert" on public.parking_spaces;
create policy "parking_spaces_manager_insert"
on public.parking_spaces for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "parking_spaces_manager_update" on public.parking_spaces;
create policy "parking_spaces_manager_update"
on public.parking_spaces for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "parking_permits_select_own_or_manager" on public.parking_permits;
create policy "parking_permits_select_own_or_manager"
on public.parking_permits for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "parking_permits_insert_own" on public.parking_permits;
create policy "parking_permits_insert_own"
on public.parking_permits for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "parking_permits_manager_update" on public.parking_permits;
create policy "parking_permits_manager_update"
on public.parking_permits for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "resident_requests_select_visible" on public.resident_requests;
create policy "resident_requests_select_visible"
on public.resident_requests for select
to authenticated
using (
  requester_id = auth.uid()
  or visibility = 'public'
  or (visibility = 'board' and app_private.has_role(array['board_member', 'admin']::public.app_role[]))
  or app_private.has_role(array['board_member', 'admin']::public.app_role[])
);

drop policy if exists "resident_requests_insert_own" on public.resident_requests;
create policy "resident_requests_insert_own"
on public.resident_requests for insert
to authenticated
with check (requester_id = auth.uid() and status = 'open');

drop policy if exists "resident_requests_update_own_or_manager" on public.resident_requests;
create policy "resident_requests_update_own_or_manager"
on public.resident_requests for update
to authenticated
using (requester_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (requester_id = auth.uid() and status in ('open', 'closed'))
);

grant usage on schema public to authenticated;
grant select, insert, update on public.parking_spaces to authenticated;
grant select, insert, update on public.parking_permits to authenticated;
grant select, insert, update on public.resident_requests to authenticated;
