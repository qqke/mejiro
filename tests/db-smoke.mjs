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

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', '{"display_name":"管理者DB"}'),
  ('22222222-2222-2222-2222-222222222222', 'board@example.com', '{"display_name":"理事DB"}'),
  ('33333333-3333-3333-3333-333333333333', 'resident@example.com', '{"display_name":"住民DB"}')
on conflict (id) do nothing;

update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set role = 'board_member' where id = '22222222-2222-2222-2222-222222222222';

insert into public.rooms (id, name, capacity, notes, is_active)
values ('44444444-4444-4444-4444-444444444444', 'DB会議室', 24, 'db smoke', true)
on conflict do nothing;

insert into public.asset_items (id, name, category, status, location, inspection_due_at, note, managed_by, created_by, created_at, updated_at)
values ('55555555-5555-5555-5555-555555555555', 'DB共用ポンプ', 'equipment', 'active', '機械室', '2026-06-01', 'db smoke', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', now(), now())
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

  update public.room_bookings set status = 'approved' where purpose = 'DB smoke booking';
  get diagnostics actual = row_count;
  if actual <> 0 then
    raise exception 'resident should not be able to update room bookings';
  end if;

  insert into public.meeting_attendances (meeting_id, user_id, status, proxy_to, note)
  values ('66666666-6666-6666-6666-666666666661', auth.uid(), 'attending', null, 'resident attendance');

  insert into public.meeting_votes (agenda_item_id, user_id, choice, comment)
  values ('77777777-7777-7777-7777-777777777771', auth.uid(), 'approve', 'resident vote');
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
