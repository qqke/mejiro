-- 団地管理組合電子化システム v1
-- Supabase SQL Editor で実行してください。

create extension if not exists btree_gist;

create type public.app_role as enum ('resident', 'board_member', 'admin');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.notice_kind as enum ('notice', 'meeting', 'topic');
create type public.notice_target_role as enum ('all', 'resident', 'board_member', 'admin');
create type public.document_kind as enum ('minutes', 'rule', 'estimate', 'approval', 'other');
create type public.document_status as enum ('review', 'approved', 'rejected', 'archived');
create type public.document_approval_action as enum ('approved', 'rejected');
create type public.maintenance_category as enum ('common_area', 'equipment', 'safety', 'cleaning', 'other');
create type public.maintenance_priority as enum ('normal', 'high', 'urgent');
create type public.maintenance_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.finance_entry_type as enum ('income', 'expense');
create type public.asset_category as enum ('equipment', 'fixture', 'disaster', 'document', 'other');
create type public.asset_status as enum ('active', 'inspection_due', 'repair_needed', 'retired');
create type public.contract_status as enum ('active', 'renewal_due', 'expired', 'terminated');

create schema if not exists app_private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'resident',
  building text,
  unit_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity integer,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.room_bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  purpose text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.booking_status not null default 'pending',
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint booking_time_order check (end_at > start_at),
  constraint approved_booking_no_overlap exclude using gist (
    room_id with =,
    tstzrange(start_at, end_at, '[)') with &&
  ) where (status = 'approved')
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  kind public.notice_kind not null default 'notice',
  target_role public.notice_target_role not null default 'all',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.notice_reads (
  notice_id uuid not null references public.notices(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint event_time_order check (end_at is null or end_at > start_at)
);

create table public.management_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.document_kind not null default 'other',
  version text not null default '1.0',
  summary text not null,
  file_url text,
  status public.document_status not null default 'review',
  created_by uuid not null references public.profiles(id) on delete cascade,
  updated_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_approvals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action public.document_approval_action not null,
  comment text,
  created_at timestamptz not null default now()
);

create table public.document_seals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  sealed_by uuid not null references public.profiles(id) on delete cascade,
  seal_name text not null,
  sealed_at timestamptz not null default now(),
  note text
);

create table public.maintenance_requests (
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

create table public.finance_entries (
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

create table public.asset_items (
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

create table public.vendors (
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

create table public.vendor_contracts (
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

create or replace function app_private.has_role(required_roles public.app_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = any(required_roles)
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'resident'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger documents_set_updated_at
before update on public.management_documents
for each row execute function public.set_updated_at();

create trigger maintenance_set_updated_at
before update on public.maintenance_requests
for each row execute function public.set_updated_at();

create trigger finance_set_updated_at
before update on public.finance_entries
for each row execute function public.set_updated_at();

create trigger assets_set_updated_at
before update on public.asset_items
for each row execute function public.set_updated_at();

create trigger vendors_set_updated_at
before update on public.vendors
for each row execute function public.set_updated_at();

create trigger vendor_contracts_set_updated_at
before update on public.vendor_contracts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_bookings enable row level security;
alter table public.notices enable row level security;
alter table public.notice_reads enable row level security;
alter table public.events enable row level security;
alter table public.management_documents enable row level security;
alter table public.document_approvals enable row level security;
alter table public.document_seals enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.finance_entries enable row level security;
alter table public.asset_items enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_contracts enable row level security;

create policy "profiles_select_own_or_manager"
on public.profiles for select
to authenticated
using (id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid() and role = 'resident');

create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (app_private.has_role(array['admin']::public.app_role[]))
with check (app_private.has_role(array['admin']::public.app_role[]));

create policy "rooms_select_authenticated"
on public.rooms for select
to authenticated
using (is_active = true or app_private.has_role(array['admin']::public.app_role[]));

create policy "rooms_admin_insert"
on public.rooms for insert
to authenticated
with check (app_private.has_role(array['admin']::public.app_role[]));

create policy "rooms_admin_update"
on public.rooms for update
to authenticated
using (app_private.has_role(array['admin']::public.app_role[]))
with check (app_private.has_role(array['admin']::public.app_role[]));

create policy "bookings_select_own_or_manager"
on public.room_bookings for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "bookings_insert_own_pending"
on public.room_bookings for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

create policy "bookings_manager_update"
on public.room_bookings for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "notices_select_target"
on public.notices for select
to authenticated
using (
  target_role = 'all'
  or target_role::text = (
    select role::text from public.profiles where id = auth.uid()
  )
);

create policy "notices_manager_insert"
on public.notices for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "notice_reads_own_select"
on public.notice_reads for select
to authenticated
using (user_id = auth.uid());

create policy "notice_reads_own_insert"
on public.notice_reads for insert
to authenticated
with check (user_id = auth.uid());

create policy "notice_reads_own_update"
on public.notice_reads for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "events_select_authenticated"
on public.events for select
to authenticated
using (true);

create policy "events_manager_insert"
on public.events for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "events_manager_update"
on public.events for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "events_manager_delete"
on public.events for delete
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "documents_select_authenticated"
on public.management_documents for select
to authenticated
using (true);

create policy "documents_manager_insert"
on public.management_documents for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "documents_manager_update"
on public.management_documents for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "document_approvals_select_authenticated"
on public.document_approvals for select
to authenticated
using (true);

create policy "document_approvals_manager_insert"
on public.document_approvals for insert
to authenticated
with check (actor_id = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "document_seals_select_authenticated"
on public.document_seals for select
to authenticated
using (true);

create policy "document_seals_manager_insert"
on public.document_seals for insert
to authenticated
with check (sealed_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "maintenance_select_own_or_manager"
on public.maintenance_requests for select
to authenticated
using (requester_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "maintenance_insert_own"
on public.maintenance_requests for insert
to authenticated
with check (requester_id = auth.uid() and status = 'open');

create policy "maintenance_update_own_or_manager"
on public.maintenance_requests for update
to authenticated
using (requester_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (requester_id = auth.uid() and status in ('open', 'closed'))
);

create policy "finance_select_authenticated"
on public.finance_entries for select
to authenticated
using (true);

create policy "finance_manager_insert"
on public.finance_entries for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "finance_manager_update"
on public.finance_entries for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "assets_select_authenticated"
on public.asset_items for select
to authenticated
using (true);

create policy "assets_manager_insert"
on public.asset_items for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "assets_manager_update"
on public.asset_items for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "vendors_select_authenticated"
on public.vendors for select
to authenticated
using (true);

create policy "vendors_manager_insert"
on public.vendors for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "vendors_manager_update"
on public.vendors for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "vendor_contracts_select_authenticated"
on public.vendor_contracts for select
to authenticated
using (true);

create policy "vendor_contracts_manager_insert"
on public.vendor_contracts for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "vendor_contracts_manager_update"
on public.vendor_contracts for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

insert into public.rooms (name, capacity, notes)
values
  ('集会室 A', 24, '理事会・小規模会議向け'),
  ('集会室 B', 40, '総会準備・住民説明会向け')
on conflict do nothing;
