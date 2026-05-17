-- v17 -> v18/v19 migration
-- Run this in Supabase SQL Editor after v1 through v17 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'meeting_kind' and typnamespace = 'public'::regnamespace) then
    create type public.meeting_kind as enum ('board', 'general', 'committee', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'meeting_status' and typnamespace = 'public'::regnamespace) then
    create type public.meeting_status as enum ('open', 'closed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'meeting_attendance_status' and typnamespace = 'public'::regnamespace) then
    create type public.meeting_attendance_status as enum ('attending', 'proxy', 'absent');
  end if;

  if not exists (select 1 from pg_type where typname = 'meeting_vote_choice' and typnamespace = 'public'::regnamespace) then
    create type public.meeting_vote_choice as enum ('approve', 'reject', 'abstain');
  end if;
end $$;

create table if not exists public.meeting_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.meeting_kind not null default 'board',
  status public.meeting_status not null default 'open',
  scheduled_at timestamptz not null,
  location text,
  note text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_sessions(id) on delete cascade,
  title text not null,
  description text not null,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meeting_attendances (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.meeting_attendance_status not null,
  proxy_to text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_id, user_id)
);

create table if not exists public.meeting_votes (
  id uuid primary key default gen_random_uuid(),
  agenda_item_id uuid not null references public.meeting_agenda_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice public.meeting_vote_choice not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agenda_item_id, user_id)
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'meeting_sessions_set_updated_at') then
    create trigger meeting_sessions_set_updated_at
    before update on public.meeting_sessions
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'meeting_agenda_items_set_updated_at') then
    create trigger meeting_agenda_items_set_updated_at
    before update on public.meeting_agenda_items
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'meeting_attendances_set_updated_at') then
    create trigger meeting_attendances_set_updated_at
    before update on public.meeting_attendances
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'meeting_votes_set_updated_at') then
    create trigger meeting_votes_set_updated_at
    before update on public.meeting_votes
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.meeting_sessions enable row level security;
alter table public.meeting_agenda_items enable row level security;
alter table public.meeting_attendances enable row level security;
alter table public.meeting_votes enable row level security;

drop policy if exists "meeting_sessions_select_open_or_manager" on public.meeting_sessions;
create policy "meeting_sessions_select_open_or_manager"
on public.meeting_sessions for select
to authenticated
using (status <> 'cancelled' or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "meeting_sessions_manager_insert" on public.meeting_sessions;
create policy "meeting_sessions_manager_insert"
on public.meeting_sessions for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "meeting_sessions_manager_update" on public.meeting_sessions;
create policy "meeting_sessions_manager_update"
on public.meeting_sessions for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "meeting_agenda_items_select_open_or_manager" on public.meeting_agenda_items;
create policy "meeting_agenda_items_select_open_or_manager"
on public.meeting_agenda_items for select
to authenticated
using (
  exists (
    select 1 from public.meeting_sessions
    where meeting_sessions.id = meeting_agenda_items.meeting_id
      and (meeting_sessions.status <> 'cancelled' or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
  )
);

drop policy if exists "meeting_agenda_items_manager_insert" on public.meeting_agenda_items;
create policy "meeting_agenda_items_manager_insert"
on public.meeting_agenda_items for insert
to authenticated
with check (
  created_by = auth.uid()
  and app_private.has_role(array['board_member', 'admin']::public.app_role[])
  and exists (
    select 1 from public.meeting_sessions
    where meeting_sessions.id = meeting_agenda_items.meeting_id
      and meeting_sessions.status = 'open'
  )
);

drop policy if exists "meeting_agenda_items_manager_update" on public.meeting_agenda_items;
create policy "meeting_agenda_items_manager_update"
on public.meeting_agenda_items for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "meeting_attendances_select_own_or_manager" on public.meeting_attendances;
create policy "meeting_attendances_select_own_or_manager"
on public.meeting_attendances for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "meeting_attendances_insert_own" on public.meeting_attendances;
create policy "meeting_attendances_insert_own"
on public.meeting_attendances for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.meeting_sessions
    where meeting_sessions.id = meeting_attendances.meeting_id
      and meeting_sessions.status = 'open'
  )
);

drop policy if exists "meeting_attendances_update_own" on public.meeting_attendances;
create policy "meeting_attendances_update_own"
on public.meeting_attendances for update
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (
    user_id = auth.uid()
    and exists (
      select 1 from public.meeting_sessions
      where meeting_sessions.id = meeting_attendances.meeting_id
        and meeting_sessions.status = 'open'
    )
  )
);

drop policy if exists "meeting_votes_select_own_or_manager" on public.meeting_votes;
create policy "meeting_votes_select_own_or_manager"
on public.meeting_votes for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "meeting_votes_insert_own" on public.meeting_votes;
create policy "meeting_votes_insert_own"
on public.meeting_votes for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.meeting_agenda_items
    join public.meeting_sessions on meeting_sessions.id = meeting_agenda_items.meeting_id
    where meeting_agenda_items.id = meeting_votes.agenda_item_id
      and meeting_sessions.status = 'open'
  )
);

drop policy if exists "meeting_votes_update_own" on public.meeting_votes;
create policy "meeting_votes_update_own"
on public.meeting_votes for update
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (
    user_id = auth.uid()
    and exists (
      select 1
      from public.meeting_agenda_items
      join public.meeting_sessions on meeting_sessions.id = meeting_agenda_items.meeting_id
      where meeting_agenda_items.id = meeting_votes.agenda_item_id
        and meeting_sessions.status = 'open'
    )
  )
);

grant usage on schema public to authenticated;
grant select, insert, update on public.meeting_sessions to authenticated;
grant select, insert, update on public.meeting_agenda_items to authenticated;
grant select, insert, update on public.meeting_attendances to authenticated;
grant select, insert, update on public.meeting_votes to authenticated;
