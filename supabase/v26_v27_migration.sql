create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_at_idx
on public.activity_logs(created_at desc);

alter table public.activity_logs enable row level security;

drop policy if exists "activity_logs_manager_select" on public.activity_logs;
create policy "activity_logs_manager_select"
on public.activity_logs for select
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "activity_logs_authenticated_insert" on public.activity_logs;
create policy "activity_logs_authenticated_insert"
on public.activity_logs for insert
to authenticated
with check (actor_id = auth.uid());

grant select, insert on public.activity_logs to authenticated;
