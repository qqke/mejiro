import { assert, login, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

await withPreviewPage(async ({ page, baseUrl }) => {
  const backend = createMockSupabaseBackend();
  await backend.install(page);
  await login(page, baseUrl, "admin@example.com", "password");

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='home']").waitFor({ state: "attached", timeout: 20000 });
  assert((await page.locator("[data-quick-actions] a").count()) >= 6, "home should expose common task shortcuts");
  await page.locator("[data-quick-actions]").getByText("修繕依頼").waitFor({ state: "visible", timeout: 10000 });
  await page.locator("[data-my-work]").getByText("自分の未完了").waitFor({ state: "visible", timeout: 10000 });

  await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='documents']").waitFor({ state: "attached", timeout: 20000 });
  assert((await page.locator("[data-document-form].hidden").count()) === 1, "document form should start collapsed");
  await page.locator("[data-reveal-target='[data-document-form]']").click();
  assert((await page.locator("[data-document-form].hidden").count()) === 0, "document reveal action should show form");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='home']").waitFor({ state: "attached", timeout: 20000 });
  await page.locator("[data-sidebar-toggle]").click();
  const navStyle = await page.locator("#primary-navigation").evaluate((nav) => {
    const style = window.getComputedStyle(nav);
    return { display: style.display, overflowX: style.overflowX };
  });
  assert(navStyle.display === "grid", `mobile expanded navigation should be vertical grid, got ${navStyle.display}`);
  assert(navStyle.overflowX !== "auto", `mobile expanded navigation should not depend on horizontal scrolling, got ${navStyle.overflowX}`);
});

process.exit(0);
