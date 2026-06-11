do $$
begin
  if not exists (select 1 from pg_type where typname = 'parking_assignment_method' and typnamespace = 'public'::regnamespace) then
    create type public.parking_assignment_method as enum ('first_come', 'lottery');
  end if;

  if not exists (select 1 from pg_type where typname = 'parking_permit_priority' and typnamespace = 'public'::regnamespace) then
    create type public.parking_permit_priority as enum ('primary', 'secondary');
  end if;

  if not exists (select 1 from pg_type where typname = 'parking_procedure_kind' and typnamespace = 'public'::regnamespace) then
    create type public.parking_procedure_kind as enum ('vehicle_change', 'return_notice', 'certificate');
  end if;

  if not exists (select 1 from pg_type where typname = 'parking_procedure_status' and typnamespace = 'public'::regnamespace) then
    create type public.parking_procedure_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

alter table public.profiles
add column if not exists parking_application_blocked boolean not null default false,
add column if not exists parking_application_blocked_reason text;

alter table public.parking_spaces
add column if not exists assignment_method public.parking_assignment_method not null default 'first_come';

alter table public.parking_permits
add column if not exists priority public.parking_permit_priority not null default 'primary',
add column if not exists space_kind public.parking_space_kind,
add column if not exists resident_unit_key text;

create or replace function public.set_parking_permit_denormalized_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_kind public.parking_space_kind;
  v_building text;
  v_unit_number text;
begin
  select kind into v_space_kind
  from public.parking_spaces
  where id = new.space_id;

  select building, unit_number into v_building, v_unit_number
  from public.profiles
  where id = new.user_id;

  new.space_kind = v_space_kind;
  new.resident_unit_key = case
    when coalesce(v_building, '') <> '' and coalesce(v_unit_number, '') <> ''
      then v_building || '-' || v_unit_number
    else new.user_id::text
  end;

  return new;
end;
$$;

update public.parking_permits
set
  space_kind = parking_spaces.kind,
  resident_unit_key = case
    when coalesce(profiles.building, '') <> '' and coalesce(profiles.unit_number, '') <> ''
      then profiles.building || '-' || profiles.unit_number
    else parking_permits.user_id::text
  end
from public.parking_spaces, public.profiles
where parking_spaces.id = parking_permits.space_id
  and profiles.id = parking_permits.user_id
  and (parking_permits.space_kind is null or parking_permits.resident_unit_key is null);

with ranked as (
  select
    id,
    row_number() over (partition by resident_unit_key order by created_at, id) as unit_rank
  from public.parking_permits
  where space_kind = 'car'
    and priority = 'primary'
    and status in ('pending', 'active')
)
update public.parking_permits
set priority = 'secondary'
from ranked
where ranked.id = parking_permits.id
  and ranked.unit_rank > 1;

alter table public.parking_permits
alter column space_kind set not null,
alter column resident_unit_key set not null;

drop trigger if exists parking_permits_set_denormalized_fields on public.parking_permits;
create trigger parking_permits_set_denormalized_fields
before insert or update of space_id, user_id
on public.parking_permits
for each row execute function public.set_parking_permit_denormalized_fields();

create unique index if not exists parking_permits_one_primary_car_per_unit
on public.parking_permits(resident_unit_key)
where space_kind = 'car'
  and priority = 'primary'
  and status in ('pending', 'active');

create table if not exists public.parking_procedure_requests (
  id uuid primary key default gen_random_uuid(),
  permit_id uuid not null references public.parking_permits(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  kind public.parking_procedure_kind not null,
  status public.parking_procedure_status not null default 'pending',
  requested_vehicle_label text,
  requested_return_date date,
  note text,
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parking_procedure_vehicle_label_required check (kind <> 'vehicle_change' or nullif(requested_vehicle_label, '') is not null),
  constraint parking_procedure_return_date_required check (kind <> 'return_notice' or requested_return_date is not null)
);

create or replace function public.validate_parking_procedure_request()
returns trigger
language plpgsql
as $$
declare
  v_permit public.parking_permits;
begin
  select * into v_permit
  from public.parking_permits
  where id = new.permit_id;

  if v_permit.id is null then
    raise exception '対象の駐車利用が見つかりません。' using errcode = '23514';
  end if;

  if new.requester_id <> v_permit.user_id then
    raise exception '本人の駐車利用のみ手続きできます。' using errcode = '23514';
  end if;

  if v_permit.status <> 'active' then
    raise exception '利用中の駐車許可のみ手続きできます。' using errcode = '23514';
  end if;

  if new.kind = 'return_notice' and new.requested_return_date < current_date + 14 then
    raise exception '返還届は14日以上前に提出してください。' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists parking_procedure_requests_validate on public.parking_procedure_requests;
create trigger parking_procedure_requests_validate
before insert or update of permit_id, requester_id, kind, requested_return_date, requested_vehicle_label
on public.parking_procedure_requests
for each row execute function public.validate_parking_procedure_request();

drop trigger if exists parking_procedure_requests_set_updated_at on public.parking_procedure_requests;
create trigger parking_procedure_requests_set_updated_at
before update on public.parking_procedure_requests
for each row execute function public.set_updated_at();

create or replace function public.approve_parking_application(p_permit_id uuid)
returns public.parking_permits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_permit public.parking_permits;
  v_space public.parking_spaces;
begin
  if not app_private.has_role(array['board_member', 'admin']::public.app_role[]) then
    raise exception '駐車申請を承認する権限がありません。';
  end if;

  select * into v_permit
  from public.parking_permits
  where id = p_permit_id
  for update;

  if v_permit.id is null or v_permit.status <> 'pending' then
    raise exception '承認対象の駐車申請が見つからないか、承認できません。';
  end if;

  select * into v_space
  from public.parking_spaces
  where id = v_permit.space_id
  for update;

  if v_space.assignment_method = 'lottery' then
    raise exception '抽選区画は抽選実施から承認してください。';
  end if;

  if not v_space.is_active or not v_space.is_available then
    raise exception '対象区画は利用できません。';
  end if;

  update public.parking_permits
  set status = 'active',
      approved_by = auth.uid(),
      approved_at = now()
  where id = p_permit_id
  returning * into v_permit;

  update public.parking_spaces
  set is_available = false
  where id = v_permit.space_id;

  return v_permit;
end;
$$;

create or replace function public.draw_parking_lottery(p_space_id uuid)
returns public.parking_permits
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space public.parking_spaces;
  v_winner public.parking_permits;
begin
  if not app_private.has_role(array['board_member', 'admin']::public.app_role[]) then
    raise exception '駐車抽選を実施する権限がありません。';
  end if;

  select * into v_space
  from public.parking_spaces
  where id = p_space_id
  for update;

  if v_space.id is null or v_space.assignment_method <> 'lottery' then
    raise exception '抽選対象の区画が見つかりません。';
  end if;

  if not v_space.is_active or not v_space.is_available then
    raise exception '対象区画は利用できません。';
  end if;

  select * into v_winner
  from public.parking_permits
  where space_id = p_space_id
    and status = 'pending'
  order by case when priority = 'primary' then 0 else 1 end, random()
  limit 1
  for update;

  if v_winner.id is null then
    raise exception '抽選対象の申請がありません。';
  end if;

  update public.parking_permits
  set status = 'rejected'
  where space_id = p_space_id
    and status = 'pending'
    and id <> v_winner.id;

  update public.parking_permits
  set status = 'active',
      approved_by = auth.uid(),
      approved_at = now()
  where id = v_winner.id
  returning * into v_winner;

  update public.parking_spaces
  set is_available = false
  where id = p_space_id;

  return v_winner;
end;
$$;

create or replace function public.handle_parking_procedure_request(
  p_request_id uuid,
  p_approve boolean
)
returns public.parking_procedure_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.parking_procedure_requests;
  v_permit public.parking_permits;
begin
  if not app_private.has_role(array['board_member', 'admin']::public.app_role[]) then
    raise exception '駐車手続きを処理する権限がありません。';
  end if;

  select * into v_request
  from public.parking_procedure_requests
  where id = p_request_id
    and status = 'pending'
  for update;

  if v_request.id is null then
    raise exception '処理対象の駐車手続きが見つかりません。';
  end if;

  select * into v_permit
  from public.parking_permits
  where id = v_request.permit_id
  for update;

  if not p_approve then
    update public.parking_procedure_requests
    set status = 'rejected',
        handled_by = auth.uid(),
        handled_at = now()
    where id = p_request_id
    returning * into v_request;

    return v_request;
  end if;

  if v_request.kind = 'vehicle_change' then
    update public.parking_permits
    set vehicle_label = v_request.requested_vehicle_label
    where id = v_request.permit_id;
  elsif v_request.kind = 'return_notice' then
    update public.parking_permits
    set status = 'ended',
        end_date = v_request.requested_return_date
    where id = v_request.permit_id;

    update public.parking_spaces
    set is_available = true
    where id = v_permit.space_id;
  end if;

  update public.parking_procedure_requests
  set status = 'approved',
      handled_by = auth.uid(),
      handled_at = now()
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

alter table public.parking_procedure_requests enable row level security;

drop policy if exists "parking_permits_insert_own" on public.parking_permits;
create policy "parking_permits_insert_own"
on public.parking_permits for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.parking_application_blocked = false
  )
  and exists (
    select 1 from public.parking_spaces
    where parking_spaces.id = parking_permits.space_id
      and parking_spaces.is_active = true
      and parking_spaces.is_available = true
  )
);

drop policy if exists "parking_procedure_requests_select_own_or_manager" on public.parking_procedure_requests;
create policy "parking_procedure_requests_select_own_or_manager"
on public.parking_procedure_requests for select
to authenticated
using (requester_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "parking_procedure_requests_insert_own" on public.parking_procedure_requests;
create policy "parking_procedure_requests_insert_own"
on public.parking_procedure_requests for insert
to authenticated
with check (requester_id = auth.uid() and status = 'pending');

drop policy if exists "parking_procedure_requests_manager_update" on public.parking_procedure_requests;
create policy "parking_procedure_requests_manager_update"
on public.parking_procedure_requests for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

grant select, insert, update on public.parking_procedure_requests to authenticated;

revoke execute on function public.approve_parking_application(uuid) from public;
revoke execute on function public.draw_parking_lottery(uuid) from public;
revoke execute on function public.handle_parking_procedure_request(uuid, boolean) from public;

grant execute on function public.approve_parking_application(uuid) to authenticated;
grant execute on function public.draw_parking_lottery(uuid) to authenticated;
grant execute on function public.handle_parking_procedure_request(uuid, boolean) to authenticated;
