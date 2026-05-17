-- v7 -> v8/v9 migration
-- Run this in Supabase SQL Editor after v1 through v7 are installed.

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists emergency_contact_name text;
alter table public.profiles add column if not exists emergency_contact_phone text;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  question text not null,
  options text[] not null,
  is_open boolean not null default true,
  closes_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_value text not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (survey_id, user_id)
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'surveys_set_updated_at') then
    create trigger surveys_set_updated_at
    before update on public.surveys
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'survey_responses_set_updated_at') then
    create trigger survey_responses_set_updated_at
    before update on public.survey_responses
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
to authenticated
using (id = auth.uid() or app_private.has_role(array['admin']::public.app_role[]))
with check (
  (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()))
  or app_private.has_role(array['admin']::public.app_role[])
);

drop policy if exists "surveys_select_authenticated" on public.surveys;
create policy "surveys_select_authenticated"
on public.surveys for select
to authenticated
using (true);

drop policy if exists "surveys_manager_insert" on public.surveys;
create policy "surveys_manager_insert"
on public.surveys for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "surveys_manager_update" on public.surveys;
create policy "surveys_manager_update"
on public.surveys for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "survey_responses_select_own_or_manager" on public.survey_responses;
create policy "survey_responses_select_own_or_manager"
on public.survey_responses for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "survey_responses_insert_own" on public.survey_responses;
create policy "survey_responses_insert_own"
on public.survey_responses for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "survey_responses_update_own" on public.survey_responses;
create policy "survey_responses_update_own"
on public.survey_responses for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update on public.surveys to authenticated;
grant select, insert, update on public.survey_responses to authenticated;
grant select, update on public.profiles to authenticated;
