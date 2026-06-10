import { assert, login, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

async function expectNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - window.innerWidth;
  });
  assert(overflow <= 1, `${label} should not overflow horizontally by ${overflow}px`);
}

await withPreviewPage(
  async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);

    await login(page, baseUrl, "admin@example.com", "password");

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='home']").waitFor({ state: "attached", timeout: 20000 });
    await expectNoHorizontalOverflow(page, "home");

    await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='meetings']").waitFor({ state: "attached", timeout: 20000 });
    await expectNoHorizontalOverflow(page, "meetings");

    await page.goto(`${baseUrl}/inspections/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='inspections']").waitFor({ state: "attached", timeout: 20000 });
    await expectNoHorizontalOverflow(page, "inspections");

    await page.goto(`${baseUrl}/residents/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='residents']").waitFor({ state: "attached", timeout: 20000 });
    await expectNoHorizontalOverflow(page, "residents");
    const profileTop = await page.locator("[data-resident-profile-form]").evaluate((element) => element.getBoundingClientRect().top);
    assert(profileTop < 560, `resident profile form should begin in the first mobile viewport, got top ${profileTop}px`);
  },
  { viewport: { width: 390, height: 844 } },
);

process.exit(0);
