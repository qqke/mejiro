import { assert, expectText, login, waitForPath, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

async function runInvalidLoginCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);
    await page.goto(`${baseUrl}/login/`, { waitUntil: "domcontentloaded" });
    await page.locator("#email").fill("resident@example.com");
    await page.locator("#password").fill("wrong-password");
    await page.locator("[data-login-form] button[type='submit']").click();

    await expectText(page, "[data-status]", "Invalid login credentials", "invalid login message");
    assert((await page.locator("body[data-page='login']").count()) === 1, "invalid login should stay on login page");
  });
}

async function runBoardAccessCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);
    await login(page, baseUrl, "board@example.com", "password");
    await expectText(page, "[data-user-role]", "理事", "board role label");

    await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='meetings']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-meeting-form]").getAttribute("class"))?.includes("hidden") === false, "board member should see meeting form");
    assert((await page.locator("[data-agenda-form]").getAttribute("class"))?.includes("hidden") === false, "board member should see agenda form");
    assert((await page.locator("[data-attendance-form]").count()) === 1, "board member should see attendance form");
    assert((await page.locator("[data-vote-form]").count()) === 1, "board member should see vote form");

    await page.goto(`${baseUrl}/admin/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='admin']").waitFor({ state: "attached", timeout: 20000 });
    await expectText(page, "h1", "アクセス権限がありません", "admin denied heading for board member");

    await page.locator("[data-action='sign-out']").click();
    await waitForPath(page, (pathname) => pathname === "/login/" || pathname === "/login");
    await expectText(page, "h2", "ログイン", "sign-out should return to login");
  });
}

async function runResidentAccessCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);
    await login(page, baseUrl, "resident@example.com", "password");
    await expectText(page, "[data-user-role]", "居民", "resident role label");

    await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='meetings']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-meeting-form]").getAttribute("class"))?.includes("hidden") ?? false, "resident should not see meeting form");
    assert((await page.locator("[data-agenda-form]").getAttribute("class"))?.includes("hidden") ?? false, "resident should not see agenda form");
    assert((await page.locator("[data-attendance-form]").count()) === 1, "resident should still see attendance form");
    assert((await page.locator("[data-vote-form]").count()) === 1, "resident should still see vote form");

    await page.goto(`${baseUrl}/admin/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='admin']").waitFor({ state: "attached", timeout: 20000 });
    await expectText(page, "h1", "アクセス権限がありません", "admin denied heading for resident");
  });
}

await runInvalidLoginCheck();
await runBoardAccessCheck();
await runResidentAccessCheck();

process.exit(0);
