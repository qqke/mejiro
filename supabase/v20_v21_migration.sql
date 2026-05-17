-- v19 -> v20/v21 migration
-- Run this in Supabase SQL Editor after v1 through v19 are installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inspection_frequency' and typnamespace = 'public'::regnamespace) then
    create type public.inspection_frequency as enum ('monthly', 'quarterly', 'semiannual', 'annual', 'ad_hoc');
  end if;

  if not exists (select 1 from pg_type where typname = 'inspection_result' and typnamespace = 'public'::regnamespace) then
    create type public.inspection_result as enum ('ok', 'watch', 'repair_needed', 'retired');
  end if;
end $$;

create table if not exists public.inspection_plans (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.asset_items(id) on delete cascade,
  title text not null,
  frequency public.inspection_frequency not null default 'annual',
  next_due_date date not null,
  note text,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inspection_records (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.inspection_plans(id) on delete cascade,
  asset_id uuid not null references public.asset_items(id) on delete cascade,
  inspected_by uuid not null references public.profiles(id) on delete cascade,
  result public.inspection_result not null,
  inspected_at date not null,
  note text not null,
  maintenance_request_id uuid references public.maintenance_requests(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'inspection_plans_set_updated_at') then
    create trigger inspection_plans_set_updated_at
    before update on public.inspection_plans
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'inspection_records_set_updated_at') then
    create trigger inspection_records_set_updated_at
    before update on public.inspection_records
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.inspection_plans enable row level security;
alter table public.inspection_records enable row level security;

drop policy if exists "inspection_plans_select_authenticated" on public.inspection_plans;
create policy "inspection_plans_select_authenticated"
on public.inspection_plans for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "inspection_plans_manager_insert" on public.inspection_plans;
create policy "inspection_plans_manager_insert"
on public.inspection_plans for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "inspection_plans_manager_update" on public.inspection_plans;
create policy "inspection_plans_manager_update"
on public.inspection_plans for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "inspection_records_select_authenticated" on public.inspection_records;
create policy "inspection_records_select_authenticated"
on public.inspection_records for select
to authenticated
using (true);

drop policy if exists "inspection_records_manager_insert" on public.inspection_records;
create policy "inspection_records_manager_insert"
on public.inspection_records for insert
to authenticated
with check (inspected_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "inspection_records_manager_update" on public.inspection_records;
create policy "inspection_records_manager_update"
on public.inspection_records for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

grant usage on schema public to authenticated;
grant select, insert, update on public.inspection_plans to authenticated;
grant select, insert, update on public.inspection_records to authenticated;
