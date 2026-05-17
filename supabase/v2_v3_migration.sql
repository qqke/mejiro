-- v1 -> v2/v3 migration
-- Run this in Supabase SQL Editor after the v1 schema is already installed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_kind' and typnamespace = 'public'::regnamespace) then
    create type public.document_kind as enum ('minutes', 'rule', 'estimate', 'approval', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status' and typnamespace = 'public'::regnamespace) then
    create type public.document_status as enum ('review', 'approved', 'rejected', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_approval_action' and typnamespace = 'public'::regnamespace) then
    create type public.document_approval_action as enum ('approved', 'rejected');
  end if;
end $$;

create table if not exists public.management_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind public.document_kind not null default 'other',
  version text not null default '1.0',
  summary text not null,
  file_url text,
  status public.document_status not null default 'review',
  created_by uuid not null references public.profiles(id) on delete cascade,
  updated_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_approvals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action public.document_approval_action not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_seals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  sealed_by uuid not null references public.profiles(id) on delete cascade,
  seal_name text not null,
  sealed_at timestamptz not null default now(),
  note text
);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'documents_set_updated_at') then
    create trigger documents_set_updated_at
    before update on public.management_documents
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.management_documents enable row level security;
alter table public.document_approvals enable row level security;
alter table public.document_seals enable row level security;

drop policy if exists "documents_select_authenticated" on public.management_documents;
create policy "documents_select_authenticated"
on public.management_documents for select
to authenticated
using (true);

drop policy if exists "documents_manager_insert" on public.management_documents;
create policy "documents_manager_insert"
on public.management_documents for insert
to authenticated
with check (created_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "documents_manager_update" on public.management_documents;
create policy "documents_manager_update"
on public.management_documents for update
to authenticated
using (app_private.has_role(array['board_member', 'admin']::public.app_role[]))
with check (app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "document_approvals_select_authenticated" on public.document_approvals;
create policy "document_approvals_select_authenticated"
on public.document_approvals for select
to authenticated
using (true);

drop policy if exists "document_approvals_manager_insert" on public.document_approvals;
create policy "document_approvals_manager_insert"
on public.document_approvals for insert
to authenticated
with check (actor_id = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));

drop policy if exists "document_seals_select_authenticated" on public.document_seals;
create policy "document_seals_select_authenticated"
on public.document_seals for select
to authenticated
using (true);

drop policy if exists "document_seals_manager_insert" on public.document_seals;
create policy "document_seals_manager_insert"
on public.document_seals for insert
to authenticated
with check (sealed_by = auth.uid() and app_private.has_role(array['board_member', 'admin']::public.app_role[]));
