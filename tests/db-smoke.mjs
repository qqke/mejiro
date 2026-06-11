import { existsSync, readdirSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pgRootCandidates = [
  process.env.PG_BIN_DIR,
  "C:\\Program Files\\PostgreSQL\\18\\bin",
  "C:\\Program Files (x86)\\PostgreSQL\\18\\bin",
].filter(Boolean);

if (process.platform !== "win32") {
  try {
    for (const entry of readdirSync("/usr/lib/postgresql", { withFileTypes: true })) {
      if (entry.isDirectory()) {
        pgRootCandidates.push(path.join("/usr/lib/postgresql", entry.name, "bin"));
      }
    }
  } catch {
    // ignore
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function resolveBinary(name) {
  for (const root of pgRootCandidates) {
    const candidate = path.join(root, process.platform === "win32" ? `${name}.exe` : name);
    if (existsSync(candidate)) return candidate;
  }

  const command = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(command, [name], { encoding: "utf8" });
  if (result.status === 0) {
    const first = result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (first) return first;
  }

  return null;
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolve(address.port);
        } else {
          reject(new Error("Unable to allocate a free port"));
        }
      });
    });
  });
}

function runOrThrow(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    ...options,
  });

  if (result.status !== 0) {
    const detail = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${path.basename(command)} ${args.join(" ")} failed${detail ? `:\n${detail}` : ""}`);
  }
}

async function waitForDatabase(psql, port, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    const result = spawnSync(psql, ["-h", "127.0.0.1", "-p", String(port), "-U", "postgres", "-d", "postgres", "-X", "-Atc", "select 1"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    if (result.status === 0 && String(result.stdout).trim() === "1") {
      return;
    }

    lastError = new Error([result.stdout, result.stderr].filter(Boolean).join("\n").trim() || "database not ready");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw lastError ?? new Error("Timed out waiting for database startup");
}

async function createTempCluster() {
  const initdb = resolveBinary("initdb");
  const postgres = resolveBinary("postgres");
  const psql = resolveBinary("psql");

  if (!initdb || !postgres || !psql) {
    return null;
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "mejiro-pg-"));
  const port = await getFreePort();
  const socketDir = process.platform === "win32" ? null : workDir;

  runOrThrow(initdb, ["-A", "trust", "-U", "postgres", "-D", workDir, "--encoding=UTF8", "--locale=C"]);
  const serverArgs = [
    "-D",
    workDir,
    "-p",
    String(port),
    "-c",
    "listen_addresses=127.0.0.1",
    "-c",
    "timezone=UTC",
  ];
  if (socketDir) {
    serverArgs.push("-c", `unix_socket_directories=${socketDir}`);
  }
  const server = spawn(postgres, serverArgs, {
    cwd: workDir,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  let serverOutput = "";
  server.stdout.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverOutput += chunk.toString();
  });

  const exited = await Promise.race([
    new Promise((resolve) => server.once("exit", (code) => resolve(code ?? 0))),
    waitForDatabase(psql, port).then(() => null),
  ]);

  if (exited !== null) {
    throw new Error(`postgres exited before readiness:\n${serverOutput}`.trim());
  }

  return {
    port,
    workDir,
    initdb,
    postgres,
    psql,
    server,
    async stop() {
      const exited = new Promise((resolve) => {
        if (server.exitCode !== null) {
          resolve(null);
        } else {
          server.once("exit", () => resolve(null));
        }
      });

      if (server.pid) {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true,
          });
        } else if (!server.killed) {
          server.kill("SIGTERM");
        }
      }

      await Promise.race([
        exited,
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);

      for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
          await rm(workDir, { recursive: true, force: true });
          return;
        } catch (error) {
          if (!["EBUSY", "EPERM"].includes(String(error?.code ?? ""))) {
            throw error;
          }
          if (attempt === 9) {
            console.warn(`db smoke cleanup skipped locked temp dir: ${workDir}`);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    },
  };
}

async function writeSqlScript(dir, name, body) {
  const filePath = path.join(dir, name);
  await writeFile(filePath, body, "utf8");
  return filePath;
}

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

const schemaPath = path.join(repoRoot, "supabase", "schema.sql");
const v18v19Path = path.join(repoRoot, "supabase", "v18_v19_migration.sql");
const v20v21Path = path.join(repoRoot, "supabase", "v20_v21_migration.sql");
const v22v23Path = path.join(repoRoot, "supabase", "v22_v23_migration.sql");
const v23v24Path = path.join(repoRoot, "supabase", "v23_v24_migration.sql");
const v24v25Path = path.join(repoRoot, "supabase", "v24_v25_migration.sql");
const v26v27Path = path.join(repoRoot, "supabase", "v26_v27_migration.sql");
const v27v28Path = path.join(repoRoot, "supabase", "v27_v28_migration.sql");
const v28v29Path = path.join(repoRoot, "supabase", "v28_v29_migration.sql");
const v29v30Path = path.join(repoRoot, "supabase", "v29_v30_migration.sql");
const v30v31Path = path.join(repoRoot, "supabase", "v30_v31_migration.sql");
const v31v32Path = path.join(repoRoot, "supabase", "v31_v32_migration.sql");

const cluster = await createTempCluster();
if (!cluster) {
  console.log("db smoke skipped: PostgreSQL binaries were not found");
  process.exit(0);
}

const setupScript = await writeSqlScript(
  cluster.workDir,
  "setup.sql",
  String.raw`
\set ON_ERROR_STOP on
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated login noinherit;
  end if;
end
$$;

create schema if not exists auth;

create table if not exists auth.users (
  id uuid primary key,
  email text not null,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

\i '${toPosixPath(schemaPath)}'
\i '${toPosixPath(v18v19Path)}'
\i '${toPosixPath(v20v21Path)}'
\i '${toPosixPath(v22v23Path)}'
\i '${toPosixPath(v23v24Path)}'
\i '${toPosixPath(v24v25Path)}'
\i '${toPosixPath(v26v27Path)}'
\i '${toPosixPath(v27v28Path)}'
\i '${toPosixPath(v28v29Path)}'
\i '${toPosixPath(v29v30Path)}'
\i '${toPosixPath(v30v31Path)}'
\i '${toPosixPath(v31v32Path)}'

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', '{"display_name":"管理者DB"}'),
  ('22222222-2222-2222-2222-222222222222', 'board@example.com', '{"display_name":"理事DB"}'),
  ('33333333-3333-3333-3333-333333333333', 'resident@example.com', '{"display_name":"住民DB"}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'chair@example.com', '{"display_name":"主席DB"}'),
  ('12121212-1212-4121-8121-121212121212', 'blocked@example.com', '{"display_name":"停止住民DB"}')
on conflict (id) do nothing;

update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set role = 'board_member' where id = '22222222-2222-2222-2222-222222222222';
update public.profiles set role = 'chair' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
update public.profiles
set building = 'C', unit_number = '303'
where id = '33333333-3333-3333-3333-333333333333';
update public.profiles
set building = 'B', unit_number = '202'
where id = '22222222-2222-2222-2222-222222222222';
update public.profiles
set building = 'D',
    unit_number = '404',
    parking_application_blocked = true,
    parking_application_blocked_reason = '管理費滞納'
where id = '12121212-1212-4121-8121-121212121212';

insert into public.rooms (id, name, capacity, notes, is_active)
values ('44444444-4444-4444-4444-444444444444', 'DB会議室', 24, 'db smoke', true)
on conflict do nothing;

insert into public.room_bookings (id, room_id, user_id, purpose, start_at, end_at, status, approved_by, approved_at)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'DB approved resident booking',
  '2026-05-20 10:00+09',
  '2026-05-20 11:00+09',
  'approved',
  '11111111-1111-1111-1111-111111111111',
  now()
)
on conflict do nothing;

insert into public.room_bookings (id, room_id, user_id, purpose, start_at, end_at, status)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  'DB board booking',
  '2026-05-20 16:00+09',
  '2026-05-20 17:00+09',
  'pending'
)
on conflict do nothing;

insert into public.asset_items (id, name, category, status, location, inspection_due_at, note, managed_by, created_by, created_at, updated_at)
values ('55555555-5555-5555-5555-555555555555', 'DB共用ポンプ', 'equipment', 'active', '機械室', '2026-06-01', 'db smoke', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.parking_spaces (id, code, kind, location, monthly_fee, is_active, is_available, created_by, created_at, updated_at)
values
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'DB-P-OPEN', 'car', '1階', 12000, true, true, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', 'DB-P-USED', 'car', '2階', 12000, true, false, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd3', 'DB-P-OFF', 'car', '3階', 12000, false, true, '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.parking_spaces (id, code, kind, location, monthly_fee, is_active, is_available, assignment_method, created_by, created_at, updated_at)
values
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd11', 'DB-P-ONE', 'car', '抽選なし', 12000, true, true, 'first_come', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd12', 'DB-P-TWO', 'car', '二台目', 12000, true, true, 'first_come', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd13', 'DB-P-LOT', 'car', '抽選', 13000, true, true, 'lottery', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddd14', 'DB-P-RETURN', 'car', '返還', 12000, true, false, 'first_come', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.parking_permits (id, space_id, user_id, vehicle_label, status, start_date, approved_by, approved_at, priority, created_at, updated_at)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddd15',
  'dddddddd-dddd-4ddd-8ddd-dddddddddd14',
  '33333333-3333-3333-3333-333333333333',
  'DB返還対象車',
  'active',
  '2026-05-01',
  '11111111-1111-1111-1111-111111111111',
  now(),
  'secondary',
  now(),
  now()
) on conflict do nothing;

insert into public.lending_items (id, name, kind, location, note, is_active, is_available, created_by, created_at, updated_at)
values
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd4', 'DB貸出可', 'equipment', '管理室', 'available', true, true, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd5', 'DB貸出中', 'equipment', '管理室', 'unavailable', true, false, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd6', 'DB貸出停止', 'equipment', '管理室', 'inactive', false, true, '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.meeting_sessions (id, title, kind, status, scheduled_at, location, note, created_by, created_at, updated_at)
values
  ('66666666-6666-6666-6666-666666666661', 'DB公開会議', 'general', 'open', '2026-05-20 09:00+09', '集会室A', 'open', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('66666666-6666-6666-6666-666666666662', 'DB終了会議', 'board', 'closed', '2026-05-20 11:00+09', '集会室A', 'closed', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('66666666-6666-6666-6666-666666666663', 'DB中止会議', 'committee', 'cancelled', '2026-05-20 13:00+09', '集会室A', 'cancelled', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.meeting_agenda_items (id, meeting_id, title, description, sort_order, created_by, created_at, updated_at)
values
  ('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666661', '公開議案', 'open', 1, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666663', '中止議案', 'cancelled', 1, '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.inspection_plans (id, asset_id, title, frequency, next_due_date, is_active, note, created_by, created_at, updated_at)
values
  ('88888888-8888-8888-8888-888888888881', '55555555-5555-5555-5555-555555555555', 'DB有効点検', 'monthly', '2026-06-15', true, 'active', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('88888888-8888-8888-8888-888888888882', '55555555-5555-5555-5555-555555555555', 'DB停止点検', 'annual', '2026-12-31', false, 'inactive', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.notices (id, title, body, kind, target_role, created_by, created_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'DB主席通知', 'chair target', 'topic', 'chair', '11111111-1111-1111-1111-111111111111', now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'DB住民通知', 'resident target', 'topic', 'resident', '11111111-1111-1111-1111-111111111111', now())
on conflict do nothing;

insert into public.circulars (id, title, kind, target_role, status, body, due_date, created_by, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'DB主席回覧', 'notice', 'chair', 'published', 'chair circular', '2026-06-30', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'DB住民回覧', 'notice', 'resident', 'published', 'resident circular', '2026-06-30', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.maintenance_requests (id, title, category, priority, status, location, description, requester_id, created_at, updated_at)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'DB住民修繕', 'equipment', 'normal', 'open', '1階', 'resident maintenance', '33333333-3333-3333-3333-333333333333', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', 'DB理事修繕', 'equipment', 'normal', 'open', '2階', 'board maintenance', '22222222-2222-2222-2222-222222222222', now(), now())
on conflict do nothing;

insert into public.resident_requests (id, title, category, visibility, status, body, requester_id, created_at, updated_at)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4', 'DB住民相談', 'noise', 'private', 'open', 'resident request', '33333333-3333-3333-3333-333333333333', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5', 'DB理事相談', 'noise', 'board', 'open', 'board request', '22222222-2222-2222-2222-222222222222', now(), now())
on conflict do nothing;

insert into public.duty_assignments (id, title, kind, status, assignee_id, scheduled_date, location, note, created_by, created_at, updated_at)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6', 'DB住民当番', 'cleaning', 'planned', '33333333-3333-3333-3333-333333333333', '2026-05-19', '1階', 'resident duty', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7', 'DB理事当番', 'patrol', 'planned', '22222222-2222-2222-2222-222222222222', '2026-05-19', '2階', 'board duty', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.bulky_waste_requests (id, user_id, item_name, status, preferred_date, pickup_location, note, created_at, updated_at)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8', '33333333-3333-3333-3333-333333333333', 'DB住民粗大ごみ', 'submitted', '2026-05-28', '1階', 'resident bulky waste', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9', '22222222-2222-2222-2222-222222222222', 'DB理事粗大ごみ', 'submitted', '2026-05-28', '2階', 'board bulky waste', now(), now())
on conflict do nothing;

insert into public.surveys (id, title, question, options, is_open, closes_at, created_by, created_at, updated_at)
values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'DB受付中意見募集', 'open survey?', array['A', 'B'], true, null, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', 'DB締切意見募集', 'closed survey?', array['A', 'B'], false, null, '11111111-1111-1111-1111-111111111111', now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'DB期限切れ意見募集', 'expired survey?', array['A', 'B'], true, now() - interval '1 day', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;

insert into public.safety_events (id, title, kind, status, scheduled_at, location, note, created_by, created_at, updated_at)
values
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc4', 'DB有効安否', 'checkin', 'active', now(), '1階', 'active safety', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', 'DB完了安否', 'checkin', 'completed', now(), '2階', 'completed safety', '11111111-1111-1111-1111-111111111111', now(), now()),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc6', 'DB取消安否', 'checkin', 'cancelled', now(), '3階', 'cancelled safety', '11111111-1111-1111-1111-111111111111', now(), now())
on conflict do nothing;
`
);

const verifyScript = await writeSqlScript(
  cluster.workDir,
  "verify.sql",
  String.raw`
\set ON_ERROR_STOP on

select set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

do $$
declare
  actual integer;
begin
  select count(*) into actual from public.profiles where id = auth.uid();
  if actual <> 1 then
    raise exception 'profile trigger failed for resident';
  end if;

  select count(*) into actual from public.meeting_sessions;
  if actual <> 2 then
    raise exception 'resident should see 2 meeting sessions, got %', actual;
  end if;

  select count(*) into actual from public.meeting_sessions where status = 'cancelled';
  if actual <> 0 then
    raise exception 'resident should not see cancelled meetings';
  end if;

  select count(*) into actual from public.inspection_plans;
  if actual <> 1 then
    raise exception 'resident should see 1 active inspection plan, got %', actual;
  end if;

  insert into public.room_bookings (room_id, user_id, purpose, start_at, end_at, status)
  values ('44444444-4444-4444-4444-444444444444', auth.uid(), 'DB smoke booking', '2026-05-20 14:00+09', '2026-05-20 15:00+09', 'pending');

  select count(*) into actual from public.room_bookings where purpose = 'DB smoke booking';
  if actual <> 1 then
    raise exception 'resident booking insert failed';
  end if;

  perform public.update_own_pending_booking(
    (select id from public.room_bookings where purpose = 'DB smoke booking'),
    '44444444-4444-4444-4444-444444444444',
    '2026-05-20 15:00+09',
    '2026-05-20 16:00+09',
    'DB smoke booking updated'
  );

  select count(*) into actual
  from public.room_bookings
  where purpose = 'DB smoke booking updated'
    and start_at = '2026-05-20 15:00+09';

  if actual <> 1 then
    raise exception 'resident own booking RPC update failed';
  end if;

  begin
    perform public.update_own_pending_booking(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      '44444444-4444-4444-4444-444444444444',
      '2026-05-20 17:00+09',
      '2026-05-20 18:00+09',
      'forged booking update'
    );
    raise exception 'resident should not update another user booking via RPC';
  exception
    when others then
      if sqlerrm = 'resident should not update another user booking via RPC' then
        raise;
      end if;
  end;

  begin
    perform public.update_own_pending_booking(
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
      '44444444-4444-4444-4444-444444444444',
      '2026-05-20 18:00+09',
      '2026-05-20 19:00+09',
      'approved booking edit'
    );
    raise exception 'resident should not update approved booking via RPC';
  exception
    when others then
      if sqlerrm = 'resident should not update approved booking via RPC' then
        raise;
      end if;
  end;

  update public.room_bookings set status = 'approved' where purpose = 'DB smoke booking';
  get diagnostics actual = row_count;
  if actual <> 0 then
    raise exception 'resident should not be able to update room bookings';
  end if;

  insert into public.room_bookings (id, room_id, user_id, purpose, start_at, end_at, status)
  values (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    '44444444-4444-4444-4444-444444444444',
    auth.uid(),
    'DB cancellable booking',
    '2026-05-20 19:00+09',
    '2026-05-20 20:00+09',
    'pending'
  );

  perform public.cancel_own_pending_booking('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2');

  select count(*) into actual
  from public.room_bookings
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2'
    and status = 'cancelled';

  if actual <> 1 then
    raise exception 'resident own booking RPC cancel failed';
  end if;

  begin
    perform public.cancel_own_pending_booking('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1');
    raise exception 'resident should not cancel another user booking via RPC';
  exception
    when others then
      if sqlerrm = 'resident should not cancel another user booking via RPC' then
        raise;
      end if;
  end;

  update public.maintenance_requests
  set status = 'closed'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should be able to close own maintenance request, got %', actual;
  end if;

  update public.maintenance_requests
  set status = 'closed'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
  get diagnostics actual = row_count;
  if actual <> 0 then
    raise exception 'resident should not update another user maintenance request, got %', actual;
  end if;

  update public.resident_requests
  set status = 'closed'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4';
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should be able to close own resident request, got %', actual;
  end if;

  update public.resident_requests
  set status = 'closed'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5';
  get diagnostics actual = row_count;
  if actual <> 0 then
    raise exception 'resident should not update another user resident request, got %', actual;
  end if;

  update public.bulky_waste_requests
  set status = 'cancelled'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8';
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should be able to cancel own bulky waste request, got %', actual;
  end if;

  update public.bulky_waste_requests
  set status = 'cancelled'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9';
  get diagnostics actual = row_count;
  if actual <> 0 then
    raise exception 'resident should not update another user bulky waste request, got %', actual;
  end if;

  update public.duty_assignments
  set status = 'done'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6';
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should be able to complete own duty, got %', actual;
  end if;

  update public.duty_assignments
  set status = 'done'
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7';
  get diagnostics actual = row_count;
  if actual <> 0 then
    raise exception 'resident should not update another user duty, got %', actual;
  end if;

  begin
    update public.duty_assignments
    set status = 'missed'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6';
    raise exception 'resident should not mark own duty missed';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  insert into public.parking_permits (id, space_id, user_id, vehicle_label, status, start_date, priority, created_at, updated_at)
  values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd7', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1', auth.uid(), 'DB住民車', 'pending', '2026-06-01', 'secondary', now(), now());

  begin
    insert into public.parking_permits (space_id, user_id, vehicle_label, status, start_date)
    values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd2', auth.uid(), 'DB占用車', 'pending', '2026-06-01');
    raise exception 'resident should not apply for unavailable parking space';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.parking_permits (space_id, user_id, vehicle_label, status, start_date)
    values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd3', auth.uid(), 'DB停止車', 'pending', '2026-06-01');
    raise exception 'resident should not apply for inactive parking space';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.parking_permits (space_id, user_id, vehicle_label, status, start_date)
    values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd1', '22222222-2222-2222-2222-222222222222', 'DB他人車', 'pending', '2026-06-01');
    raise exception 'resident should not apply parking for another user';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  insert into public.parking_permits (id, space_id, user_id, vehicle_label, status, start_date, priority)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddd16', 'dddddddd-dddd-4ddd-8ddd-dddddddddd11', auth.uid(), 'DB一台目車', 'pending', '2026-06-01', 'primary');

  select count(*) into actual
  from public.parking_permits
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd16'
    and space_kind = 'car'
    and resident_unit_key = 'C-303'
    and priority = 'primary';

  if actual <> 1 then
    raise exception 'primary car application should store denormalized resident unit and kind';
  end if;

  begin
    insert into public.parking_permits (space_id, user_id, vehicle_label, status, start_date, priority)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddd12', auth.uid(), 'DB二重一台目車', 'pending', '2026-06-01', 'primary');
    raise exception 'resident should not create second primary car application for same unit';
  exception
    when unique_violation then
      null;
  end;

  insert into public.parking_permits (id, space_id, user_id, vehicle_label, status, start_date, priority)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddd17', 'dddddddd-dddd-4ddd-8ddd-dddddddddd12', auth.uid(), 'DB二台目車', 'pending', '2026-06-01', 'secondary');

  select count(*) into actual
  from public.parking_permits
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd17'
    and priority = 'secondary';

  if actual <> 1 then
    raise exception 'secondary car application should be allowed and marked secondary';
  end if;

  insert into public.parking_permits (id, space_id, user_id, vehicle_label, status, start_date, priority)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddd18', 'dddddddd-dddd-4ddd-8ddd-dddddddddd13', auth.uid(), 'DB抽選二台目車', 'pending', '2026-06-01', 'secondary');

  insert into public.parking_procedure_requests (id, permit_id, requester_id, kind, requested_vehicle_label, note)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddd20', 'dddddddd-dddd-4ddd-8ddd-dddddddddd15', auth.uid(), 'vehicle_change', 'DB変更後車両', '車両入替');

  begin
    insert into public.parking_procedure_requests (permit_id, requester_id, kind, requested_return_date, note)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddd15', auth.uid(), 'return_notice', current_date + 7, '短すぎる返還届');
    raise exception 'return notice should require 14 day lead time';
  exception
    when check_violation then
      null;
  end;

  insert into public.parking_procedure_requests (id, permit_id, requester_id, kind, requested_return_date, note)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddd21', 'dddddddd-dddd-4ddd-8ddd-dddddddddd15', auth.uid(), 'return_notice', current_date + 20, '返還届');

  insert into public.parking_procedure_requests (id, permit_id, requester_id, kind, note)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddd22', 'dddddddd-dddd-4ddd-8ddd-dddddddddd15', auth.uid(), 'certificate', '車庫証明');

  perform set_config('request.jwt.claim.sub', '12121212-1212-4121-8121-121212121212', false);

  begin
    insert into public.parking_permits (space_id, user_id, vehicle_label, status, start_date, priority)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddd12', auth.uid(), 'DB停止住民車', 'pending', '2026-06-01', 'primary');
    raise exception 'blocked resident should not apply for parking';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  perform set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

  insert into public.lending_requests (id, item_id, user_id, purpose, status, created_at, updated_at)
  values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd8', 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4', auth.uid(), 'DB貸出申請', 'pending', now(), now());

  begin
    insert into public.lending_requests (item_id, user_id, purpose, status)
    values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd5', auth.uid(), 'DB貸出中申請', 'pending');
    raise exception 'resident should not request unavailable lending item';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.lending_requests (item_id, user_id, purpose, status)
    values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd6', auth.uid(), 'DB停止貸出申請', 'pending');
    raise exception 'resident should not request inactive lending item';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.lending_requests (item_id, user_id, purpose, status)
    values ('dddddddd-dddd-4ddd-8ddd-ddddddddddd4', '22222222-2222-2222-2222-222222222222', 'DB他人貸出申請', 'pending');
    raise exception 'resident should not request lending for another user';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  insert into public.survey_responses (id, survey_id, user_id, option_value, comment, created_at)
  values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc7', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', auth.uid(), 'A', 'open survey response', now());

  update public.survey_responses
  set option_value = 'B'
  where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc7';
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should update own open survey response, got %', actual;
  end if;

  begin
    insert into public.survey_responses (survey_id, user_id, option_value, comment)
    values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc1', '22222222-2222-2222-2222-222222222222', 'A', 'forged survey');
    raise exception 'resident should not answer survey for another user';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.survey_responses (survey_id, user_id, option_value, comment)
    values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc2', auth.uid(), 'A', 'closed survey');
    raise exception 'resident should not answer closed survey';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.survey_responses (survey_id, user_id, option_value, comment)
    values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', auth.uid(), 'A', 'expired survey');
    raise exception 'resident should not answer expired survey';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  insert into public.safety_checkins (id, event_id, user_id, status, comment, created_at)
  values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc8', 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4', auth.uid(), 'safe', 'active checkin', now());

  update public.safety_checkins
  set status = 'needs_help'
  where id = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc8';
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should update own active safety checkin, got %', actual;
  end if;

  begin
    insert into public.safety_checkins (event_id, user_id, status, comment)
    values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc4', '22222222-2222-2222-2222-222222222222', 'safe', 'forged safety');
    raise exception 'resident should not check in safety event for another user';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.safety_checkins (event_id, user_id, status, comment)
    values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc5', auth.uid(), 'safe', 'completed safety');
    raise exception 'resident should not check in completed safety event';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.safety_checkins (event_id, user_id, status, comment)
    values ('cccccccc-cccc-4ccc-8ccc-ccccccccccc6', auth.uid(), 'safe', 'cancelled safety');
    raise exception 'resident should not check in cancelled safety event';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.management_documents (title, kind, version, summary, markdown_body, status, created_by, updated_by)
    values ('resident forbidden doc', 'other', '1.0', 'forbidden', '# forbidden', 'board_review', auth.uid(), auth.uid());
    raise exception 'resident should not be able to insert management documents';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  insert into public.meeting_attendances (meeting_id, user_id, status, proxy_to, note)
  values ('66666666-6666-6666-6666-666666666661', auth.uid(), 'attending', null, 'resident attendance');

  insert into public.meeting_votes (agenda_item_id, user_id, choice, comment)
  values ('77777777-7777-7777-7777-777777777771', auth.uid(), 'approve', 'resident vote');

  update public.meeting_attendances
  set status = 'proxy', proxy_to = '代理人DB'
  where meeting_id = '66666666-6666-6666-6666-666666666661'
    and user_id = auth.uid();
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should be able to update own open-meeting attendance, got %', actual;
  end if;

  update public.meeting_votes
  set choice = 'abstain'
  where agenda_item_id = '77777777-7777-7777-7777-777777777771'
    and user_id = auth.uid();
  get diagnostics actual = row_count;
  if actual <> 1 then
    raise exception 'resident should be able to update own open-meeting vote, got %', actual;
  end if;

  begin
    insert into public.meeting_attendances (meeting_id, user_id, status, proxy_to, note)
    values ('66666666-6666-6666-6666-666666666661', '22222222-2222-2222-2222-222222222222', 'attending', null, 'forged attendance');
    raise exception 'resident should not insert attendance for another user';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.meeting_votes (agenda_item_id, user_id, choice, comment)
    values ('77777777-7777-7777-7777-777777777771', '22222222-2222-2222-2222-222222222222', 'approve', 'forged vote');
    raise exception 'resident should not insert vote for another user';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.meeting_attendances (meeting_id, user_id, status, proxy_to, note)
    values ('66666666-6666-6666-6666-666666666663', auth.uid(), 'attending', null, 'cancelled attendance');
    raise exception 'resident should not insert attendance for cancelled meeting';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  begin
    insert into public.meeting_votes (agenda_item_id, user_id, choice, comment)
    values ('77777777-7777-7777-7777-777777777773', auth.uid(), 'approve', 'cancelled vote');
    raise exception 'resident should not insert vote for cancelled meeting';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;

  insert into public.activity_logs (id, actor_id, action, entity_type, entity_id, detail)
  values (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    auth.uid(),
    'created',
    'room_booking',
    '44444444-4444-4444-4444-444444444444',
    'resident activity log'
  );

  select count(*) into actual
  from public.activity_logs
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

  if actual <> 0 then
    raise exception 'resident should not be able to select activity logs, got %', actual;
  end if;

  begin
    insert into public.activity_logs (actor_id, action, entity_type, detail)
    values ('22222222-2222-2222-2222-222222222222', 'created', 'profile', 'forged actor');
    raise exception 'resident should not be able to forge activity log actor_id';
  exception
    when insufficient_privilege or check_violation then
      null;
  end;
end
$$;

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false);

do $$
declare
  actual integer;
begin
  select count(*) into actual from public.notices where title = 'DB主席通知';
  if actual <> 1 then
    raise exception 'chair should see chair-targeted notices, got %', actual;
  end if;

  select count(*) into actual from public.notices where title = 'DB住民通知';
  if actual <> 0 then
    raise exception 'chair should not see resident-targeted notices, got %', actual;
  end if;

  select count(*) into actual from public.circulars where title = 'DB主席回覧';
  if actual <> 1 then
    raise exception 'chair should see chair-targeted circulars, got %', actual;
  end if;

  select count(*) into actual from public.circulars where title = 'DB住民回覧';
  if actual <> 0 then
    raise exception 'chair should not see resident-targeted circulars, got %', actual;
  end if;
end
$$;

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

do $$
declare
  actual integer;
  before_updated timestamptz;
  after_updated timestamptz;
begin
  select count(*) into actual from public.meeting_sessions;
  if actual <> 3 then
    raise exception 'board member should see all meeting sessions, got %', actual;
  end if;

  select count(*) into actual from public.inspection_plans;
  if actual <> 2 then
    raise exception 'board member should see all inspection plans, got %', actual;
  end if;

  select count(*) into actual
  from public.activity_logs
  where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
    and detail = 'resident activity log';

  if actual <> 1 then
    raise exception 'board member should see resident activity logs, got %', actual;
  end if;

  perform public.approve_parking_application('dddddddd-dddd-4ddd-8ddd-dddddddddd16');

  select count(*) into actual
  from public.parking_permits
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd16'
    and status = 'active'
    and approved_by = auth.uid();

  if actual <> 1 then
    raise exception 'board member should approve first-come parking application';
  end if;

  select count(*) into actual
  from public.parking_spaces
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd11'
    and is_available = false;

  if actual <> 1 then
    raise exception 'approved parking space should become unavailable';
  end if;

  insert into public.parking_permits (id, space_id, user_id, vehicle_label, status, start_date, priority)
  values ('dddddddd-dddd-4ddd-8ddd-dddddddddd19', 'dddddddd-dddd-4ddd-8ddd-dddddddddd13', auth.uid(), 'DB抽選理事車', 'pending', '2026-06-01', 'primary');

  perform public.draw_parking_lottery('dddddddd-dddd-4ddd-8ddd-dddddddddd13');

  select count(*) into actual
  from public.parking_permits
  where space_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd13'
    and status = 'active';

  if actual <> 1 then
    raise exception 'lottery should select exactly one active permit, got %', actual;
  end if;

  select count(*) into actual
  from public.parking_permits
  where space_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd13'
    and status = 'rejected';

  if actual <> 1 then
    raise exception 'lottery should reject losing competing permits, got %', actual;
  end if;

  perform public.handle_parking_procedure_request('dddddddd-dddd-4ddd-8ddd-dddddddddd20', true);

  select count(*) into actual
  from public.parking_permits
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd15'
    and vehicle_label = 'DB変更後車両';

  if actual <> 1 then
    raise exception 'vehicle change procedure should update active permit vehicle label';
  end if;

  perform public.handle_parking_procedure_request('dddddddd-dddd-4ddd-8ddd-dddddddddd22', true);

  select count(*) into actual
  from public.parking_procedure_requests
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd22'
    and status = 'approved'
    and handled_by = auth.uid();

  if actual <> 1 then
    raise exception 'certificate procedure should be approved and handled by board member';
  end if;

  perform public.handle_parking_procedure_request('dddddddd-dddd-4ddd-8ddd-dddddddddd21', true);

  select count(*) into actual
  from public.parking_permits
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd15'
    and status = 'ended'
    and end_date is not null;

  if actual <> 1 then
    raise exception 'return notice should end active parking permit';
  end if;

  select count(*) into actual
  from public.parking_spaces
  where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddd14'
    and is_available = true;

  if actual <> 1 then
    raise exception 'return notice should release parking space';
  end if;

  select updated_at into before_updated
  from public.asset_items
  where id = '55555555-5555-5555-5555-555555555555';

  update public.asset_items
  set status = 'repair_needed'
  where id = '55555555-5555-5555-5555-555555555555';

  select updated_at into after_updated
  from public.asset_items
  where id = '55555555-5555-5555-5555-555555555555';

  if after_updated < before_updated then
    raise exception 'updated_at trigger did not advance on asset_items';
  end if;

  insert into public.inspection_records (plan_id, asset_id, inspected_by, result, inspected_at, note, maintenance_request_id)
  values (
    '88888888-8888-8888-8888-888888888881',
    '55555555-5555-5555-5555-555555555555',
    auth.uid(),
    'repair_needed',
    '2026-05-18',
    'board inspection',
    null
  );

  select count(*) into actual
  from public.inspection_records
  where plan_id = '88888888-8888-8888-8888-888888888881'
    and inspected_by = auth.uid()
    and result = 'repair_needed';

  if actual <> 1 then
    raise exception 'board member inspection insert failed';
  end if;

  insert into public.management_documents (id, title, kind, version, summary, markdown_body, status, created_by, updated_by)
  values (
    '99999999-9999-9999-9999-999999999991',
    'DB Markdown Document',
    'rule',
    '1.0',
    'markdown summary',
    '# DB Markdown Document',
    'board_review',
    auth.uid(),
    auth.uid()
  );

  insert into public.document_versions (id, document_id, version_label, markdown_body, summary, created_by)
  values (
    '99999999-9999-9999-9999-999999999992',
    '99999999-9999-9999-9999-999999999991',
    'v1',
    '# DB Markdown Document',
    'saved from db smoke',
    auth.uid()
  );

  insert into public.document_crdt_snapshots (id, document_id, yjs_update, markdown_body, created_by)
  values (
    '99999999-9999-9999-9999-999999999993',
    '99999999-9999-9999-9999-999999999991',
    decode('000102', 'hex'),
    '# DB Markdown Document',
    auth.uid()
  );

  update public.management_documents
  set current_version_id = '99999999-9999-9999-9999-999999999992',
      crdt_snapshot_id = '99999999-9999-9999-9999-999999999993'
  where id = '99999999-9999-9999-9999-999999999991';

  select count(*) into actual
  from public.document_versions
  where document_id = '99999999-9999-9999-9999-999999999991';

  if actual <> 1 then
    raise exception 'board member document version insert failed';
  end if;
end
$$;
`
);

try {
  runOrThrow(cluster.psql, ["-h", "127.0.0.1", "-p", String(cluster.port), "-U", "postgres", "-d", "postgres", "-X", "-v", "ON_ERROR_STOP=1", "-f", setupScript]);
  runOrThrow(cluster.psql, ["-h", "127.0.0.1", "-p", String(cluster.port), "-U", "authenticated", "-d", "postgres", "-X", "-v", "ON_ERROR_STOP=1", "-f", verifyScript]);
  console.log("db smoke passed");
} finally {
  await cluster.stop();
}

process.exit(0);
