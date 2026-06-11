import { assert, expectText, login, maybeFirstVisibleRole, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

function form(page, selector) {
  return page.locator(selector);
}

async function firstOptionValue(page, selector) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    const value = await page.locator(selector).evaluate((select) => {
      const option = select.querySelector("option[value]:not([value=''])");
      return option?.value ?? "";
    });
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for first option in ${selector}`);
}

async function waitForCount(locator, expected, label) {
  const startedAt = Date.now();
  let actual = 0;

  while (Date.now() - startedAt < 10000) {
    actual = await locator.count();
    if (actual === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  assert(actual === expected, `${label} expected ${expected} items but got ${actual}`);
}

async function waitForCondition(condition, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function fillSubmit(page, selector, fields) {
  const formLocator = page.locator(selector);
  if ((await formLocator.evaluate((element) => element.classList.contains("hidden")))) {
    await page.locator(`[data-reveal-target="${selector}"]`).click();
  }
  for (const [field, value] of Object.entries(fields)) {
    const control = formLocator.locator(`[name="${field}"]`);
    const tag = await control.evaluate((element) => element.tagName.toLowerCase());
    if (tag === "select") {
      await control.selectOption(String(value));
    } else {
      await control.fill(String(value));
    }
  }
  await formLocator.locator("button[type='submit']").click();
}

function currentMonthEventCount(events) {
  const now = new Date();
  return events.filter((event) => {
    const start = new Date(event.start_at);
    return start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth();
  }).length;
}

async function clickAndConfirm(page, action, expectedMessage) {
  let sawDialog = false;
  page.once("dialog", async (dialog) => {
    sawDialog = dialog.message().includes(expectedMessage);
    await dialog.accept();
  });
  await action();
  await waitForCondition(() => sawDialog, `${expectedMessage} confirmation dialog`);
}

async function waitPage(page, pageName) {
  await page.locator(`body[data-page='${pageName}']`).waitFor({ state: "attached", timeout: 20000 });
}

await withPreviewPage(async ({ page, baseUrl }) => {
  const backend = createMockSupabaseBackend();
  await backend.install(page);

  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await login(page, baseUrl, "admin@example.com", "password");
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "home");
  assert(/管理者|理事|居民/.test(await maybeFirstVisibleRole(page)), "role label should render");

  await expectText(page, "[data-metric='pending-bookings']", "2", "home pending bookings");
  await expectText(page, "[data-metric='unread-notices']", "1", "home unread notices");
  await expectText(page, "[data-metric='month-events']", String(currentMonthEventCount(backend.state.events)), "home month events");
  await expectText(page, "[data-metric='home-actions']", "8", "home actionable work metric");
  await expectText(page, "[data-metric='home-risks']", "6", "home risk metric");
  assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "会議室予約の承認" }).count()) === 1, "home should surface pending booking approvals");
  assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "管理文書の承認" }).count()) === 1, "home should surface pending document approvals");
  assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "回覧の確認" }).count()) === 1, "home should surface unread circulars");
  assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "粗大ごみ申請" }).count()) === 1, "home should surface submitted bulky waste requests");
  assert((await page.locator("[data-home-risk-list] .list-item").filter({ hasText: "理事会タスク期限" }).count()) === 1, "home should surface board task due risks");
  assert((await page.locator("[data-home-risk-list] .list-item").filter({ hasText: "契約更新注意" }).count()) === 1, "home should surface contract renewal risks");
  await page.locator("[data-global-search-input]").fill("承認");
  assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "会議室" }).count()) === 1, "global search should find room approvals by business keyword");
  assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "管理文書" }).count()) === 1, "global search should find document approvals by business keyword");
  await page.locator("[data-global-search-input]").press("Escape");
  await page.locator("[data-global-search-input]").fill("未確認");
  assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "回覧配布" }).count()) === 1, "global search should find circulars by unread business keyword");
  await page.locator("[data-global-search-input]").fill("粗大ごみ申請");
  assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "ごみ資源" }).count()) === 1, "global search should find waste by bulky request keyword");
  await page.locator("[data-global-search-input]").fill("粗大 ごみ 申請");
  assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "ごみ資源" }).count()) === 1, "global search should ignore whitespace in compound keywords");
  await page.locator("[data-global-search-input]").fill("期限超過");
  assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "理事タスク" }).count()) === 1, "global search should find board tasks by overdue keyword");
  await page.locator("[data-global-search-input]").press("Escape");
  assert((await page.locator("[data-nav-group='daily']").count()) === 1, "daily nav group should exist");
  assert((await page.locator("[data-nav-group='board']").count()) === 1, "board nav group should exist");
  assert((await page.locator("[data-nav-group='operations']").count()) === 1, "operations nav group should exist");
  assert((await page.locator("[data-nav-group='admin']").count()) === 1, "admin nav group should exist");
  await page.locator("[data-global-search-input]").fill("文書");
  await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "管理文書" }).click();
  await waitPage(page, "documents");
  assert(new URL(page.url()).pathname === "/documents/", "global search should navigate to documents");
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "home");
  await page.locator("[data-global-search-input]").fill("検");
  await page.locator("[data-global-search-input]").press("ArrowDown");
  assert(
    (await page.locator("[data-global-search-results] [data-global-search-link][aria-selected='true']").count()) === 1,
    "global search should mark one keyboard-selected result",
  );
  await page.locator("[data-global-search-input]").press("Enter");
  await waitPage(page, "inspections");
  assert(new URL(page.url()).pathname === "/inspections/", "global search keyboard selection should navigate to inspections");

  await page.goto(`${baseUrl}/rooms/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "rooms");
  await fillSubmit(page, "[data-booking-form]", {
    room_id: await firstOptionValue(page, "[data-room-select]"),
    purpose: "会議室テスト申請",
    start_at: "2026-05-20T11:00",
    end_at: "2026-05-20T12:00",
  });
  await waitForCondition(() => backend.state.room_bookings.length === 2, "room booking insert");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "room_booking" && log.action === "created" && /会議室テスト申請/.test(log.detail ?? "")),
    "booking creation activity log",
  );
  await waitForCount(page.locator("[data-pending-bookings] .list-item"), 2, "rooms pending list");
  let rejectedDialog = false;
  page.once("dialog", async (dialog) => {
    rejectedDialog = /承認/.test(dialog.message());
    await dialog.dismiss();
  });
  await form(page, "[data-pending-bookings]").locator("[data-booking-approve]").first().click();
  await waitForCondition(() => rejectedDialog, "booking approval confirmation dialog");
  await waitForCount(page.locator("[data-pending-bookings] .list-item"), 2, "dismissed approval should keep pending count");
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
  await form(page, "[data-pending-bookings]").locator("[data-booking-approve]").first().click();
  await waitForCount(page.locator("[data-pending-bookings] .list-item"), 1, "rooms approved count");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "room_booking" && log.action === "approved"),
    "booking approval activity log",
  );

  await page.goto(`${baseUrl}/notices/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "notices");
  assert((await page.locator("#target-role option[value='chair']").count()) === 1, "notice target role should include chair");
  assert((await page.locator("#target-role option[value='president']").count()) === 1, "notice target role should include president");
  await fillSubmit(page, "[data-notice-form]", {
    title: "通知テスト",
    body: "テスト通知本文",
    kind: "topic",
    target_role: "all",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "notice" && log.action === "created" && /通知テスト/.test(log.detail ?? "")),
    "notice creation activity log",
  );
  await form(page, "[data-notice-list]").locator("[data-notice-read]").first().click();
  await waitForCondition(() => backend.state.notice_reads.length === 1, "notice read record");

  await page.goto(`${baseUrl}/events/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "events");
  await fillSubmit(page, "[data-event-form]", {
    title: "行事テスト",
    description: "説明",
    location: "広場",
    start_at: "2026-05-18T10:00",
    end_at: "2026-05-18T11:00",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "event" && log.action === "created" && /行事テスト/.test(log.detail ?? "")),
    "event creation activity log",
  );
  const eventMonthBefore = await page.locator("[data-event-month]").textContent();
  await page.locator("[data-action='next-event-month']").click();
  const eventMonthAfter = await page.locator("[data-event-month]").textContent();
  assert(eventMonthBefore !== eventMonthAfter, "events month should change");
  await page.locator("[data-action='prev-event-month']").click();

  await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "documents");
  assert((await page.locator("#document-url").count()) === 0, "document form should not include URL input");
  await fillSubmit(page, "[data-document-form]", {
    title: "議事録テスト",
    kind: "minutes",
    version: "2.0",
    markdown_body: "# 議事録テスト\n\n議事録の要約\n\n- Markdown本文",
  });
  await waitForCondition(
    () => backend.state.management_documents.some((document) => document.title === "議事録テスト" && document.file_url == null && document.summary.includes("議事録の要約")),
    "document markdown insert",
  );
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "management_document" && log.action === "created" && /議事録テスト/.test(log.detail ?? "")),
    "document creation activity log",
  );
  const createdDocument = page.locator("[data-document-list] .list-item").filter({ hasText: "議事録テスト" });
  await waitForCount(createdDocument, 1, "created document row");
  await page.locator("[data-document-search]").fill("Markdown本文");
  await waitForCondition(
    async () => (await page.locator("[data-document-list] .list-item").filter({ hasText: "議事録テスト" }).count()) === 1,
    "document local search match",
  );
  await page.locator("[data-document-search]").fill("該当なし");
  await expectText(page, "[data-document-list]", "検索条件に一致する文書はありません。", "document local search empty");
  await page.locator("[data-document-search]").fill("");
  await clickAndConfirm(page, () => createdDocument.locator("[data-document-approve]").click(), "承認");
  await waitForCondition(
    () => backend.state.management_documents.some((document) => document.title === "議事録テスト" && document.status === "chair_review"),
    "document board approval",
  );
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "management_document" && log.action === "approved"),
    "document approval activity log",
  );
  await clickAndConfirm(page, () => createdDocument.locator("[data-document-approve]").click(), "承認");
  await waitForCondition(
    () => backend.state.management_documents.some((document) => document.title === "議事録テスト" && document.status === "president_review"),
    "document chair approval",
  );
  await clickAndConfirm(page, () => createdDocument.locator("[data-document-approve]").click(), "承認");
  await waitForCondition(
    () => backend.state.management_documents.some((document) => document.title === "議事録テスト" && document.status === "approved"),
    "document president approval",
  );
  const createdDocumentId = backend.state.management_documents.find((document) => document.title === "議事録テスト").id;
  assert(backend.state.document_approvals.filter((approval) => approval.document_id === createdDocumentId && approval.action === "approved").length === 3, "document should have three approval records");
  assert(backend.state.document_seals.filter((seal) => seal.document_id === createdDocumentId).length === 3, "document should have three seal records");
  await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "documents");
  const approvedDocument = page.locator("[data-document-list] .list-item").filter({ hasText: "議事録テスト" });
  await clickAndConfirm(page, () => approvedDocument.locator("[data-document-archive]").click(), "保管");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "management_document" && log.action === "archived"),
    "document archive activity log",
  );

  await page.goto(`${baseUrl}/maintenance/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "maintenance");
  await fillSubmit(page, "[data-maintenance-form]", {
    title: "修繕テスト",
    category: "equipment",
    priority: "urgent",
    location: "階段",
    description: "修繕内容",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "maintenance_request" && log.action === "created" && /修繕テスト/.test(log.detail ?? "")),
    "maintenance creation activity log",
  );
  await page.locator("[data-maintenance-search]").fill("階段");
  await waitForCondition(
    async () => (await page.locator("[data-maintenance-list] .list-item").filter({ hasText: "修繕テスト" }).count()) === 1,
    "maintenance local search match",
  );
  await page.locator("[data-maintenance-search]").fill("該当なし");
  await expectText(page, "[data-maintenance-list]", "検索条件に一致する修繕依頼はありません。", "maintenance local search empty");
  await page.locator("[data-maintenance-search]").fill("");
  await page.locator("[data-maintenance-progress]").first().click();
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "maintenance_request" && log.action === "in_progress"),
    "maintenance progress activity log",
  );
  await clickAndConfirm(page, () => page.locator("[data-maintenance-resolve]").first().click(), "完了");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "maintenance_request" && log.action === "resolved"),
    "maintenance resolved activity log",
  );

  await page.goto(`${baseUrl}/finance/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "finance");
  await fillSubmit(page, "[data-finance-form]", {
    title: "積立テスト",
    entry_type: "expense",
    category: "修繕",
    amount: "1200",
    entry_date: "2026-05-17",
    note: "支出テスト",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "finance_entry" && log.action === "created" && /積立テスト/.test(log.detail ?? "")),
    "finance entry creation activity log",
  );
  await page.locator("[data-finance-search]").fill("支出テスト");
  await waitForCondition(
    async () => (await page.locator("[data-finance-list] .list-item").filter({ hasText: "積立テスト" }).count()) === 1,
    "finance local search match",
  );
  await page.locator("[data-finance-search]").fill("該当なし");
  await expectText(page, "[data-finance-list]", "検索条件に一致する台帳記録はありません。", "finance local search empty");
  await page.locator("[data-finance-search]").fill("");
  await page.locator("[data-finance-filter='expense']").click();
  await expectText(page, "[data-metric='finance-expense']", "￥26,200", "finance expense metric");

  await page.goto(`${baseUrl}/assets/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "assets");
  await fillSubmit(page, "[data-asset-form]", {
    name: "テスト備品",
    category: "equipment",
    status: "active",
    location: "倉庫",
    inspection_due_at: "2026-06-01",
    note: "備品登録",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "asset_item" && log.action === "created" && /テスト備品/.test(log.detail ?? "")),
    "asset creation activity log",
  );
  await page.locator("[data-asset-search]").fill("倉庫");
  await waitForCondition(
    async () => (await page.locator("[data-asset-list] .list-item").filter({ hasText: "テスト備品" }).count()) === 1,
    "asset local search match",
  );
  await page.locator("[data-asset-search]").fill("該当なし");
  await expectText(page, "[data-asset-list]", "検索条件に一致する資産はありません。", "asset local search empty");
  await page.locator("[data-asset-search]").fill("");
  await page.locator("[data-asset-repair]").first().click();
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "asset_item" && log.action === "repair_needed"),
    "asset repair-needed activity log",
  );
  await waitForCondition(async () => (await page.locator("[data-asset-active]").count()) > 0, "asset active action after repair update");
  await page.locator("[data-asset-active]").first().click();
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "asset_item" && log.action === "active"),
    "asset active activity log",
  );

  await page.goto(`${baseUrl}/vendors/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "vendors");
  await fillSubmit(page, "[data-vendor-form]", {
    name: "テスト業者",
    category: "清掃",
    contact_name: "担当B",
    phone: "03-4444-5555",
    email: "b@example.com",
    note: "業者テスト",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "vendor" && log.action === "created" && /テスト業者/.test(log.detail ?? "")),
    "vendor creation activity log",
  );
  await fillSubmit(page, "[data-contract-form]", {
    vendor_id: await firstOptionValue(page, "[data-contract-vendor-select]"),
    title: "清掃契約",
    start_date: "2026-05-01",
    end_date: "2026-12-31",
    amount: "100000",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "vendor_contract" && log.action === "created" && /清掃契約/.test(log.detail ?? "")),
    "vendor contract creation activity log",
  );
  await page.locator("[data-vendor-search]").fill("担当B");
  await waitForCondition(
    async () => (await page.locator("[data-vendor-list] .list-item").filter({ hasText: "テスト業者" }).count()) === 1,
    "vendor local search match",
  );
  await page.locator("[data-contract-search]").fill("清掃契約");
  await waitForCondition(
    async () => (await page.locator("[data-contract-list] .list-item").filter({ hasText: "清掃契約" }).count()) === 1,
    "contract local search match",
  );
  await page.locator("[data-contract-search]").fill("該当なし");
  await expectText(page, "[data-contract-list]", "検索条件に一致する契約はありません。", "contract local search empty");
  await page.locator("[data-vendor-search]").fill("");
  await page.locator("[data-contract-search]").fill("");

  await page.goto(`${baseUrl}/residents/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "residents");
  await fillSubmit(page, "[data-resident-profile-form]", {
    display_name: "管理者テスト更新",
    phone: "090-9999-9999",
    building: "A",
    unit_number: "102",
    emergency_contact_name: "更新先",
    emergency_contact_phone: "090-8888-8888",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "profile" && log.action === "updated" && /住民名簿/.test(log.detail ?? "")),
    "resident profile update activity log",
  );

  await page.goto(`${baseUrl}/surveys/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "surveys");
  await fillSubmit(page, "[data-survey-form]", {
    title: "アンケートテスト",
    question: "どちらが良いですか？",
    options: "A,B,C",
    closes_at: "",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "survey" && log.action === "created" && /アンケートテスト/.test(log.detail ?? "")),
    "survey creation activity log",
  );
  const createdSurvey = page.locator("[data-survey-list] .list-item").filter({ hasText: "アンケートテスト" });
  await waitForCount(createdSurvey, 1, "created survey row");
  await createdSurvey.locator("[data-survey-option='A']").click();
  await waitForCondition(() => backend.state.survey_responses.length === 1, "survey response");
  await clickAndConfirm(page, () => createdSurvey.locator("[data-survey-close]").click(), "締切");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "survey" && log.action === "closed"),
    "survey close activity log",
  );

  await page.goto(`${baseUrl}/safety/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "safety");
  await fillSubmit(page, "[data-safety-form]", {
    title: "安否確認テスト",
    kind: "checkin",
    status: "active",
    scheduled_at: "2026-05-17T09:00",
    location: "全戸",
    note: "安否テスト",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "safety_event" && log.action === "created" && /安否確認テスト/.test(log.detail ?? "")),
    "safety creation activity log",
  );
  const createdSafety = page.locator("[data-safety-list] .list-item").filter({ hasText: "安否確認テスト" });
  await waitForCount(createdSafety, 1, "created safety row");
  await createdSafety.locator("[data-safety-safe]").click();
  await waitForCondition(() => backend.state.safety_checkins.length === 1, "safety check-in");
  await clickAndConfirm(page, () => createdSafety.locator("[data-safety-complete]").click(), "完了");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "safety_event" && log.action === "completed"),
    "safety completion activity log",
  );

  await page.goto(`${baseUrl}/tasks/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "tasks");
  await fillSubmit(page, "[data-task-form]", {
    title: "タスクテスト",
    description: "タスク説明",
    priority: "high",
    due_date: "2026-05-20",
    assignee_id: "board-user",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "board_task" && log.action === "created" && /タスクテスト/.test(log.detail ?? "")),
    "task creation activity log",
  );
  await page.locator("[data-task-progress]").first().click();
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "board_task" && log.action === "in_progress"),
    "task progress activity log",
  );
  await clickAndConfirm(page, () => page.locator("[data-task-done]").first().click(), "完了");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "board_task" && log.action === "done"),
    "task done activity log",
  );

  await page.goto(`${baseUrl}/parking/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "parking");
  await fillSubmit(page, "[data-parking-space-form]", {
    code: "P-TEST",
    kind: "car",
    assignment_method: "first_come",
    location: "南側",
    monthly_fee: "15000",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "parking_space" && log.action === "created" && /P-TEST/.test(log.detail ?? "")),
    "parking space creation activity log",
  );
  await fillSubmit(page, "[data-parking-permit-form]", {
    space_id: await firstOptionValue(page, "[data-parking-space-select]"),
    vehicle_label: "青い車",
    priority: "primary",
    start_date: "2026-05-17",
    end_date: "2026-12-31",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "parking_permit" && log.action === "created" && /青い車/.test(log.detail ?? "")),
    "parking permit creation activity log",
  );
  await page.locator("[data-parking-space-search]").fill("南側");
  await waitForCondition(
    async () => (await page.locator("[data-parking-space-list] .list-item").filter({ hasText: "P-TEST" }).count()) === 1,
    "parking space local search match",
  );
  await page.locator("[data-parking-permit-search]").fill("青い車");
  await waitForCondition(
    async () => (await page.locator("[data-parking-permit-list] .list-item").filter({ hasText: "青い車" }).count()) === 1,
    "parking permit local search match",
  );
  await page.locator("[data-parking-permit-search]").fill("該当なし");
  await expectText(page, "[data-parking-permit-list]", "検索条件に一致する利用申請はありません。", "parking permit local search empty");
  await page.locator("[data-parking-space-search]").fill("");
  await page.locator("[data-parking-permit-search]").fill("");
  await clickAndConfirm(page, () => page.locator("[data-parking-approve]").first().click(), "承認");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "parking_permit" && log.action === "active"),
    "parking approval activity log",
  );
  await fillSubmit(page, "[data-parking-procedure-form]", {
    permit_id: await firstOptionValue(page, "[data-parking-procedure-permit-select]"),
    kind: "vehicle_change",
    requested_vehicle_label: "青い車 新番号",
    requested_return_date: "",
    note: "車両入替",
  });
  await waitForCondition(
    () => backend.state.parking_procedure_requests.some((request) => request.kind === "vehicle_change" && request.requested_vehicle_label === "青い車 新番号"),
    "parking vehicle change request",
  );
  await clickAndConfirm(page, () => page.locator("[data-parking-procedure-approve]").first().click(), "承認");
  await waitForCondition(
    () => backend.state.parking_permits.some((permit) => permit.vehicle_label === "青い車 新番号"),
    "parking vehicle change approval",
  );
  await fillSubmit(page, "[data-parking-procedure-form]", {
    permit_id: await firstOptionValue(page, "[data-parking-procedure-permit-select]"),
    kind: "certificate",
    requested_vehicle_label: "",
    requested_return_date: "",
    note: "車庫証明",
  });
  await waitForCondition(
    () => backend.state.parking_procedure_requests.some((request) => request.kind === "certificate" && request.note === "車庫証明"),
    "parking certificate request",
  );
  await clickAndConfirm(page, () => page.locator("[data-parking-procedure-approve]").first().click(), "承認");
  await waitForCondition(
    () => backend.state.parking_procedure_requests.some((request) => request.kind === "certificate" && request.status === "approved"),
    "parking certificate approval",
  );
  await fillSubmit(page, "[data-parking-space-form]", {
    code: "P-LOT",
    kind: "car",
    assignment_method: "lottery",
    location: "東側",
    monthly_fee: "16000",
  });
  await waitForCondition(
    () => backend.state.parking_spaces.some((space) => space.code === "P-LOT" && space.assignment_method === "lottery"),
    "parking lottery space creation",
  );
  const lotterySpaceId = backend.state.parking_spaces.find((space) => space.code === "P-LOT").id;
  await fillSubmit(page, "[data-parking-permit-form]", {
    space_id: lotterySpaceId,
    vehicle_label: "抽選車",
    priority: "secondary",
    start_date: "2026-06-01",
    end_date: "",
  });
  await clickAndConfirm(page, () => page.locator("[data-parking-lottery]").first().click(), "抽選");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "parking_permit" && log.action === "lottery"),
    "parking lottery activity log",
  );
  const returnDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const changedPermitId = backend.state.parking_permits.find((permit) => permit.vehicle_label === "青い車 新番号").id;
  await fillSubmit(page, "[data-parking-procedure-form]", {
    permit_id: changedPermitId,
    kind: "return_notice",
    requested_vehicle_label: "",
    requested_return_date: returnDate,
    note: "返還届",
  });
  await waitForCondition(
    () => backend.state.parking_procedure_requests.some((request) => request.kind === "return_notice" && request.note === "返還届"),
    "parking return notice request",
  );
  await clickAndConfirm(page, () => page.locator("[data-parking-procedure-approve]").first().click(), "承認");
  await waitForCondition(
    () => backend.state.parking_permits.some((permit) => permit.vehicle_label === "青い車 新番号" && permit.status === "ended"),
    "parking return notice approval",
  );

  await page.goto(`${baseUrl}/requests/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "requests");
  await fillSubmit(page, "[data-resident-request-form]", {
    title: "相談テスト",
    category: "rule",
    visibility: "board",
    body: "相談本文",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "resident_request" && log.action === "created" && /相談テスト/.test(log.detail ?? "")),
    "resident request creation activity log",
  );
  await page.locator("[data-request-search]").fill("相談本文");
  await waitForCondition(
    async () => (await page.locator("[data-resident-request-list] .list-item").filter({ hasText: "相談テスト" }).count()) === 1,
    "resident request local search match",
  );
  await page.locator("[data-request-search]").fill("該当なし");
  await expectText(page, "[data-resident-request-list]", "検索条件に一致する相談・苦情はありません。", "resident request local search empty");
  await page.locator("[data-request-search]").fill("");
  await page.locator("[data-request-progress]").first().click();
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "resident_request" && log.action === "in_progress"),
    "resident request progress activity log",
  );
  await clickAndConfirm(page, () => page.locator("[data-request-resolve]").first().click(), "完了");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "resident_request" && log.action === "resolved"),
    "resident request resolved activity log",
  );

  await page.goto(`${baseUrl}/circulars/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "circulars");
  assert((await page.locator("#circular-target option[value='chair']").count()) === 1, "circular target role should include chair");
  assert((await page.locator("#circular-target option[value='president']").count()) === 1, "circular target role should include president");
  await fillSubmit(page, "[data-circular-form]", {
    title: "回覧テスト",
    kind: "event",
    target_role: "all",
    due_date: "2026-05-30",
    body: "回覧本文",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "circular" && log.action === "created" && /回覧テスト/.test(log.detail ?? "")),
    "circular creation activity log",
  );
  await page.locator("[data-circular-search]").fill("回覧本文");
  await waitForCondition(
    async () => (await page.locator("[data-circular-list] .list-item").filter({ hasText: "回覧テスト" }).count()) === 1,
    "circular local search match",
  );
  await page.locator("[data-circular-search]").fill("");
  await page.locator("[data-circular-ack]").first().click();
  await page.locator("[data-circular-ack-search]").fill("回覧テスト");
  await waitForCondition(
    async () => (await page.locator("[data-circular-ack-list] .list-item").filter({ hasText: "回覧テスト" }).count()) === 1,
    "circular ack local search match",
  );
  await page.locator("[data-circular-ack-search]").fill("該当なし");
  await expectText(page, "[data-circular-ack-list]", "検索条件に一致する確認履歴はありません。", "circular ack local search empty");
  await page.locator("[data-circular-ack-search]").fill("");
  await clickAndConfirm(page, () => page.locator("[data-circular-archive]").first().click(), "保管");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "circular" && log.action === "archived"),
    "circular archive activity log",
  );

  await page.goto(`${baseUrl}/lending/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "lending");
  await fillSubmit(page, "[data-lending-item-form]", {
    name: "貸出テスト品",
    kind: "equipment",
    location: "管理室",
    note: "貸出ノート",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "lending_item" && log.action === "created" && /貸出テスト品/.test(log.detail ?? "")),
    "lending item creation activity log",
  );
  await page.locator("[data-lending-item-search]").fill("貸出ノート");
  await waitForCondition(
    async () => (await page.locator("[data-lending-item-list] .list-item").filter({ hasText: "貸出テスト品" }).count()) === 1,
    "lending item local search match",
  );
  await fillSubmit(page, "[data-lending-request-form]", {
    item_id: await firstOptionValue(page, "[data-lending-item-select]"),
    purpose: "貸出申請テスト",
    due_at: "2026-05-30T17:00",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "lending_request" && log.action === "created" && /貸出申請テスト/.test(log.detail ?? "")),
    "lending request creation activity log",
  );
  await page.locator("[data-lending-request-search]").fill("貸出申請テスト");
  await waitForCondition(
    async () => (await page.locator("[data-lending-request-list] .list-item").filter({ hasText: "貸出申請テスト" }).count()) === 1,
    "lending request local search match",
  );
  await page.locator("[data-lending-item-search]").fill("");
  await page.locator("[data-lending-request-search]").fill("");
  await clickAndConfirm(page, () => page.locator("[data-lending-approve]").first().click(), "貸出承認");
  await clickAndConfirm(page, () => page.locator("[data-lending-return]").first().click(), "返却済み");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "lending_request" && log.action === "returned"),
    "lending return activity log",
  );

  await page.goto(`${baseUrl}/duties/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "duties");
  await fillSubmit(page, "[data-duty-form]", {
    title: "当番テスト",
    kind: "cleaning",
    scheduled_date: "2026-05-20",
    location: "共用部",
    note: "当番本文",
    assignee_id: "resident-user",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "duty_assignment" && log.action === "created" && /当番テスト/.test(log.detail ?? "")),
    "duty creation activity log",
  );
  await page.locator("[data-duty-search]").fill("当番本文");
  await waitForCondition(
    async () => (await page.locator("[data-duty-list] .list-item").filter({ hasText: "当番テスト" }).count()) === 1,
    "duty local search match",
  );
  await fillSubmit(page, "[data-duty-form]", {
    title: "自分当番テスト",
    kind: "patrol",
    scheduled_date: "2026-05-21",
    location: "屋上",
    note: "自分の当番本文",
    assignee_id: "",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "duty_assignment" && log.action === "created" && /自分当番テスト/.test(log.detail ?? "")),
    "own duty creation activity log",
  );
  await page.locator("[data-duty-own-search]").fill("自分の当番本文");
  await waitForCondition(
    async () => (await page.locator("[data-duty-own-list] .list-item").filter({ hasText: "自分当番テスト" }).count()) === 1,
    "own duty local search match",
  );
  await page.locator("[data-duty-search]").fill("");
  await page.locator("[data-duty-own-search]").fill("");
  await clickAndConfirm(page, () => page.locator("[data-duty-done]").first().click(), "完了");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "duty_assignment" && log.action === "done"),
    "duty done activity log",
  );

  await page.goto(`${baseUrl}/waste/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "waste");
  await fillSubmit(page, "[data-waste-schedule-form]", {
    title: "分別テスト",
    category: "recycle",
    collection_day: "水",
    location: "集積所B",
    note: "収集ルール",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "waste_schedule" && log.action === "created" && /分別テスト/.test(log.detail ?? "")),
    "waste schedule creation activity log",
  );
  await page.locator("[data-waste-schedule-search]").fill("集積所B");
  await waitForCondition(
    async () => (await page.locator("[data-waste-schedule-list] .list-item").filter({ hasText: "分別テスト" }).count()) === 1,
    "waste schedule local search match",
  );
  await fillSubmit(page, "[data-bulky-request-form]", {
    item_name: "古い机",
    preferred_date: "2026-05-28",
    pickup_location: "1階",
    note: "粗大ごみ本文",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "bulky_waste_request" && log.action === "created" && /古い机/.test(log.detail ?? "")),
    "bulky waste creation activity log",
  );
  await page.locator("[data-bulky-request-search]").fill("粗大ごみ本文");
  await waitForCondition(
    async () => (await page.locator("[data-bulky-request-list] .list-item").filter({ hasText: "古い机" }).count()) === 1,
    "bulky waste local search match",
  );
  await page.locator("[data-waste-schedule-search]").fill("");
  await page.locator("[data-bulky-request-search]").fill("");
  await clickAndConfirm(page, () => page.locator("[data-bulky-schedule]").first().click(), "予約済み");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "bulky_waste_request" && log.action === "scheduled"),
    "bulky waste scheduled activity log",
  );
  await clickAndConfirm(page, () => page.locator("[data-bulky-complete]").first().click(), "完了");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "bulky_waste_request" && log.action === "completed"),
    "bulky waste completed activity log",
  );

  await page.goto(`${baseUrl}/admin/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "admin");
  await waitForCondition(async () => (await page.locator("[data-activity-log-list] .list-item").count()) >= 1, "admin activity log entries");
  assert((await page.locator("[data-activity-log-list]").filter({ hasText: "操作履歴" }).count()) === 1, "admin activity log should render operation labels");
  await page.locator("[data-activity-log-search]").fill("通知テスト");
  await waitForCondition(
    async () => (await page.locator("[data-activity-log-list] .list-item").filter({ hasText: "通知テスト" }).count()) === 1,
    "admin activity log keyword filter",
  );
  assert((await page.locator("[data-activity-log-summary]").textContent()).includes("/"), "admin activity log summary should show filtered count");
  await page.locator("[data-activity-log-search]").fill("");
  await page.locator("[data-activity-log-action]").selectOption("approval");
  await waitForCondition(
    async () => (await page.locator("[data-activity-log-list] .list-item").filter({ hasText: "承認" }).count()) >= 1,
    "admin activity log action filter",
  );
  assert((await page.locator("[data-activity-log-list] .list-item").filter({ hasText: "room_booking" }).count()) === 0, "admin activity log should hide raw entity keys");

  await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "meetings");
  await fillSubmit(page, "[data-meeting-form]", {
    title: "臨時総会",
    kind: "general",
    scheduled_at: "2026-05-24T18:00",
    location: "集会室A",
    note: "会議本文",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "meeting_session" && log.action === "created" && /臨時総会/.test(log.detail ?? "")),
    "meeting creation activity log",
  );
  await fillSubmit(page, "[data-agenda-form]", {
    meeting_id: await firstOptionValue(page, "[data-agenda-meeting-select]"),
    title: "議案テスト",
    sort_order: "1",
    description: "議案説明",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "meeting_agenda_item" && log.action === "created" && /議案テスト/.test(log.detail ?? "")),
    "meeting agenda creation activity log",
  );
  await page.locator("[data-meeting-search]").fill("集会室A");
  await waitForCondition(
    async () => (await page.locator("[data-meeting-list] .list-item").filter({ hasText: "臨時総会" }).count()) === 1,
    "meeting local search match",
  );
  await page.locator("[data-agenda-search]").fill("議案説明");
  await waitForCondition(
    async () => (await page.locator("[data-agenda-list] .list-item").filter({ hasText: "議案テスト" }).count()) === 1,
    "agenda local search match",
  );
  await page.locator("[data-agenda-search]").fill("該当なし");
  await expectText(page, "[data-agenda-list]", "検索条件に一致する議案はありません。", "agenda local search empty");
  await page.locator("[data-meeting-search]").fill("");
  await page.locator("[data-agenda-search]").fill("");
  await fillSubmit(page, "[data-attendance-form]", {
    meeting_id: await firstOptionValue(page, "[data-attendance-meeting-select]"),
    status: "proxy",
    proxy_to: "代理人",
    note: "出席記録",
  });
  await fillSubmit(page, "[data-vote-form]", {
    agenda_item_id: await firstOptionValue(page, "[data-vote-agenda-select]"),
    choice: "approve",
    comment: "賛成します",
  });
  await clickAndConfirm(page, () => page.locator("[data-meeting-close]").first().click(), "終了");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "meeting_session" && log.action === "closed"),
    "meeting close activity log",
  );

  await page.goto(`${baseUrl}/inspections/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "inspections");
  await fillSubmit(page, "[data-inspection-plan-form]", {
    asset_id: await firstOptionValue(page, "[data-inspection-asset-select]"),
    title: "点検計画テスト",
    frequency: "annual",
    next_due_date: "2026-05-31",
    note: "点検計画本文",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "inspection_plan" && log.action === "created" && /点検計画テスト/.test(log.detail ?? "")),
    "inspection plan creation activity log",
  );
  await page.locator("[data-inspection-plan-search]").fill("点検計画本文");
  await waitForCondition(
    async () => (await page.locator("[data-inspection-plan-list] .list-item").filter({ hasText: "点検計画テスト" }).count()) === 1,
    "inspection plan local search match",
  );
  await page.locator("[data-inspection-plan-search]").fill("該当なし");
  await expectText(page, "[data-inspection-plan-list]", "検索条件に一致する点検計画はありません。", "inspection plan local search empty");
  await page.locator("[data-inspection-plan-search]").fill("");
  await fillSubmit(page, "[data-inspection-record-form]", {
    plan_id: await firstOptionValue(page, "[data-inspection-plan-select]"),
    result: "repair_needed",
    inspected_at: "2026-05-17",
    note: "修理依頼に連携",
  });
  await expectText(page, "[data-metric='inspection-repair']", "1", "inspection repair metric");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "inspection_record" && log.action === "repair_needed"),
    "inspection repair-needed activity log",
  );
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "maintenance_request" && log.action === "created_from_inspection"),
    "inspection linked maintenance activity log",
  );
  await page.locator("[data-inspection-record-search]").fill("修理依頼");
  await waitForCondition(
    async () => (await page.locator("[data-inspection-record-list] .list-item").filter({ hasText: "修理依頼に連携" }).count()) === 1,
    "inspection record local search match",
  );
  await page.locator("[data-inspection-record-search]").fill("該当なし");
  await expectText(page, "[data-inspection-record-list]", "検索条件に一致する点検記録はありません。", "inspection record local search empty");
  await page.locator("[data-inspection-record-search]").fill("");

  await page.goto(`${baseUrl}/admin/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "admin");
  await fillSubmit(page, "[data-room-form]", {
    name: "テスト会議室",
    capacity: "12",
    notes: "追加部屋",
  });
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "room" && log.action === "created" && /テスト会議室/.test(log.detail ?? "")),
    "room creation activity log",
  );
  await page.locator("[data-room-edit='room-1']").click();
  await expectText(page, "[data-room-form-title]", "会議室を編集", "room edit form title");
  assert((await page.locator("#room-name").inputValue()) === "集会室A", "room edit should populate name");
  await page.locator("#room-name").fill("集会室A 改");
  await page.locator("#room-capacity").fill("32");
  await page.locator("#room-notes").fill("編集済み");
  await page.locator("[data-room-form] button[type='submit']").click();
  await waitForCondition(() => backend.state.rooms.find((room) => room.id === "room-1")?.name === "集会室A 改", "room update");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "room" && log.action === "updated" && /集会室A 改/.test(log.detail ?? "")),
    "room update activity log",
  );
  await expectText(page, "[data-room-status]", "会議室を更新しました。", "room update status");
  page.once("dialog", async (dialog) => {
    assert(dialog.message().includes("削除"), "room delete should ask for confirmation");
    await dialog.accept();
  });
  await page.locator("[data-room-delete='room-1']").click();
  await waitForCondition(() => backend.state.rooms.find((room) => room.id === "room-1")?.is_active === false, "room soft delete");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "room" && log.action === "deleted" && /集会室A 改/.test(log.detail ?? "")),
    "room delete activity log",
  );
  assert((await page.locator("[data-room-list]").filter({ hasText: "集会室A 改" }).count()) === 0, "deleted room should leave active room list");
  const residentRoleSelect = page.locator("[data-role-select='resident-user']");
  assert((await residentRoleSelect.locator("option[value='chair']").count()) === 1, "admin role select should include chair role");
  assert((await residentRoleSelect.locator("option[value='president']").count()) === 1, "admin role select should include president role");
  page.once("dialog", async (dialog) => {
    assert(dialog.message().includes("権限"), "role change should ask for confirmation");
    await dialog.dismiss();
  });
  await residentRoleSelect.selectOption("board_member");
  assert((await residentRoleSelect.inputValue()) === "resident", "dismissed role change should keep previous role");
  page.once("dialog", async (dialog) => {
    assert(dialog.message().includes("権限"), "accepted role change should ask for confirmation");
    await dialog.accept();
  });
  await residentRoleSelect.selectOption("board_member");
  await waitForCondition(() => backend.state.profiles.find((profile) => profile.id === "resident-user")?.role === "board_member", "resident role update");
  await waitForCondition(
    () => backend.state.activity_logs.some((log) => log.entity_type === "profile" && log.action === "role_changed" && /住民テスト/.test(log.detail ?? "")),
    "role change activity log",
  );

  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
});

process.exit(0);
