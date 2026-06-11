import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(relativePath) {
  return await readFile(path.join(repoRoot, relativePath), "utf8");
}

const schema = await read("supabase/schema.sql");
const v18v19 = await read("supabase/v18_v19_migration.sql");
const v20v21 = await read("supabase/v20_v21_migration.sql");
const v22v23 = await read("supabase/v22_v23_migration.sql");
const v24v25 = await read("supabase/v24_v25_migration.sql");
const v26v27 = await read("supabase/v26_v27_migration.sql");
const v27v28 = await read("supabase/v27_v28_migration.sql");
const v28v29 = await read("supabase/v28_v29_migration.sql");
const v29v30 = await read("supabase/v29_v30_migration.sql");
const v30v31 = await read("supabase/v30_v31_migration.sql");
const v31v32 = await read("supabase/v31_v32_migration.sql");

function getPublicTables(sql) {
  const tables = [];
  const pattern = /create table(?: if not exists)? public\.([a-z0-9_]+) \(/gi;
  for (const match of sql.matchAll(pattern)) {
    tables.push(match[1]);
  }
  return tables;
}

function hasRls(sql, table) {
  return sql.includes(`alter table public.${table} enable row level security;`);
}

function hasGrant(sql, table) {
  return new RegExp(`grant\\s+[a-z, ]+\\s+on\\s+public\\.${table}\\s+to\\s+authenticated;`, "i").test(sql);
}

function hasPolicy(sql, table) {
  return new RegExp(`create policy\\s+"[^"]+"\\s+on\\s+public\\.${table}\\s+for\\s+`, "i").test(sql);
}

for (const bit of [
  "meeting_sessions",
  "meeting_agenda_items",
  "meeting_attendances",
  "meeting_votes",
  "inspection_plans",
  "inspection_records",
  "activity_logs",
  "meeting_kind",
  "meeting_status",
  "attendance_status",
  "vote_choice",
  "inspection_frequency",
  "inspection_result",
  "create policy",
  "grant select, insert, update, delete",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
}

for (const bit of [
  "activity_logs",
  "entity_type",
  "entity_id",
  "activity_logs_manager_select",
  "activity_logs_authenticated_insert",
  "activity_logs_created_at_idx",
  "grant select, insert on public.activity_logs to authenticated;",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
  assert(v26v27.includes(bit), `v26_v27_migration.sql should include ${bit}`);
}

for (const bit of [
  "notice_target_role",
  "'chair'",
  "'president'",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
}

for (const bit of [
  "alter type public.notice_target_role add value if not exists 'chair';",
  "alter type public.notice_target_role add value if not exists 'president';",
]) {
  assert(v27v28.includes(bit), `v27_v28_migration.sql should include ${bit}`);
}

for (const bit of [
  "survey_responses_insert_own",
  "survey_responses_update_own",
  "surveys.is_open = true",
  "safety_checkins_insert_own",
  "safety_checkins_update_own",
  "safety_events.status = 'active'",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
  assert(v28v29.includes(bit), `v28_v29_migration.sql should include ${bit}`);
}

for (const bit of [
  "parking_permits_insert_own",
  "parking_spaces.is_active = true",
  "parking_spaces.is_available = true",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
  assert(v29v30.includes(bit), `v29_v30_migration.sql should include ${bit}`);
}

for (const bit of [
  "revoke execute on function public.update_own_pending_booking(uuid, uuid, timestamptz, timestamptz, text) from public;",
  "revoke execute on function public.cancel_own_pending_booking(uuid) from public;",
  "grant execute on function public.update_own_pending_booking(uuid, uuid, timestamptz, timestamptz, text) to authenticated;",
  "grant execute on function public.cancel_own_pending_booking(uuid) to authenticated;",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
  assert(v30v31.includes(bit), `v30_v31_migration.sql should include ${bit}`);
}

for (const bit of [
  "parking_assignment_method",
  "parking_permit_priority",
  "parking_procedure_kind",
  "parking_procedure_status",
  "parking_application_blocked",
  "parking_application_blocked_reason",
  "assignment_method public.parking_assignment_method",
  "priority public.parking_permit_priority",
  "space_kind public.parking_space_kind",
  "resident_unit_key text",
  "parking_permits_one_primary_car_per_unit",
  "parking_procedure_requests",
  "approve_parking_application",
  "draw_parking_lottery",
  "handle_parking_procedure_request",
  "set_parking_permit_denormalized_fields",
  "parking_procedure_requests_select_own_or_manager",
  "grant select, insert, update on public.parking_procedure_requests to authenticated;",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
  assert(v31v32.includes(bit), `v31_v32_migration.sql should include ${bit}`);
}

for (const bit of [
  "meeting_sessions",
  "meeting_agenda_items",
  "meeting_attendances",
  "meeting_votes",
  "create policy",
  "grant select, insert, update on public.meeting_sessions to authenticated;",
  "grant select, insert, update on public.meeting_agenda_items to authenticated;",
  "grant select, insert, update on public.meeting_attendances to authenticated;",
  "grant select, insert, update on public.meeting_votes to authenticated;",
]) {
  assert(v18v19.includes(bit), `v18_v19_migration.sql should include ${bit}`);
}

for (const bit of [
  "inspection_plans",
  "inspection_records",
  "create policy",
  "grant select, insert, update on public.inspection_plans to authenticated;",
  "grant select, insert, update on public.inspection_records to authenticated;",
]) {
  assert(v20v21.includes(bit), `v20_v21_migration.sql should include ${bit}`);
}

for (const bit of [
  "chair",
  "president",
  "board_review",
  "chair_review",
  "president_review",
  "document_approval_stage",
  "add column if not exists stage",
  "documents_manager_update",
  "document_seals_manager_insert",
]) {
  assert(v22v23.includes(bit), `v22_v23_migration.sql should include ${bit}`);
}

for (const bit of [
  "markdown_body",
  "current_version_id",
  "crdt_snapshot_id",
  "document_versions",
  "document_crdt_snapshots",
  "documents_versions_manager_insert",
  "document_crdt_snapshots_manager_insert",
  "grant select, insert on public.document_versions to authenticated;",
  "grant select, insert on public.document_crdt_snapshots to authenticated;",
]) {
  assert(schema.includes(bit), `schema.sql should include ${bit}`);
  assert(v24v25.includes(bit), `v24_v25_migration.sql should include ${bit}`);
}

assert(schema.includes("create trigger"), "schema.sql should include triggers");
assert(schema.includes("alter table"), "schema.sql should include table alterations");

for (const table of getPublicTables(schema)) {
  assert(hasRls(schema, table), `schema.sql should enable RLS on public.${table}`);
  assert(hasGrant(schema, table), `schema.sql should grant authenticated access to public.${table}`);
  assert(hasPolicy(schema, table), `schema.sql should define a policy for public.${table}`);
}

for (const table of getPublicTables(v18v19)) {
  assert(hasRls(v18v19, table), `v18_v19_migration.sql should enable RLS on public.${table}`);
  assert(hasGrant(v18v19, table), `v18_v19_migration.sql should grant authenticated access to public.${table}`);
  assert(hasPolicy(v18v19, table), `v18_v19_migration.sql should define a policy for public.${table}`);
}

for (const table of getPublicTables(v20v21)) {
  assert(hasRls(v20v21, table), `v20_v21_migration.sql should enable RLS on public.${table}`);
  assert(hasGrant(v20v21, table), `v20_v21_migration.sql should grant authenticated access to public.${table}`);
  assert(hasPolicy(v20v21, table), `v20_v21_migration.sql should define a policy for public.${table}`);
}

for (const table of getPublicTables(v24v25)) {
  assert(hasRls(v24v25, table), `v24_v25_migration.sql should enable RLS on public.${table}`);
  assert(hasGrant(v24v25, table), `v24_v25_migration.sql should grant authenticated access to public.${table}`);
  assert(hasPolicy(v24v25, table), `v24_v25_migration.sql should define a policy for public.${table}`);
}

for (const table of getPublicTables(v26v27)) {
  assert(hasRls(v26v27, table), `v26_v27_migration.sql should enable RLS on public.${table}`);
  assert(hasGrant(v26v27, table), `v26_v27_migration.sql should grant authenticated access to public.${table}`);
  assert(hasPolicy(v26v27, table), `v26_v27_migration.sql should define a policy for public.${table}`);
}
