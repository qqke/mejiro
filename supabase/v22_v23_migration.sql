-- v23: 管理文書の多段承認と電子印影ステージ

alter type public.app_role add value if not exists 'chair';
alter type public.app_role add value if not exists 'president';

create type public.document_status_next as enum (
  'review',
  'board_review',
  'chair_review',
  'president_review',
  'approved',
  'rejected',
  'archived'
);

alter table public.management_documents
alter column status drop default;

alter table public.management_documents
alter column status type public.document_status_next
using (
  case
    when status::text = 'review' then 'board_review'
    else status::text
  end
)::public.document_status_next;

drop type public.document_status;
alter type public.document_status_next rename to document_status;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_approval_stage' and typnamespace = 'public'::regnamespace) then
    create type public.document_approval_stage as enum ('board', 'chair', 'president');
  end if;
end $$;

alter table public.management_documents
alter column status set default 'board_review';

alter table public.document_approvals
add column if not exists stage public.document_approval_stage not null default 'board';

alter table public.document_seals
add column if not exists stage public.document_approval_stage not null default 'board';

drop policy if exists "documents_manager_insert" on public.management_documents;
create policy "documents_manager_insert"
on public.management_documents for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role::text in ('board_member', 'chair', 'president', 'admin')
  )
);

drop policy if exists "documents_manager_update" on public.management_documents;
create policy "documents_manager_update"
on public.management_documents for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role::text in ('board_member', 'chair', 'president', 'admin')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role::text in ('board_member', 'chair', 'president', 'admin')
  )
);

drop policy if exists "document_approvals_manager_insert" on public.document_approvals;
create policy "document_approvals_manager_insert"
on public.document_approvals for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role::text in ('board_member', 'chair', 'president', 'admin')
  )
);

drop policy if exists "document_seals_manager_insert" on public.document_seals;
create policy "document_seals_manager_insert"
on public.document_seals for insert
to authenticated
with check (
  sealed_by = auth.uid()
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.role::text in ('board_member', 'chair', 'president', 'admin')
  )
);
