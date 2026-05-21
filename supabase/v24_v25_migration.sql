-- v25: 管理文書 Markdown CRDT 協作編集、版履歴、PDF/差分表示基盤

alter table public.management_documents
add column if not exists markdown_body text not null default '';

alter table public.management_documents
add column if not exists current_version_id uuid;

alter table public.management_documents
add column if not exists crdt_snapshot_id uuid;

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  version_label text not null,
  markdown_body text not null,
  summary text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.document_crdt_snapshots (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.management_documents(id) on delete cascade,
  yjs_update bytea not null,
  markdown_body text not null default '',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'management_documents_current_version_fk'
  ) then
    alter table public.management_documents
    add constraint management_documents_current_version_fk
    foreign key (current_version_id) references public.document_versions(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'management_documents_crdt_snapshot_fk'
  ) then
    alter table public.management_documents
    add constraint management_documents_crdt_snapshot_fk
    foreign key (crdt_snapshot_id) references public.document_crdt_snapshots(id) on delete set null;
  end if;
end $$;

create index if not exists document_versions_document_created_idx
on public.document_versions (document_id, created_at desc);

create index if not exists document_crdt_snapshots_document_created_idx
on public.document_crdt_snapshots (document_id, created_at desc);

alter table public.document_versions enable row level security;
alter table public.document_crdt_snapshots enable row level security;

drop policy if exists "document_versions_select_authenticated" on public.document_versions;
create policy "document_versions_select_authenticated"
on public.document_versions for select
to authenticated
using (true);

drop policy if exists "documents_versions_manager_insert" on public.document_versions;
create policy "documents_versions_manager_insert"
on public.document_versions for insert
to authenticated
with check (
  created_by = auth.uid()
  and app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[])
);

drop policy if exists "document_crdt_snapshots_select_authenticated" on public.document_crdt_snapshots;
create policy "document_crdt_snapshots_select_authenticated"
on public.document_crdt_snapshots for select
to authenticated
using (true);

drop policy if exists "document_crdt_snapshots_manager_insert" on public.document_crdt_snapshots;
create policy "document_crdt_snapshots_manager_insert"
on public.document_crdt_snapshots for insert
to authenticated
with check (
  created_by = auth.uid()
  and app_private.has_role(array['board_member', 'chair', 'president', 'admin']::public.app_role[])
);

grant usage on schema public to authenticated;
grant select, insert, update on public.management_documents to authenticated;
grant select, insert on public.document_versions to authenticated;
grant select, insert on public.document_crdt_snapshots to authenticated;
