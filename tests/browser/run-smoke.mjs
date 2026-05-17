import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const scripts = [
  ["tests/browser/site-smoke.mjs", "site"],
  ["tests/browser/meetings-smoke.mjs", "meetings"],
  ["tests/browser/inspections-smoke.mjs", "inspections"],
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
