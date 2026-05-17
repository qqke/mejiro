import {
  assert,
  expectText,
  login,
  maybeFirstVisibleRole,
  waitForPath,
  withPreviewPage,
} from "./_helpers.mjs";

const email = process.env.SMOKE_EMAIL ?? "";
const password = process.env.SMOKE_PASSWORD ?? "";

const protectedPages = [
  { path: "/", page: "home", label: "ホーム", selectors: ["[data-metric='pending-bookings']", "[data-home-bookings]", "[data-home-notices]", "[data-home-events]"] },
  { path: "/rooms/", page: "rooms", label: "会議室", selectors: ["[data-booking-form]", "[data-room-select]", "[data-calendar-action='today']", "[data-booking-calendar]"] },
  { path: "/notices/", page: "notices", label: "通知・課題", selectors: ["[data-notice-form]", "[data-notice-list]"] },
  { path: "/events/", page: "events", label: "年間行事", selectors: ["[data-event-form]", "[data-event-list]", "[data-event-calendar]", "[data-action='next-event-month']"] },
  { path: "/documents/", page: "documents", label: "管理文書", selectors: ["[data-document-form]", "[data-document-list]", "[data-document-actions-template]"] },
  { path: "/maintenance/", page: "maintenance", label: "修繕工事", selectors: ["[data-maintenance-form]", "[data-maintenance-list]", "[data-maintenance-filter='in_progress']"] },
  { path: "/finance/", page: "finance", label: "収支台帳", selectors: ["[data-finance-form]", "[data-finance-list]", "[data-finance-filter='expense']"] },
  { path: "/assets/", page: "assets", label: "資産台帳", selectors: ["[data-asset-form]", "[data-asset-list]", "[data-asset-filter='repair_needed']"] },
  { path: "/vendors/", page: "vendors", label: "業者契約", selectors: ["[data-vendor-form]", "[data-contract-form]", "[data-vendor-list]", "[data-contract-list]"] },
  { path: "/residents/", page: "residents", label: "住民名簿", selectors: ["[data-resident-profile-form]", "[data-resident-list]"] },
  { path: "/surveys/", page: "surveys", label: "意見収集", selectors: ["[data-survey-form]", "[data-survey-list]"] },
  { path: "/safety/", page: "safety", label: "防災安否", selectors: ["[data-safety-form]", "[data-safety-list]"] },
  { path: "/tasks/", page: "tasks", label: "理事タスク", selectors: ["[data-task-form]", "[data-task-list]", "[data-task-filter='done']"] },
  { path: "/parking/", page: "parking", label: "駐車駐輪", selectors: ["[data-parking-space-form]", "[data-parking-permit-form]", "[data-parking-space-list]", "[data-parking-permit-list]"] },
  { path: "/requests/", page: "requests", label: "相談苦情", selectors: ["[data-resident-request-form]", "[data-resident-request-list]", "[data-request-filter='in_progress']"] },
  { path: "/circulars/", page: "circulars", label: "回覧配布", selectors: ["[data-circular-form]", "[data-circular-list]", "[data-circular-ack-list]"] },
  { path: "/lending/", page: "lending", label: "鍵貸出", selectors: ["[data-lending-item-form]", "[data-lending-request-form]", "[data-lending-item-list]", "[data-lending-request-list]"] },
  { path: "/duties/", page: "duties", label: "当番巡回", selectors: ["[data-duty-form]", "[data-duty-list]", "[data-duty-own-list]"] },
  { path: "/waste/", page: "waste", label: "ごみ資源", selectors: ["[data-waste-schedule-form]", "[data-bulky-request-form]", "[data-waste-schedule-list]", "[data-bulky-request-list]"] },
  { path: "/meetings/", page: "meetings", label: "会議治理", selectors: ["[data-meeting-form]", "[data-agenda-form]", "[data-attendance-form]", "[data-vote-form]", "[data-meeting-list]", "[data-agenda-list]"] },
  { path: "/inspections/", page: "inspections", label: "長期点検", selectors: ["[data-inspection-plan-form]", "[data-inspection-record-form]", "[data-inspection-plan-list]", "[data-inspection-record-list]"] },
  { path: "/admin/", page: "admin", label: "管理", selectors: ["[data-room-form]", "[data-room-list]", "[data-profile-list]"] },
];

await withPreviewPage(async ({ page, baseUrl }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  const canLogin = Boolean(email && password);
  let currentRole = "anonymous";

  if (canLogin) {
    console.log("site: login flow");
    await login(page, baseUrl, email, password);
    currentRole = await maybeFirstVisibleRole(page);
    assert(/居民|理事|管理者/.test(currentRole), `unexpected role label: ${currentRole}`);
  }

  for (const route of protectedPages) {
    console.log(`site: ${route.page}`);
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });

    if (!canLogin) {
      await waitForPath(page, (pathname) => pathname === "/login/" || pathname === "/login");
      await expectText(page, "h2", "ログイン", `${route.page} login heading`);
      assert((await page.locator("[data-login-form]").count()) === 1, `${route.page} should show login form`);
      continue;
    }

    await page.locator(`body[data-page='${route.page}']`).waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator(`body[data-page='${route.page}']`).count()) === 1, `${route.page} body marker missing`);
    assert((await page.locator("h1").count()) >= 1, `${route.page} should render a heading`);

    for (const selector of route.selectors) {
      assert((await page.locator(selector).count()) >= 1, `${route.page} missing ${selector}`);
    }

    if (route.page === "rooms") {
      const titleBefore = (await page.locator("[data-calendar-title]").textContent()) ?? "";
      await page.locator("[data-calendar-action='next']").click();
      const titleAfter = (await page.locator("[data-calendar-title]").textContent()) ?? "";
      assert(titleBefore !== titleAfter, "rooms calendar next button should update the title");
    }

    if (route.page === "events") {
      const monthBefore = (await page.locator("[data-event-month]").textContent()) ?? "";
      await page.locator("[data-action='next-event-month']").click();
      const monthAfter = (await page.locator("[data-event-month]").textContent()) ?? "";
      assert(monthBefore !== monthAfter, "events next-month button should update the month");
    }

    if (route.page === "assets" || route.page === "finance" || route.page === "maintenance" || route.page === "tasks" || route.page === "requests") {
      const filterSelector =
        route.page === "assets"
          ? "[data-asset-filter='repair_needed']"
          : route.page === "finance"
            ? "[data-finance-filter='expense']"
            : route.page === "maintenance"
              ? "[data-maintenance-filter='in_progress']"
              : route.page === "tasks"
                ? "[data-task-filter='done']"
                : "[data-request-filter='in_progress']";
      await page.locator(filterSelector).click();
      assert((await page.locator(`${filterSelector}.active`).count()) === 1, `${route.page} filter should become active`);
    }

    if (route.page === "meetings") {
      await page.locator("#attendance-status").selectOption("proxy");
      await page.locator("#attendance-proxy").fill("代理先");
      await page.locator("#vote-choice").selectOption("approve");
      assert((await page.locator("#attendance-status").inputValue()) === "proxy", "meeting attendance select should update");
      assert((await page.locator("#vote-choice").inputValue()) === "approve", "meeting vote select should update");
    }

    if (route.page === "inspections") {
      const frequency = await page.locator("#inspection-frequency").inputValue();
      const result = await page.locator("#inspection-result").inputValue();
      assert(Boolean(frequency), "inspection frequency should have a value");
      assert(Boolean(result), "inspection result should have a value");
    }

    if (route.page === "admin") {
      if (currentRole === "管理者") {
        const roleSelectCount = await page.locator("[data-role-select]").count();
        assert(roleSelectCount >= 1, "admin should show role selects");
        assert((await page.locator("[data-profile-list]").count()) === 1, "admin profile list should be visible");
      } else {
        await expectText(page, "h1", "アクセス権限がありません", "admin denied heading");
      }
    }
  }

  if (pageErrors.length > 0) {
    console.warn(`site console warnings: ${pageErrors.join(" | ")}`);
  }
});

process.exit(0);
