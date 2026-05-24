-- 団地管理組合電子化システム v1
-- Supabase SQL Editor で実行してください。

create extension if not exists btree_gist;

create type public.app_role as enum ('resident', 'board_member', 'chair', 'president', 'admin');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.notice_kind as enum ('notice', 'meeting', 'topic');
create type public.notice_target_role as enum ('all', 'resident', 'board_member', 'chair', 'president', 'admin');
create type public.document_kind as enum ('minutes', 'rule', 'estimate', 'approval', 'other');
create type public.document_status as enum ('review', 'board_review', 'chair_review', 'president_review', 'approved', 'rejected', 'archived');
create type public.document_approval_action as enum ('approved', 'rejected');
create type public.document_approval_stage as enum ('board', 'chair', 'president');
create type public.maintenance_category as enum ('common_area', 'equipment', 'safety', 'cleaning', 'other');
create type public.maintenance_priority as enum ('normal', 'high', 'urgent');
create type public.maintenance_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.finance_entry_type as enum ('income', 'expense');
create type public.asset_category as enum ('equipment', 'fixture', 'disaster', 'document', 'other');
create type public.asset_status as enum ('active', 'inspection_due', 'repair_needed', 'retired');
create type public.contract_status as enum ('active', 'renewal_due', 'expired', 'terminated');
create type public.safety_event_kind as enum ('drill', 'inspection', 'checkin', 'other');
create type public.safety_event_status as enum ('planned', 'active', 'completed', 'cancelled');
create type public.safety_checkin_status as enum ('safe', 'needs_help');
create type public.board_task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type public.board_task_priority as enum ('normal', 'high', 'urgent');
create type public.parking_space_kind as enum ('car', 'bicycle', 'motorbike');
create type public.parking_permit_status as enum ('pending', 'active', 'rejected', 'ended');
create type public.resident_request_category as enum ('noise', 'rule', 'neighbor', 'common_area', 'other');
create type public.resident_request_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.resident_request_visibility as enum ('private', 'board', 'public');
create type public.circular_kind as enum ('notice', 'minutes', 'event', 'rule', 'other');
create type public.circular_status as enum ('published', 'archived');
create type public.lending_item_kind as enum ('key', 'equipment', 'document', 'other');
create type public.lending_request_status as enum ('pending', 'checked_out', 'returned', 'rejected', 'lost');
create type public.duty_kind as enum ('cleaning', 'patrol', 'meeting', 'garden', 'other');
create type public.duty_status as enum ('planned', 'done', 'missed', 'cancelled');
create type public.waste_category as enum ('burnable', 'non_burnable', 'recycle', 'oversized', 'hazardous', 'other');
create type public.bulky_waste_status as enum ('submitted', 'scheduled', 'completed', 'cancelled');
create type public.meeting_kind as enum ('board', 'general', 'committee', 'other');
create type public.meeting_status as enum ('open', 'closed', 'cancelled');
create type public.meeting_attendance_status as enum ('attending', 'proxy', 'absent');
create type public.meeting_vote_choice as enum ('approve', 'reject', 'abstain');
create type public.inspection_frequency as enum ('monthly', 'quarterly', 'semiannual', 'annual', 'ad_hoc');
create type public.inspection_result as enum ('ok', 'watch', 'repair_needed', 'retired');

create schema if not exists app_private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.app_role not null default 'resident',
  building text,
  unit_number text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
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
  markdown_body text not null default '',
  current_version_id uuid,
  crdt_snapshot_id uuid,
  status public.document_status not null default 'board_review',
  created_by uuid not null references public.profiles(id) on delete cascade,
  updated_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  version_label text not null,
  markdown_body text not null,
  summary text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.document_crdt_snapshots (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  yjs_update bytea not null,
  markdown_body text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.management_documents
add constraint management_documents_current_version_fk
foreign key (current_version_id) references public.document_versions(id) on delete set null;

alter table public.management_documents
add constraint management_documents_crdt_snapshot_fk
foreign key (crdt_snapshot_id) references public.document_crdt_snapshots(id) on delete set null;

create index document_versions_document_created_idx
on public.document_versions (document_id, created_at desc);

create index document_crdt_snapshots_document_created_idx
on public.document_crdt_snapshots (document_id, created_at desc);

create table public.document_approvals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  stage public.document_approval_stage not null default 'board',
  action public.document_approval_action not null,
  comment text,
  created_at timestamptz not null default now()
);

create table public.document_seals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  sealed_by uuid not null references public.profiles(id) on delete cascade,
  stage public.document_approval_stage not null default 'board',
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

create table public.surveys (
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

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_value text not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (survey_id, user_id)
);

create table public.safety_events (
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

create table public.safety_checkins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.safety_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.safety_checkin_status not null default 'safe',
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.board_tasks (
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

create table public.parking_spaces (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  kind public.parking_space_kind not null,
  location text,
  monthly_fee integer check (monthly_fee is null or monthly_fee >= 0),
  is_active boolean not null default true,
  is_available boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, kind)
);

create table public.parking_permits (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.parking_spaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_label text not null,
  status public.parking_permit_status not null default 'pending',
  start_date date not null,
  end_date date,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parking_permit_date_order check (end_date is null or end_date >= start_date)
);

create unique index parking_permits_one_active_per_space
on public.parking_permits(space_id)
where status = 'active';

create table public.resident_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category public.resident_request_category not null default 'other',
  visibility public.resident_request_visibility not null default 'private',
  status public.resident_request_status not null default 'open',
  body text not null,
  response text,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  handled_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.circulars (
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

create table public.circular_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  circular_id uuid not null references public.circulars(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (circular_id, user_id)
);

create table public.lending_items (
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

create table public.lending_requests (
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

create table public.duty_assignments (
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

create table public.waste_schedules (
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

create table public.bulky_waste_requests (
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

create table public.meeting_sessions (
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

create table public.meeting_agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meeting_sessions(id) on delete cascade,
  title text not null,
  description text not null,
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meeting_attendances (
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

create table public.meeting_votes (
  id uuid primary key default gen_random_uuid(),
  agenda_item_id uuid not null references public.meeting_agenda_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  choice public.meeting_vote_choice not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agenda_item_id, user_id)
);

create table public.inspection_plans (
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

create table public.inspection_records (
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

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  detail text,
  created_at timestamptz not null default now()
);

create index activity_logs_created_at_idx
on public.activity_logs(created_at desc);

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

create or replace function public.update_own_pending_booking(
  p_booking_id uuid,
  p_room_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_purpose text
)
returns public.room_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.room_bookings;
begin
  if p_end_at <= p_start_at then
    raise exception '終了時間は開始時間より後にしてください。';
  end if;

  update public.room_bookings
  set
    room_id = p_room_id,
    start_at = p_start_at,
    end_at = p_end_at,
    purpose = p_purpose
  where id = p_booking_id
    and user_id = auth.uid()
    and status = 'pending'
  returning * into v_booking;

  if v_booking.id is null then
    raise exception '編集対象の予約が見つからないか、編集できません。';
  end if;

  return v_booking;
end;
$$;

create or replace function public.cancel_own_pending_booking(
  p_booking_id uuid
)
returns public.room_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.room_bookings;
begin
  update public.room_bookings
  set status = 'cancelled'
  where id = p_booking_id
    and user_id = auth.uid()
    and status = 'pending'
  returning * into v_booking;

  if v_booking.id is null then
    raise exception '取消対象の予約が見つからないか、取消できません。';
  end if;

  return v_booking;
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

create trigger surveys_set_updated_at
before update on public.surveys
for each row execute function public.set_updated_at();

create trigger survey_responses_set_updated_at
before update on public.survey_responses
for each row execute function public.set_updated_at();

create trigger safety_events_set_updated_at
before update on public.safety_events
for each row execute function public.set_updated_at();

create trigger safety_checkins_set_updated_at
before update on public.safety_checkins
for each row execute function public.set_updated_at();

create trigger board_tasks_set_updated_at
before update on public.board_tasks
for each row execute function public.set_updated_at();

create trigger parking_spaces_set_updated_at
before update on public.parking_spaces
for each row execute function public.set_updated_at();

create trigger parking_permits_set_updated_at
before update on public.parking_permits
for each row execute function public.set_updated_at();

create trigger resident_requests_set_updated_at
before update on public.resident_requests
for each row execute function public.set_updated_at();

create trigger circulars_set_updated_at
before update on public.circulars
for each row execute function public.set_updated_at();

create trigger lending_items_set_updated_at
before update on public.lending_items
for each row execute function public.set_updated_at();

create trigger lending_requests_set_updated_at
before update on public.lending_requests
for each row execute function public.set_updated_at();

create trigger duty_assignments_set_updated_at
before update on public.duty_assignments
for each row execute function public.set_updated_at();

create trigger waste_schedules_set_updated_at
before update on public.waste_schedules
for each row execute function public.set_updated_at();

create trigger bulky_waste_requests_set_updated_at
before update on public.bulky_waste_requests
for each row execute function public.set_updated_at();

create trigger meeting_sessions_set_updated_at
before update on public.meeting_sessions
for each row execute function public.set_updated_at();

create trigger meeting_agenda_items_set_updated_at
before update on public.meeting_agenda_items
for each row execute function public.set_updated_at();

create trigger meeting_attendances_set_updated_at
before update on public.meeting_attendances
for each row execute function public.set_updated_at();

create trigger meeting_votes_set_updated_at
before update on public.meeting_votes
for each row execute function public.set_updated_at();

create trigger inspection_plans_set_updated_at
before update on public.inspection_plans
for each row execute function public.set_updated_at();

create trigger inspection_records_set_updated_at
before update on public.inspection_records
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_bookings enable row level security;
alter table public.notices enable row level security;
alter table public.notice_reads enable row level security;
alter table public.events enable row level security;
alter table public.management_documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_crdt_snapshots enable row level security;
alter table public.document_approvals enable row level security;
alter table public.document_seals enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.finance_entries enable row level security;
alter table public.asset_items enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_contracts enable row level security;
alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;
alter table public.safety_events enable row level security;
alter table public.safety_checkins enable row level security;
alter table public.board_tasks enable row level security;
alter table public.parking_spaces enable row level security;
alter table public.parking_permits enable row level security;
alter table public.resident_requests enable row level security;
alter table public.circulars enable row level security;
alter table public.circular_acknowledgements enable row level security;
alter table public.lending_items enable row level security;
alter table public.lending_requests enable row level security;
alter table public.duty_assignments enable row level security;
alter table public.waste_schedules enable row level security;
alter table public.bulky_waste_requests enable row level security;
alter table public.meeting_sessions enable row level security;
alter table public.meeting_agenda_items enable row level security;
alter table public.meeting_attendances enable row level security;
alter table public.meeting_votes enable row level security;
alter table public.inspection_plans enable row level security;
alter table public.inspection_records enable row level security;
alter table public.activity_logs enable row level security;

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
using (id = auth.uid() or app_private.has_role(array['admin']::public.app_role[]))
with check (
  (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()))
  or app_private.has_role(array['admin']::public.app_role[])
);

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
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[]));

create policy "documents_manager_update"
on public.management_documents for update
to authenticated
using (app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[]));

create policy "document_versions_select_authenticated"
on public.document_versions for select
to authenticated
using (true);

create policy "documents_versions_manager_insert"
on public.document_versions for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[]));

create policy "document_crdt_snapshots_select_authenticated"
on public.document_crdt_snapshots for select
to authenticated
using (true);

create policy "document_crdt_snapshots_manager_insert"
on public.document_crdt_snapshots for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[]));

create policy "document_approvals_select_authenticated"
on public.document_approvals for select
to authenticated
using (true);

create policy "document_approvals_manager_insert"
on public.document_approvals for insert
to authenticated
with check (actor_id = auth.uid() and app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[]));

create policy "document_seals_select_authenticated"
on public.document_seals for select
to authenticated
using (true);

create policy "document_seals_manager_insert"
on public.document_seals for insert
to authenticated
with check (sealed_by = auth.uid() and app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[]));

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

create policy "surveys_select_authenticated"
on public.surveys for select
to authenticated
using (true);

create policy "surveys_manager_insert"
on public.surveys for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "surveys_manager_update"
on public.surveys for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "survey_responses_select_own_or_manager"
on public.survey_responses for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "survey_responses_insert_own"
on public.survey_responses for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.surveys
    where surveys.id = survey_responses.survey_id
      and surveys.is_open = true
      and (surveys.closes_at is null or surveys.closes_at > now())
  )
);

create policy "survey_responses_update_own"
on public.survey_responses for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.surveys
    where surveys.id = survey_responses.survey_id
      and surveys.is_open = true
      and (surveys.closes_at is null or surveys.closes_at > now())
  )
);

create policy "safety_events_select_authenticated"
on public.safety_events for select
to authenticated
using (true);

create policy "safety_events_manager_insert"
on public.safety_events for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "safety_events_manager_update"
on public.safety_events for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "safety_checkins_select_own_or_manager"
on public.safety_checkins for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "safety_checkins_insert_own"
on public.safety_checkins for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.safety_events
    where safety_events.id = safety_checkins.event_id
      and safety_events.status = 'active'
  )
);

create policy "safety_checkins_update_own"
on public.safety_checkins for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.safety_events
    where safety_events.id = safety_checkins.event_id
      and safety_events.status = 'active'
  )
);

create policy "board_tasks_select_authenticated"
on public.board_tasks for select
to authenticated
using (true);

create policy "board_tasks_manager_insert"
on public.board_tasks for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "board_tasks_manager_update"
on public.board_tasks for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]) or assignee_id = auth.uid())
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]) or assignee_id = auth.uid());

create policy "parking_spaces_select_authenticated"
on public.parking_spaces for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "parking_spaces_manager_insert"
on public.parking_spaces for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "parking_spaces_manager_update"
on public.parking_spaces for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "parking_permits_select_own_or_manager"
on public.parking_permits for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "parking_permits_insert_own"
on public.parking_permits for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.parking_spaces
    where parking_spaces.id = parking_permits.space_id
      and parking_spaces.is_active = true
      and parking_spaces.is_available = true
  )
);

create policy "parking_permits_manager_update"
on public.parking_permits for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "resident_requests_select_visible"
on public.resident_requests for select
to authenticated
using (
  requester_id = auth.uid()
  or visibility = 'public'
  or (visibility = 'board' and app_private.has_role(array['board_member', 'admin']::public.app_role[]))
  or app_private.has_role(array['board_member', 'admin']::public.app_role[])
);

create policy "resident_requests_insert_own"
on public.resident_requests for insert
to authenticated
with check (requester_id = auth.uid() and status = 'open');

create policy "resident_requests_update_own_or_manager"
on public.resident_requests for update
to authenticated
using (requester_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (requester_id = auth.uid() and status in ('open', 'closed'))
);

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

create policy "circulars_manager_insert"
on public.circulars for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "circulars_manager_update"
on public.circulars for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "circular_acknowledgements_select_own_or_manager"
on public.circular_acknowledgements for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

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

create policy "lending_items_select_active_or_manager"
on public.lending_items for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "lending_items_manager_insert"
on public.lending_items for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "lending_items_manager_update"
on public.lending_items for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "lending_requests_select_own_or_manager"
on public.lending_requests for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

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

create policy "lending_requests_manager_update"
on public.lending_requests for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "duty_assignments_select_own_or_manager"
on public.duty_assignments for select
to authenticated
using (assignee_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "duty_assignments_manager_insert"
on public.duty_assignments for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "duty_assignments_update_assignee_or_manager"
on public.duty_assignments for update
to authenticated
using (assignee_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (assignee_id = auth.uid() and status = 'done')
);

create policy "waste_schedules_select_active_or_manager"
on public.waste_schedules for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "waste_schedules_manager_insert"
on public.waste_schedules for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "waste_schedules_manager_update"
on public.waste_schedules for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "bulky_waste_requests_select_own_or_manager"
on public.bulky_waste_requests for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "bulky_waste_requests_insert_own"
on public.bulky_waste_requests for insert
to authenticated
with check (user_id = auth.uid() and status = 'submitted');

create policy "bulky_waste_requests_update_own_or_manager"
on public.bulky_waste_requests for update
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (
  app_private.has_role(array['board_member', 'admin']::public.app_role[])
  or (user_id = auth.uid() and status = 'cancelled')
);

create policy "meeting_sessions_select_open_or_manager"
on public.meeting_sessions for select
to authenticated
using (status <> 'cancelled' or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "meeting_sessions_manager_insert"
on public.meeting_sessions for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "meeting_sessions_manager_update"
on public.meeting_sessions for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

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

create policy "meeting_agenda_items_manager_update"
on public.meeting_agenda_items for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "meeting_attendances_select_own_or_manager"
on public.meeting_attendances for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

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

create policy "meeting_votes_select_own_or_manager"
on public.meeting_votes for select
to authenticated
using (user_id = auth.uid() or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

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

create policy "inspection_plans_select_authenticated"
on public.inspection_plans for select
to authenticated
using (is_active = true or app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "inspection_plans_manager_insert"
on public.inspection_plans for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "inspection_plans_manager_update"
on public.inspection_plans for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "inspection_records_select_authenticated"
on public.inspection_records for select
to authenticated
using (true);

create policy "inspection_records_manager_insert"
on public.inspection_records for insert
to authenticated
with check (inspected_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "inspection_records_manager_update"
on public.inspection_records for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "activity_logs_manager_select"
on public.activity_logs for select
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

create policy "activity_logs_authenticated_insert"
on public.activity_logs for insert
to authenticated
with check (actor_id = auth.uid());

insert into public.rooms (name, capacity, notes)
values
  ('集会室 A', 24, '理事会・小規模会議向け'),
  ('集会室 B', 40, '総会準備・住民説明会向け')
on conflict do nothing;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.rooms to authenticated;
grant select, insert, update on public.room_bookings to authenticated;
grant select, insert, update on public.notices to authenticated;
grant select, insert, update on public.notice_reads to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update on public.management_documents to authenticated;
grant select, insert on public.document_versions to authenticated;
grant select, insert on public.document_crdt_snapshots to authenticated;
grant select, insert on public.document_approvals to authenticated;
grant select, insert on public.document_seals to authenticated;
grant select, insert, update on public.maintenance_requests to authenticated;
grant select, insert, update on public.finance_entries to authenticated;
grant select, insert, update on public.asset_items to authenticated;
grant select, insert, update on public.vendors to authenticated;
grant select, insert, update on public.vendor_contracts to authenticated;
grant select, insert, update on public.surveys to authenticated;
grant select, insert, update on public.survey_responses to authenticated;
grant select, insert, update on public.safety_events to authenticated;
grant select, insert, update on public.safety_checkins to authenticated;
grant select, insert, update on public.board_tasks to authenticated;
grant select, insert, update on public.parking_spaces to authenticated;
grant select, insert, update on public.parking_permits to authenticated;
grant select, insert, update on public.resident_requests to authenticated;
grant select, insert, update on public.circulars to authenticated;
grant select, insert on public.circular_acknowledgements to authenticated;
grant select, insert, update on public.lending_items to authenticated;
grant select, insert, update on public.lending_requests to authenticated;
grant select, insert, update on public.duty_assignments to authenticated;
grant select, insert, update on public.waste_schedules to authenticated;
grant select, insert, update on public.bulky_waste_requests to authenticated;
grant select, insert, update on public.meeting_sessions to authenticated;
grant select, insert, update on public.meeting_agenda_items to authenticated;
grant select, insert, update on public.meeting_attendances to authenticated;
grant select, insert, update on public.meeting_votes to authenticated;
grant select, insert, update on public.inspection_plans to authenticated;
grant select, insert, update on public.inspection_records to authenticated;
grant select, insert on public.activity_logs to authenticated;

revoke execute on function public.update_own_pending_booking(uuid, uuid, timestamptz, timestamptz, text) from public;
revoke execute on function public.cancel_own_pending_booking(uuid) from public;
grant execute on function public.update_own_pending_booking(uuid, uuid, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.cancel_own_pending_booking(uuid) to authenticated;
