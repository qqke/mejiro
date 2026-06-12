import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assert,
  expectText,
  login,
  maybeFirstVisibleRole,
  waitForPath,
  withPreviewPage,
} from "./_helpers.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appSource = await readFile(path.join(repoRoot, "src/scripts/app.ts"), "utf8");
assert(!/\balert\s*\(/.test(appSource), "app should use non-blocking toast feedback instead of alert()");

const email = process.env.SMOKE_EMAIL ?? "";
const password = process.env.SMOKE_PASSWORD ?? "";

const protectedPages = [
  { path: "/", page: "home", label: "ホーム", selectors: ["[data-global-search-input]", "[data-metric='pending-bookings']", "[data-home-actions]", "[data-home-risk-list]", "[data-home-bookings]", "[data-home-notices]", "[data-home-events]"] },
  { path: "/rooms/", page: "rooms", label: "会議室", selectors: ["[data-booking-form]", "[data-room-select]", "[data-calendar-action='today']", "[data-booking-calendar]"] },
  { path: "/notices/", page: "notices", label: "通知・課題", selectors: ["[data-notice-form]", "[data-notice-list]"] },
  { path: "/events/", page: "events", label: "年間行事", selectors: ["[data-event-form]", "[data-event-list]", "[data-event-calendar]", "[data-action='next-event-month']"] },
  { path: "/documents/", page: "documents", label: "管理文書", selectors: ["[data-document-form]", "[data-document-list]", "[data-document-actions-template]", "[data-document-search]"] },
  { path: "/maintenance/", page: "maintenance", label: "修繕工事", selectors: ["[data-maintenance-form]", "[data-maintenance-list]", "[data-maintenance-filter='in_progress']", "[data-maintenance-search]"] },
  { path: "/finance/", page: "finance", label: "収支台帳", selectors: ["[data-finance-form]", "[data-finance-list]", "[data-finance-filter='expense']", "[data-finance-search]"] },
  { path: "/assets/", page: "assets", label: "資産台帳", selectors: ["[data-asset-form]", "[data-asset-list]", "[data-asset-filter='repair_needed']", "[data-asset-search]"] },
  { path: "/vendors/", page: "vendors", label: "業者契約", selectors: ["[data-vendor-form]", "[data-contract-form]", "[data-vendor-list]", "[data-contract-list]", "[data-vendor-search]", "[data-contract-search]"] },
  { path: "/residents/", page: "residents", label: "住民名簿", selectors: ["[data-resident-profile-form]", "[data-resident-list]"] },
  { path: "/surveys/", page: "surveys", label: "意見収集", selectors: ["[data-survey-form]", "[data-survey-list]"] },
  { path: "/safety/", page: "safety", label: "防災安否", selectors: ["[data-safety-form]", "[data-safety-list]"] },
  { path: "/tasks/", page: "tasks", label: "理事タスク", selectors: ["[data-task-form]", "[data-task-list]", "[data-task-filter='done']"] },
  { path: "/parking/", page: "parking", label: "駐車場", selectors: ["[data-parking-space-form]", "[data-parking-permit-form]", "[data-parking-space-list]", "[data-parking-permit-list]", "[data-parking-space-search]", "[data-parking-permit-search]", "[data-parking-layout]"] },
  { path: "/requests/", page: "requests", label: "相談苦情", selectors: ["[data-resident-request-form]", "[data-resident-request-list]", "[data-request-filter='in_progress']", "[data-request-search]"] },
  { path: "/circulars/", page: "circulars", label: "回覧配布", selectors: ["[data-circular-form]", "[data-circular-list]", "[data-circular-ack-list]", "[data-circular-search]", "[data-circular-ack-search]"] },
  { path: "/lending/", page: "lending", label: "鍵貸出", selectors: ["[data-lending-item-form]", "[data-lending-request-form]", "[data-lending-item-list]", "[data-lending-request-list]", "[data-lending-item-search]", "[data-lending-request-search]"] },
  { path: "/duties/", page: "duties", label: "当番巡回", selectors: ["[data-duty-form]", "[data-duty-list]", "[data-duty-own-list]", "[data-duty-search]", "[data-duty-own-search]"] },
  { path: "/waste/", page: "waste", label: "ごみ資源", selectors: ["[data-waste-schedule-form]", "[data-bulky-request-form]", "[data-waste-schedule-list]", "[data-bulky-request-list]", "[data-waste-schedule-search]", "[data-bulky-request-search]"] },
  { path: "/meetings/", page: "meetings", label: "会議治理", selectors: ["[data-meeting-form]", "[data-agenda-form]", "[data-attendance-form]", "[data-vote-form]", "[data-meeting-list]", "[data-agenda-list]", "[data-meeting-search]", "[data-agenda-search]"] },
  { path: "/inspections/", page: "inspections", label: "長期点検", selectors: ["[data-inspection-plan-form]", "[data-inspection-record-form]", "[data-inspection-plan-list]", "[data-inspection-record-list]", "[data-inspection-plan-search]", "[data-inspection-record-search]"] },
  { path: "/admin/", page: "admin", label: "管理", selectors: ["[data-room-form]", "[data-room-list]", "[data-profile-list]", "[data-activity-log-search]", "[data-activity-log-action]", "[data-activity-log-list]"] },
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
    assert((await page.locator("[data-toast-region][aria-live='polite']").count()) === 1, `${route.page} should include toast feedback region`);

    if (route.page === "home") {
      await expectText(page, "[data-metric='home-actions']", "8", "home actionable work metric");
      await expectText(page, "[data-metric='home-risks']", "6", "home risk metric");
      assert((await page.locator("[data-home-actions] .list-item").count()) >= 4, "home should show actionable work items");
      assert((await page.locator("[data-home-risk-list] .list-item").count()) >= 3, "home should show risk reminder items");
    }

    if (route.page === "home") {
      assert((await page.locator("[data-nav-group='daily']").count()) === 1, "daily nav group should exist");
      assert((await page.locator("[data-nav-group='board']").count()) === 1, "board nav group should exist");
      assert((await page.locator("[data-nav-group='operations']").count()) === 1, "operations nav group should exist");
      assert((await page.locator("[data-nav-group='admin']").count()) === 1, "admin nav group should exist");
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

    if (route.page === "documents") {
      await page.locator("[data-document-search]").fill("該当なし");
      await expectText(page, "[data-document-list]", "検索条件に一致する文書はありません。", "document search empty state");
      await page.locator("[data-document-search]").fill("");
    }

    if (route.page === "finance") {
      await page.locator("[data-finance-search]").fill("該当なし");
      await expectText(page, "[data-finance-list]", "検索条件に一致する台帳記録はありません。", "finance search empty state");
      await page.locator("[data-finance-search]").fill("");
    }

    if (route.page === "assets") {
      await page.locator("[data-asset-search]").fill("該当なし");
      await expectText(page, "[data-asset-list]", "検索条件に一致する資産はありません。", "asset search empty state");
      await page.locator("[data-asset-search]").fill("");
    }

    if (route.page === "vendors") {
      await page.locator("[data-contract-search]").fill("該当なし");
      await expectText(page, "[data-contract-list]", "検索条件に一致する契約はありません。", "contract search empty state");
      await page.locator("[data-vendor-search]").fill("");
      await page.locator("[data-contract-search]").fill("");
    }

    if (route.page === "maintenance") {
      await page.locator("[data-maintenance-search]").fill("該当なし");
      await expectText(page, "[data-maintenance-list]", "検索条件に一致する修繕依頼はありません。", "maintenance search empty state");
      await page.locator("[data-maintenance-search]").fill("");
      await expectText(page, "[data-maintenance-list]", "廊下の照明不点灯", "maintenance search reset");
    }

    if (route.page === "parking") {
      assert((await page.locator("#parking-kind").count()) === 0, "parking page should not expose bicycle or motorbike kind choices");
      await page.locator("[data-parking-layout-space='P-01']").waitFor({ state: "attached", timeout: 10000 });
      assert((await page.locator("[data-parking-layout-space='P-01']").filter({ hasText: "申請中" }).count()) === 1, "parking layout should show pending P-01");
      await page.locator("[data-parking-space-search]").fill("北側");
      await expectText(page, "[data-parking-space-list]", "P-01", "parking space search match");
      await page.locator("[data-parking-permit-search]").fill("該当なし");
      await expectText(page, "[data-parking-permit-list]", "検索条件に一致する利用申請はありません。", "parking permit search empty state");
      await page.locator("[data-parking-permit-search]").fill("");
      await expectText(page, "[data-parking-permit-list]", "白い車", "parking permit search reset");
    }

    if (route.page === "circulars") {
      await page.locator("[data-circular-search]").fill("該当なし");
      await expectText(page, "[data-circular-list]", "検索条件に一致する回覧はありません。", "circular search empty state");
      await page.locator("[data-circular-search]").fill("");
      await page.locator("[data-circular-ack-search]").fill("該当なし");
      await expectText(page, "[data-circular-ack-list]", "検索条件に一致する確認履歴はありません。", "circular ack search empty state");
      await page.locator("[data-circular-ack-search]").fill("");
    }

    if (route.page === "lending") {
      await page.locator("[data-lending-item-search]").fill("該当なし");
      await expectText(page, "[data-lending-item-list]", "検索条件に一致する貸出品はありません。", "lending item search empty state");
      await page.locator("[data-lending-item-search]").fill("");
      await page.locator("[data-lending-request-search]").fill("該当なし");
      await expectText(page, "[data-lending-request-list]", "検索条件に一致する貸出申請はありません。", "lending request search empty state");
      await page.locator("[data-lending-request-search]").fill("");
    }

    if (route.page === "duties") {
      await page.locator("[data-duty-search]").fill("該当なし");
      await expectText(page, "[data-duty-list]", "検索条件に一致する当番はありません。", "duty search empty state");
      await page.locator("[data-duty-search]").fill("");
      await page.locator("[data-duty-own-search]").fill("該当なし");
      await expectText(page, "[data-duty-own-list]", "検索条件に一致する当番はありません。", "own duty search empty state");
      await page.locator("[data-duty-own-search]").fill("");
    }

    if (route.page === "waste") {
      await page.locator("[data-waste-schedule-search]").fill("該当なし");
      await expectText(page, "[data-waste-schedule-list]", "検索条件に一致する収集ルールはありません。", "waste schedule search empty state");
      await page.locator("[data-waste-schedule-search]").fill("");
      await page.locator("[data-bulky-request-search]").fill("該当なし");
      await expectText(page, "[data-bulky-request-list]", "検索条件に一致する粗大ごみ申請はありません。", "bulky waste search empty state");
      await page.locator("[data-bulky-request-search]").fill("");
    }

    if (route.page === "requests") {
      await page.locator("[data-request-search]").fill("夜間");
      await expectText(page, "[data-resident-request-list]", "騒音相談", "request search match");
      await page.locator("[data-request-search]").fill("該当なし");
      await expectText(page, "[data-resident-request-list]", "検索条件に一致する相談・苦情はありません。", "request search empty state");
      await page.locator("[data-request-search]").fill("");
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
      await page.locator("[data-meeting-search]").fill("該当なし");
      await expectText(page, "[data-meeting-list]", "検索条件に一致する会議はありません。", "meeting search empty state");
      await page.locator("[data-meeting-search]").fill("");
      await page.locator("[data-agenda-search]").fill("該当なし");
      await expectText(page, "[data-agenda-list]", "検索条件に一致する議案はありません。", "agenda search empty state");
      await page.locator("[data-agenda-search]").fill("");
      await page.locator("#attendance-status").selectOption("proxy");
      await page.locator("#attendance-proxy").fill("代理先");
      await page.locator("#vote-choice").selectOption("approve");
      assert((await page.locator("#attendance-status").inputValue()) === "proxy", "meeting attendance select should update");
      assert((await page.locator("#vote-choice").inputValue()) === "approve", "meeting vote select should update");
    }

    if (route.page === "inspections") {
      await page.locator("[data-inspection-plan-search]").fill("該当なし");
      await expectText(page, "[data-inspection-plan-list]", "検索条件に一致する点検計画はありません。", "inspection plan search empty state");
      await page.locator("[data-inspection-plan-search]").fill("");
      await page.locator("[data-inspection-record-search]").fill("該当なし");
      await expectText(page, "[data-inspection-record-list]", "検索条件に一致する点検記録はありません。", "inspection record search empty state");
      await page.locator("[data-inspection-record-search]").fill("");
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
