-- v13 -> v14/v15 migration
-- Run this in Supabase SQL Editor after v1 through v13 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'circular_kind' and typnamespace = 'public'::regnamespace) then
    create type public.circular_kind as enum ('notice', 'minutes', 'event', 'rule', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'circular_status' and typnamespace = 'public'::regnamespace) then
    create type public.circular_status as enum ('published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'lending_item_kind' and typnamespace = 'public'::regnamespace) then
    create type public.lending_item_kind as enum ('key', 'equipment', 'document', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'lending_request_status' and typnamespace = 'public'::regnamespace) then
    create type public.lending_request_status as enum ('pending', 'checked_out', 'returned', 'rejected', 'lost');
  end if;
end $$;

create table if not exists public.circulars (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.circular_kind not null default 'notice',
  target_role public.notice_target_role not null default 'all',
  status public.circular_status not null default 'published',
  body text not null,
  due_date date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.circular_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  circular_id uuid not null references public.circulars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (circular_id, user_id)
);

create table if not exists public.lending_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.lending_item_kind not null default 'other',
  location text,
  note text,
  is_active boolean not null default true,
  is_available boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lending_requests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.lending_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  purpose text not null,
  status public.lending_request_status not null default 'pending',
  checkout_at timestamptz,
  due_at timestamptz,
  returned_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'circulars_set_updated_at') then
    create trigger circulars_set_updated_at
    before update on public.circulars
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'lending_items_set_updated_at') then
    create trigger lending_items_set_updated_at
    before update on public.lending_items
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'lending_requests_set_updated_at') then
    create trigger lending_requests_set_updated_at
    before update on public.lending_requests
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.circulars enable row level security;
alter table public.circular_acknowledgements enable row level security;
alter table public.lending_items enable row level security;
alter table public.lending_requests enable row level security;

drop policy if exists "circulars_select_target_or_manager" on public.circulars;
create policy "circulars_select_target_or_manager"
on public.circulars for select
to authenticated
using (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (
    status = 'published'
    and (
      target_role = 'all'
      or exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
          and profiles.role::text = circulars.target_role::text
      )
    )
  )
);

drop policy if exists "circulars_manager_insert" on public.circulars;
create policy "circulars_manager_insert"
on public.circulars for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "circulars_manager_update" on public.circulars;
create policy "circulars_manager_update"
on public.circulars for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "circular_acknowledgements_select_own_or_manager" on public.circular_acknowledgements;
create policy "circular_acknowledgements_select_own_or_manager"
on public.circular_acknowledgements for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "circular_acknowledgements_insert_own" on public.circular_acknowledgements;
create policy "circular_acknowledgements_insert_own"
on public.circular_acknowledgements for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.circulars
    where circulars.id = circular_acknowledgements.circular_id
      and circulars.status = 'published'
      and (
        circulars.target_role = 'all'
        or exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
            and profiles.role::text = circulars.target_role::text
        )
      )
  )
);

drop policy if exists "lending_items_select_active_or_manager" on public.lending_items;
create policy "lending_items_select_active_or_manager"
on public.lending_items for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "lending_items_manager_insert" on public.lending_items;
create policy "lending_items_manager_insert"
on public.lending_items for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "lending_items_manager_update" on public.lending_items;
create policy "lending_items_manager_update"
on public.lending_items for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "lending_requests_select_own_or_manager" on public.lending_requests;
create policy "lending_requests_select_own_or_manager"
on public.lending_requests for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "lending_requests_insert_own" on public.lending_requests;
create policy "lending_requests_insert_own"
on public.lending_requests for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.lending_items
    where lending_items.id = lending_requests.item_id
      and lending_items.is_active = true
      and lending_items.is_available = true
  )
);

drop policy if exists "lending_requests_manager_update" on public.lending_requests;
create policy "lending_requests_manager_update"
on public.lending_requests for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

grant usage on schema public to authenticated;
grant select, insert, update on public.circulars to authenticated;
grant select, insert on public.circular_acknowledgements to authenticated;
grant select, insert, update on public.lending_items to authenticated;
grant select, insert, update on public.lending_requests to authenticated;
