-- v15 -> v16/v17 migration
-- Run this in Supabase SQL Editor after v1 through v15 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'duty_kind' and typnamespace = 'public'::regnamespace) then
    create type public.duty_kind as enum ('cleaning', 'patrol', 'meeting', 'garden', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'duty_status' and typnamespace = 'public'::regnamespace) then
    create type public.duty_status as enum ('planned', 'done', 'missed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'waste_category' and typnamespace = 'public'::regnamespace) then
    create type public.waste_category as enum ('burnable', 'non_burnable', 'recycle', 'oversized', 'hazardous', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'bulky_waste_status' and typnamespace = 'public'::regnamespace) then
    create type public.bulky_waste_status as enum ('submitted', 'scheduled', 'completed', 'cancelled');
  end if;
end $$;

create table if not exists public.duty_assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.duty_kind not null default 'other',
  status public.duty_status not null default 'planned',
  assignee_id uuid references public.profiles(id),
  scheduled_date date not null,
  location text,
  note text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.waste_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.waste_category not null default 'other',
  collection_day text not null,
  location text,
  note text,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bulky_waste_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_name text not null,
  status public.bulky_waste_status not null default 'submitted',
  preferred_date date,
  pickup_location text,
  note text,
  scheduled_date date,
  handled_by uuid references public.profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'duty_assignments_set_updated_at') then
    create trigger duty_assignments_set_updated_at
    before update on public.duty_assignments
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'waste_schedules_set_updated_at') then
    create trigger waste_schedules_set_updated_at
    before update on public.waste_schedules
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'bulky_waste_requests_set_updated_at') then
    create trigger bulky_waste_requests_set_updated_at
    before update on public.bulky_waste_requests
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.duty_assignments enable row level security;
alter table public.waste_schedules enable row level security;
alter table public.bulky_waste_requests enable row level security;

drop policy if exists "duty_assignments_select_own_or_manager" on public.duty_assignments;
create policy "duty_assignments_select_own_or_manager"
on public.duty_assignments for select
to authenticated
using (assignee_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "duty_assignments_manager_insert" on public.duty_assignments;
create policy "duty_assignments_manager_insert"
on public.duty_assignments for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "duty_assignments_update_assignee_or_manager" on public.duty_assignments;
create policy "duty_assignments_update_assignee_or_manager"
on public.duty_assignments for update
to authenticated
using (assignee_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (assignee_id = auth.uid() and status = 'done')
);

drop policy if exists "waste_schedules_select_active_or_manager" on public.waste_schedules;
create policy "waste_schedules_select_active_or_manager"
on public.waste_schedules for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "waste_schedules_manager_insert" on public.waste_schedules;
create policy "waste_schedules_manager_insert"
on public.waste_schedules for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "waste_schedules_manager_update" on public.waste_schedules;
create policy "waste_schedules_manager_update"
on public.waste_schedules for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "bulky_waste_requests_select_own_or_manager" on public.bulky_waste_requests;
create policy "bulky_waste_requests_select_own_or_manager"
on public.bulky_waste_requests for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "bulky_waste_requests_insert_own" on public.bulky_waste_requests;
create policy "bulky_waste_requests_insert_own"
on public.bulky_waste_requests for insert
to authenticated
with check (user_id = auth.uid() and status = 'submitted');

drop policy if exists "bulky_waste_requests_update_own_or_manager" on public.bulky_waste_requests;
create policy "bulky_waste_requests_update_own_or_manager"
on public.bulky_waste_requests for update
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (user_id = auth.uid() and status = 'cancelled')
);

grant usage on schema public to authenticated;
grant select, insert, update on public.duty_assignments to authenticated;
grant select, insert, update on public.waste_schedules to authenticated;
grant select, insert, update on public.bulky_waste_requests to authenticated;
