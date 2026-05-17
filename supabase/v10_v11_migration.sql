-- v9 -> v10/v11 migration
-- Run this in Supabase SQL Editor after v1 through v9 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'safety_event_kind' and typnamespace = 'public'::regnamespace) then
    create type public.safety_event_kind as enum ('drill', 'inspection', 'checkin', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'safety_event_status' and typnamespace = 'public'::regnamespace) then
    create type public.safety_event_status as enum ('planned', 'active', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'safety_checkin_status' and typnamespace = 'public'::regnamespace) then
    create type public.safety_checkin_status as enum ('safe', 'needs_help');
  end if;

  if not exists (select 1 from pg_type where typname = 'board_task_status' and typnamespace = 'public'::regnamespace) then
    create type public.board_task_status as enum ('open', 'in_progress', 'done', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'board_task_priority' and typnamespace = 'public'::regnamespace) then
    create type public.board_task_priority as enum ('normal', 'high', 'urgent');
  end if;
end $$;

create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.safety_event_kind not null default 'other',
  status public.safety_event_status not null default 'planned',
  scheduled_at timestamptz not null,
  location text,
  note text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.safety_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.safety_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.safety_checkin_status not null default 'safe',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.board_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status public.board_task_status not null default 'open',
  priority public.board_task_priority not null default 'normal',
  assignee_id uuid references public.profiles(id),
  due_date date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'safety_events_set_updated_at') then
    create trigger safety_events_set_updated_at
    before update on public.safety_events
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'safety_checkins_set_updated_at') then
    create trigger safety_checkins_set_updated_at
    before update on public.safety_checkins
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'board_tasks_set_updated_at') then
    create trigger board_tasks_set_updated_at
    before update on public.board_tasks
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.safety_events enable row level security;
alter table public.safety_checkins enable row level security;
alter table public.board_tasks enable row level security;

drop policy if exists "safety_events_select_authenticated" on public.safety_events;
create policy "safety_events_select_authenticated"
on public.safety_events for select
to authenticated
using (true);

drop policy if exists "safety_events_manager_insert" on public.safety_events;
create policy "safety_events_manager_insert"
on public.safety_events for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "safety_events_manager_update" on public.safety_events;
create policy "safety_events_manager_update"
on public.safety_events for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "safety_checkins_select_own_or_manager" on public.safety_checkins;
create policy "safety_checkins_select_own_or_manager"
on public.safety_checkins for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "safety_checkins_insert_own" on public.safety_checkins;
create policy "safety_checkins_insert_own"
on public.safety_checkins for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "safety_checkins_update_own" on public.safety_checkins;
create policy "safety_checkins_update_own"
on public.safety_checkins for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "board_tasks_select_authenticated" on public.board_tasks;
create policy "board_tasks_select_authenticated"
on public.board_tasks for select
to authenticated
using (true);

drop policy if exists "board_tasks_manager_insert" on public.board_tasks;
create policy "board_tasks_manager_insert"
on public.board_tasks for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "board_tasks_manager_update" on public.board_tasks;
create policy "board_tasks_manager_update"
on public.board_tasks for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]) or assignee_id = auth.uid())
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]) or assignee_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update on public.safety_events to authenticated;
grant select, insert, update on public.safety_checkins to authenticated;
grant select, insert, update on public.board_tasks to authenticated;
