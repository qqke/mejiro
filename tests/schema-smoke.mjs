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
