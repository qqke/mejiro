import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const scripts = [
  ["tests/schema-smoke.mjs", "schema"],
  ["tests/db-smoke.mjs", "db"],
  ["tests/browser/auth-permissions-smoke.mjs", "auth-permissions"],
  ["tests/browser/site-smoke.mjs", "site"],
  ["tests/browser/validation-smoke.mjs", "validation"],
  ["tests/browser/responsive-smoke.mjs", "responsive"],
  ["tests/browser/status-branches-smoke.mjs", "status-branches"],
  ["tests/browser/empty-states-smoke.mjs", "empty-states"],
  ["tests/browser/meetings-smoke.mjs", "meetings"],
  ["tests/browser/inspections-smoke.mjs", "inspections"],
  ["tests/browser/documents-crdt-smoke.mjs", "documents-crdt"],
  ["tests/browser/functionality-smoke.mjs", "functionality"],
];

for (const [script, label] of scripts) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], {
      cwd: repoRoot,
      stdio: "inherit",
      windowsHide: true,
      env: process.env,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label} smoke test failed with exit code ${code}`));
      }
    });

    child.on("error", reject);
  });
}
