import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
let previewBuildPromise = null;

function smokeEnv(extra = {}) {
  return {
    ...process.env,
    ASTRO_BASE_PATH: process.env.ASTRO_BASE_PATH ?? "",
    PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL ?? "http://127.0.0.1",
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL ?? "https://example.supabase.co",
    PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "public-anon-key",
    ...extra,
  };
}

async function ensurePreviewBuild() {
  const distEntry = path.join(repoRoot, "dist", "index.html");
  if (existsSync(distEntry)) return;
  if (!previewBuildPromise) {
    previewBuildPromise = new Promise((resolve, reject) => {
      const buildArgs = ["run", "build"];
      const child = process.platform === "win32"
        ? spawn("cmd.exe", ["/c", "npm", ...buildArgs], {
            cwd: repoRoot,
            stdio: "inherit",
            windowsHide: true,
            env: smokeEnv(),
          })
        : spawn("npm", buildArgs, {
            cwd: repoRoot,
            stdio: "inherit",
            windowsHide: true,
            env: smokeEnv(),
          });

      child.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm run build failed with exit code ${code}`));
        }
      });

      child.on("error", reject);
    });
  }

  await previewBuildPromise;
}

export async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
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

export async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok) return;
      lastError = new Error(`Server responded with ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(250);
  }

  throw lastError ?? new Error(`Timed out waiting for ${url}`);
}

export async function waitForPath(page, predicate, timeoutMs = 20000) {
  const matchesCurrentPath = () => predicate(new URL(page.url()).pathname);
  if (matchesCurrentPath()) return;

  try {
    await page.waitForURL((url) => predicate(url.pathname), { timeout: timeoutMs });
    return;
  } catch {
    if (matchesCurrentPath()) return;
  }

  throw new Error(`Timed out waiting for page path on ${page.url()}`);
}

export async function withPreviewPage(run, options = {}) {
  await ensurePreviewBuild();
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const previewArgs = ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)];
  const child = process.platform === "win32"
    ? spawn("cmd.exe", ["/c", "npm", ...previewArgs], {
        cwd: repoRoot,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        env: smokeEnv(),
      })
    : spawn("npm", previewArgs, {
        cwd: repoRoot,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        env: smokeEnv(),
      });

  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage({ viewport: options.viewport ?? { width: 1440, height: 1200 } });
      await run({ page, baseUrl, port, output: () => output });
    } finally {
      await Promise.race([
        browser.close(),
        delay(3000),
      ]);
    }
  } finally {
    child.kill();
    await delay(500);
  }
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function login(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/login/`, { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#password").press("Enter");
  await waitForPath(page, (pathname) => pathname === "/" || pathname === "");
}

export async function expectText(page, selector, expected, label) {
  const startedAt = Date.now();
  let actual = "";

  while (Date.now() - startedAt < 10000) {
    actual = (await page.locator(selector).textContent())?.trim() ?? "";
    if (actual === expected) {
      return;
    }
    await delay(100);
  }

  assert(actual === expected, `${label} expected "${expected}" but got "${actual}"`);
}

export async function maybeFirstVisibleRole(page) {
  const role = (await page.locator("[data-user-role]").textContent())?.trim() ?? "";
  return role;
}
