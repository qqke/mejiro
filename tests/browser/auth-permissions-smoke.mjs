import { assert, expectText, login, waitForPath, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

async function waitForCondition(condition, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

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

async function runDocumentStageRoleCheck(email, status, expectedRoleLabel, expectedButtonText) {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    backend.state.management_documents[0].status = status;
    await backend.install(page);
    await login(page, baseUrl, email, "password");
    await expectText(page, "[data-user-role]", expectedRoleLabel, `${email} role label`);

    await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='documents']").waitFor({ state: "attached", timeout: 20000 });
    const document = page.locator("[data-document-list] .list-item").filter({ hasText: "管理規約改定案" });
    await document.waitFor({ state: "visible", timeout: 20000 });
    await expectText(page, "[data-document-list] [data-document-approve]", expectedButtonText, `${email} stage approval button`);
  });
}

async function runDocumentStageDeniedCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    backend.state.management_documents[0].status = "chair_review";
    await backend.install(page);
    await login(page, baseUrl, "board@example.com", "password");

    await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='documents']").waitFor({ state: "attached", timeout: 20000 });
    const document = page.locator("[data-document-list] .list-item").filter({ hasText: "管理規約改定案" });
    await document.waitFor({ state: "visible", timeout: 20000 });
    assert((await document.locator("[data-document-approve]").count()) === 0, "board member should not approve chair stage");
    assert(/主席承認待ち/.test((await document.textContent()) ?? ""), "board member should see chair pending label");
  });
}

async function runDocumentRejectResubmitCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    backend.state.management_documents[0].status = "chair_review";
    await backend.install(page);
    await login(page, baseUrl, "admin@example.com", "password");

    await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='documents']").waitFor({ state: "attached", timeout: 20000 });
    const document = page.locator("[data-document-list] .list-item").filter({ hasText: "管理規約改定案" });
    await document.locator("[data-document-reject]").click();
    await waitForCondition(() => backend.state.management_documents[0].status === "rejected", "chair-stage rejection");
    assert(backend.state.document_approvals.some((approval) => approval.stage === "chair" && approval.action === "rejected"), "rejection should record chair stage");

    await document.locator("[data-document-resubmit]").click();
    await waitForCondition(() => backend.state.management_documents[0].status === "board_review", "document resubmission");
  });
}

await runInvalidLoginCheck();
await runBoardAccessCheck();
await runResidentAccessCheck();
await runDocumentStageRoleCheck("board@example.com", "board_review", "理事", "理事承認");
await runDocumentStageRoleCheck("chair@example.com", "chair_review", "主席", "主席承認");
await runDocumentStageRoleCheck("president@example.com", "president_review", "理事長", "理事長承認");
await runDocumentStageRoleCheck("admin@example.com", "chair_review", "管理者", "主席承認");
await runDocumentStageDeniedCheck();
await runDocumentRejectResubmitCheck();

process.exit(0);
