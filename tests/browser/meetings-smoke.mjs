import { assert, expectText, login, maybeFirstVisibleRole, waitForPath, withPreviewPage } from "./_helpers.mjs";

const email = process.env.SMOKE_EMAIL ?? "";
const password = process.env.SMOKE_PASSWORD ?? "";

async function safeGoto(page, url, options) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await page.goto(url, options);
    } catch (error) {
      const message = String(error?.message ?? error);
      if (!message.includes("ERR_ABORTED") || attempt === 1) {
        throw error;
      }
    }
  }
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
    console.log("meetings: anonymous route check");
    await safeGoto(page, `${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
    console.log(`meetings: url after goto ${page.url()}`);
    await waitForPath(page, (pathname) => pathname === "/login/" || pathname === "/login");
    console.log(`meetings: url after redirect ${page.url()}`);
    await expectText(page, "h2", "ログイン", "login heading");
    assert((await page.locator("[data-login-form]").count()) === 1, "login form should be present");
    assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
    if (consoleErrors.length > 0) {
      console.warn(`meetings console warnings: ${consoleErrors.join(" | ")}`);
    }
    return;
  }

  console.log("meetings: login flow");
  await login(page, baseUrl, email, password);
  console.log(`meetings: url after login ${page.url()}`);
  console.log("meetings: protected page");
  await safeGoto(page, `${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
  console.log(`meetings: url after protected goto ${page.url()}`);
  await page.locator("body[data-page='meetings']").waitFor({ state: "attached", timeout: 20000 });
  await expectText(page, "h1", "会議治理", "meetings heading");
  await expectText(page, "[data-metric='meeting-open']", "0", "meeting open metric");
  await expectText(page, "[data-metric='meeting-agendas']", "0", "meeting agenda metric");
  await expectText(page, "[data-metric='meeting-attendance']", "0", "meeting attendance metric");

  const roleText = await maybeFirstVisibleRole(page);
  const canManage = /理事|管理者/.test(roleText);

  assert((await page.locator("[data-attendance-form]").count()) === 1, "attendance form should exist");
  assert((await page.locator("[data-vote-form]").count()) === 1, "vote form should exist");

  await page.locator("#attendance-status").selectOption("proxy");
  await page.locator("#attendance-proxy").fill("代理先テスト");
  await page.locator("#attendance-note").fill("出席・委任の煙測");
  await page.locator("#vote-choice").selectOption("approve");
  await page.locator("#vote-comment").fill("議案は賛成です");

  assert((await page.locator("#attendance-status").inputValue()) === "proxy", "attendance status should update");
  assert((await page.locator("#attendance-proxy").inputValue()) === "代理先テスト", "proxy field should update");
  assert((await page.locator("#vote-choice").inputValue()) === "approve", "vote choice should update");

  if (canManage) {
    assert((await page.locator("[data-meeting-form]").count()) === 1, "meeting form should exist");
    assert((await page.locator("[data-agenda-form]").count()) === 1, "agenda form should exist");

    await page.locator("#meeting-title").fill("第1回テスト会議");
    await page.locator("#meeting-kind").selectOption("general");
    await page.locator("#meeting-location").fill("集会室A");
    await page.locator("#meeting-note").fill("議案の流れを確認する");
    await page.locator("#meeting-scheduled").fill("2026-05-17T10:00");
    await page.locator("#agenda-title").fill("会議進行テスト");
    await page.locator("#agenda-order").fill("1");
    await page.locator("#agenda-description").fill("議案本文の入力確認");

    assert((await page.locator("#meeting-kind").inputValue()) === "general", "meeting kind should update");
    assert((await page.locator("#meeting-title").inputValue()) === "第1回テスト会議", "meeting title should update");
    assert((await page.locator("#agenda-title").inputValue()) === "会議進行テスト", "agenda title should update");
  } else {
    assert((await page.locator("[data-meeting-form]").getAttribute("class"))?.includes("hidden") ?? false, "meeting form should stay hidden for non-managers");
    assert((await page.locator("[data-agenda-form]").getAttribute("class"))?.includes("hidden") ?? false, "agenda form should stay hidden for non-managers");
  }

  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
  if (consoleErrors.length > 0) {
    console.warn(`meetings console warnings: ${consoleErrors.join(" | ")}`);
  }
});

process.exit(0);
