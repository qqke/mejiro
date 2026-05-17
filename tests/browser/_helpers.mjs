import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (predicate(new URL(page.url()).pathname)) {
      return;
    }
    await delay(250);
  }

  throw new Error(`Timed out waiting for page path on ${page.url()}`);
}

export async function withPreviewPage(run) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const previewArgs = ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)];
  const child = process.platform === "win32"
    ? spawn("cmd.exe", ["/c", "npm", ...previewArgs], {
        cwd: repoRoot,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      })
    : spawn("npm", previewArgs, {
        cwd: repoRoot,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
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
      const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
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
  await page.locator("[data-login-form] button[type='submit']").click();
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
