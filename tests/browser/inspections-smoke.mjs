import { assert, expectText, login, maybeFirstVisibleRole, waitForPath, withPreviewPage } from "./_helpers.mjs";

const email = process.env.SMOKE_EMAIL ?? "";
const password = process.env.SMOKE_PASSWORD ?? "";

async function selectFirstNonEmptyOption(page, selector) {
  const values = await page.locator(selector).evaluate((select) =>
    Array.from(select.options)
      .map((option) => option.value)
      .filter((value) => value.length > 0)
  );
  if (values.length > 0) {
    await page.locator(selector).selectOption(values[0]);
    return values[0];
  }
  return null;
}

await withPreviewPage(async ({ page, baseUrl }) => {
  const pageErrors = [];
  const consoleErrors = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  if (!email || !password) {
    console.log("inspections: anonymous route check");
    await page.goto(`${baseUrl}/inspections/`, { waitUntil: "domcontentloaded" });
    console.log(`inspections: url after goto ${page.url()}`);
    await waitForPath(page, (pathname) => pathname === "/login/" || pathname === "/login");
    console.log(`inspections: url after redirect ${page.url()}`);
    await expectText(page, "h2", "ログイン", "login heading");
    assert((await page.locator("[data-login-form]").count()) === 1, "login form should be present");
    assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
    if (consoleErrors.length > 0) {
      console.warn(`inspections console warnings: ${consoleErrors.join(" | ")}`);
    }
    return;
  }

  console.log("inspections: login flow");
  await login(page, baseUrl, email, password);
  console.log(`inspections: url after login ${page.url()}`);
  console.log("inspections: protected page");
  await page.goto(`${baseUrl}/inspections/`, { waitUntil: "domcontentloaded" });
  console.log(`inspections: url after protected goto ${page.url()}`);
  await page.locator("body[data-page='inspections']").waitFor({ state: "attached", timeout: 20000 });
  await expectText(page, "h1", "長期点検", "inspections heading");
  await expectText(page, "[data-metric='inspection-active']", "0", "inspection active metric");
  await expectText(page, "[data-metric='inspection-due']", "0", "inspection due metric");
  await expectText(page, "[data-metric='inspection-repair']", "0", "inspection repair metric");

  const roleText = await maybeFirstVisibleRole(page);
  const canManage = /理事|管理者/.test(roleText);

  assert((await page.locator("[data-inspection-plan-form]").count()) === 1, "inspection plan form should exist");
  assert((await page.locator("[data-inspection-record-form]").count()) === 1, "inspection record form should exist");

  if (canManage) {
    const assetValue = await selectFirstNonEmptyOption(page, "#inspection-asset");
    const planValue = await selectFirstNonEmptyOption(page, "#inspection-plan");

    await page.locator("#inspection-title").fill("共用ポンプ点検");
    await page.locator("#inspection-frequency").selectOption("quarterly");
    await page.locator("#inspection-next").fill("2026-06-30");
    await page.locator("#inspection-note").fill("点検計画の煙測");
    await page.locator("#inspection-result").selectOption("repair_needed");
    await page.locator("#inspection-date").fill("2026-05-17");
    await page.locator("#inspection-record-note").fill("異常時の記録確認");

    assert((await page.locator("#inspection-frequency").inputValue()) === "quarterly", "inspection frequency should update");
    assert((await page.locator("#inspection-result").inputValue()) === "repair_needed", "inspection result should update");
    assert((await page.locator("#inspection-title").inputValue()) === "共用ポンプ点検", "inspection title should update");
    if (assetValue) {
      assert((await page.locator("#inspection-asset").inputValue()) === assetValue, "inspection asset select should update");
    }
    if (planValue) {
      assert((await page.locator("#inspection-plan").inputValue()) === planValue, "inspection plan select should update");
    }
  } else {
    assert((await page.locator("[data-inspection-plan-form]").getAttribute("class"))?.includes("hidden") ?? false, "inspection plan form should stay hidden for non-managers");
    assert((await page.locator("[data-inspection-record-form]").getAttribute("class"))?.includes("hidden") ?? false, "inspection record form should stay hidden for non-managers");
  }

  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
  if (consoleErrors.length > 0) {
    console.warn(`inspections console warnings: ${consoleErrors.join(" | ")}`);
  }
});

process.exit(0);
