import { assert, login, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

async function installMockAndLogin(page, baseUrl) {
  const backend = createMockSupabaseBackend();
  await backend.install(page);
  await login(page, baseUrl, "admin@example.com", "password");
}

await withPreviewPage(async ({ page, baseUrl }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installMockAndLogin(page, baseUrl);

  for (const route of ["/", "/rooms/", "/documents/"]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 20000 });
    assert((await page.locator(".panel").count()) >= 1, `${route} should render panels with reduced motion`);
  }
});

await withPreviewPage(async ({ page, baseUrl }) => {
  await installMockAndLogin(page, baseUrl);

  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='home']").waitFor({ state: "attached", timeout: 20000 });
  const transitionDuration = await page.locator(".button").first().evaluate((element) => {
    return getComputedStyle(element).transitionDuration;
  });
  assert(!/^0(?:s|ms)(?:,\s*0(?:s|ms))*$/.test(transitionDuration), "buttons should expose motion transition timing");

  await page.goto(`${baseUrl}/rooms/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='rooms']").waitFor({ state: "attached", timeout: 20000 });
  await page.locator(".fc-event").first().click();
  await page.locator("[data-booking-detail]").waitFor({ state: "visible", timeout: 20000 });
  const modal = page.locator("[data-booking-modal]");
  await modal.waitFor({ state: "visible", timeout: 20000 });
  assert(!(await modal.evaluate((element) => element.classList.contains("hidden"))), "booking modal should open");
  await page.locator("[data-booking-modal-close]").click();
  await page.waitForFunction(() => document.querySelector("[data-booking-modal]")?.classList.contains("hidden"));

  await page.goto(`${baseUrl}/maintenance/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='maintenance']").waitFor({ state: "attached", timeout: 20000 });
  await page.locator("[data-maintenance-filter='in_progress']").click();
  assert((await page.locator("[data-maintenance-filter='in_progress'].active").count()) === 1, "maintenance filter should become active");
  assert((await page.locator("[data-maintenance-list]").count()) === 1, "maintenance list should remain mounted");
});

process.exit(0);
