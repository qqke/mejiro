import { assert, login, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

async function waitPage(page, pageName) {
  await page.locator(`body[data-page='${pageName}']`).waitFor({ state: "attached", timeout: 20000 });
}

async function waitForCondition(condition, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

await withPreviewPage(async ({ page, baseUrl }) => {
  const backend = createMockSupabaseBackend();
  await backend.install(page);

  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await login(page, baseUrl, "admin@example.com", "password");
  await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "documents");
  assert((await page.locator("#document-url").count()) === 0, "document registration should not expose file URL");
  assert((await page.locator("[name='markdown_body']").count()) === 1, "document registration should expose markdown body");

  const row = page.locator("[data-document-list] .list-item").filter({ hasText: "管理規約改定案" });
  await row.locator("[data-document-open]").click();

  await page.locator("[data-document-editor]").waitFor({ state: "visible", timeout: 20000 });
  await page.locator("[data-document-editor] .cm-content").click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.type("# 管理規約改定案\n\n- 第一条を更新\n- 第二条を追加");
  await page.locator("[data-document-save-version]").click();

  await waitForCondition(
    () => backend.state.document_versions.some((version) => version.document_id === "doc-1" && version.markdown_body.includes("第二条を追加")),
    "document version save",
  );

  await page.locator("[data-document-editor] .cm-content").click();
  await page.keyboard.press("End");
  await page.keyboard.type("\n- 第三条を追加");
  await page.locator("[data-document-save-version]").click();

  await waitForCondition(
    () => backend.state.document_versions.filter((version) => version.document_id === "doc-1").length >= 3,
    "second document version save",
  );

  await page.locator("[data-document-show-diff]").click();
  await page.locator("[data-document-diff]").waitFor({ state: "visible", timeout: 20000 });
  const diffText = await page.locator("[data-document-diff]").textContent();
  assert(diffText.includes("第三条を追加"), "diff should show the added markdown line");

  await page.locator("[data-document-print]").click();
  await page.locator("[data-document-print-view]").waitFor({ state: "visible", timeout: 20000 });
  const printText = await page.locator("[data-document-print-view]").textContent();
  assert(printText.includes("管理規約改定案"), "print view should include document title");
  assert(printText.includes("第三条を追加"), "print view should include latest markdown");
  await waitForCondition(
    () => page.evaluate(() => window.__MEJIRO_PRINT_CALLED__ === true),
    "browser print call",
  );

  const channelEvents = backend.realtimeEvents.filter((event) => event.topic === "document-crdt:doc-1");
  assert(channelEvents.some((event) => event.event === "y-update"), "editor should broadcast Yjs document updates");
  assert(channelEvents.some((event) => event.event === "awareness"), "editor should broadcast awareness updates");
  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
});

process.exit(0);
