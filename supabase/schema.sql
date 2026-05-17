-- 団地管理組合電子化システム v1
-- Supabase SQL Editor で実行してください。

create extension if not exists btree_gist;

create type public.app_role as enum ('resident', 'board_member', 'admin');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.notice_kind as enum ('notice', 'meeting', 'topic');
create type public.notice_target_role as enum ('all', 'resident', 'board_member', 'admin');

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

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_bookings enable row level security;
alter table public.notices enable row level security;
alter table public.notice_reads enable row level security;
alter table public.events enable row level security;

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

insert into public.rooms (name, capacity, notes)
values
  ('集会室 A', 24, '理事会・小規模会議向け'),
  ('集会室 B', 40, '総会準備・住民説明会向け')
on conflict do nothing;
