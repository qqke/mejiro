import { assert, expectText, login, maybeFirstVisibleRole, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

function form(page, selector) {
  return page.locator(selector);
}

async function firstOptionValue(page, selector) {
  return await page.locator(selector).evaluate((select) => {
    const option = select.querySelector("option[value]:not([value=''])");
    return option?.value ?? "";
  });
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
  await expectText(page, "[data-metric='month-events']", "1", "home month events");

  await page.goto(`${baseUrl}/rooms/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "rooms");
  await fillSubmit(page, "[data-booking-form]", {
    room_id: await firstOptionValue(page, "[data-room-select]"),
    purpose: "会議室テスト申請",
    start_at: "2026-05-20T11:00",
    end_at: "2026-05-20T12:00",
  });
  await waitForCondition(() => backend.state.room_bookings.length === 2, "room booking insert");
  await waitForCount(page.locator("[data-pending-bookings] .list-item"), 2, "rooms pending list");
  await form(page, "[data-pending-bookings]").locator("[data-booking-approve]").first().click();
  await waitForCount(page.locator("[data-pending-bookings] .list-item"), 1, "rooms approved count");

  await page.goto(`${baseUrl}/notices/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "notices");
  await fillSubmit(page, "[data-notice-form]", {
    title: "通知テスト",
    body: "テスト通知本文",
    kind: "topic",
    target_role: "all",
  });
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
  const eventMonthBefore = await page.locator("[data-event-month]").textContent();
  await page.locator("[data-action='next-event-month']").click();
  const eventMonthAfter = await page.locator("[data-event-month]").textContent();
  assert(eventMonthBefore !== eventMonthAfter, "events month should change");
  await page.locator("[data-action='prev-event-month']").click();

  await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "documents");
  await fillSubmit(page, "[data-document-form]", {
    title: "議事録テスト",
    kind: "minutes",
    version: "2.0",
    summary: "議事録の要約",
    file_url: "",
  });
  const createdDocument = page.locator("[data-document-list] .list-item").filter({ hasText: "議事録テスト" });
  await waitForCount(createdDocument, 1, "created document row");
  await createdDocument.locator("[data-document-approve]").click();
  await waitForCondition(
    () => backend.state.management_documents.some((document) => document.title === "議事録テスト" && document.status === "approved"),
    "document approval",
  );
  await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "documents");
  const approvedDocument = page.locator("[data-document-list] .list-item").filter({ hasText: "議事録テスト" });
  await waitForCount(approvedDocument.locator("[data-document-seal]"), 1, "document seal action");
  await approvedDocument.locator("[data-document-seal]").click();
  await approvedDocument.locator("[data-document-archive]").click();

  await page.goto(`${baseUrl}/maintenance/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "maintenance");
  await fillSubmit(page, "[data-maintenance-form]", {
    title: "修繕テスト",
    category: "equipment",
    priority: "urgent",
    location: "階段",
    description: "修繕内容",
  });
  await page.locator("[data-maintenance-progress]").first().click();
  await page.locator("[data-maintenance-resolve]").first().click();

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
  await page.locator("[data-asset-repair]").first().click();
  await page.locator("[data-asset-active]").first().click();

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
  await fillSubmit(page, "[data-contract-form]", {
    vendor_id: await firstOptionValue(page, "[data-contract-vendor-select]"),
    title: "清掃契約",
    start_date: "2026-05-01",
    end_date: "2026-12-31",
    amount: "100000",
  });

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

  await page.goto(`${baseUrl}/surveys/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "surveys");
  await fillSubmit(page, "[data-survey-form]", {
    title: "アンケートテスト",
    question: "どちらが良いですか？",
    options: "A,B,C",
    closes_at: "",
  });
  const createdSurvey = page.locator("[data-survey-list] .list-item").filter({ hasText: "アンケートテスト" });
  await waitForCount(createdSurvey, 1, "created survey row");
  await createdSurvey.locator("[data-survey-option='A']").click();
  await waitForCondition(() => backend.state.survey_responses.length === 1, "survey response");
  await createdSurvey.locator("[data-survey-close]").click();

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
  const createdSafety = page.locator("[data-safety-list] .list-item").filter({ hasText: "安否確認テスト" });
  await waitForCount(createdSafety, 1, "created safety row");
  await createdSafety.locator("[data-safety-safe]").click();
  await waitForCondition(() => backend.state.safety_checkins.length === 1, "safety check-in");
  await createdSafety.locator("[data-safety-complete]").click();

  await page.goto(`${baseUrl}/tasks/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "tasks");
  await fillSubmit(page, "[data-task-form]", {
    title: "タスクテスト",
    description: "タスク説明",
    priority: "high",
    due_date: "2026-05-20",
    assignee_id: "board-user",
  });
  await page.locator("[data-task-progress]").first().click();
  await page.locator("[data-task-done]").first().click();

  await page.goto(`${baseUrl}/parking/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "parking");
  await fillSubmit(page, "[data-parking-space-form]", {
    code: "P-TEST",
    kind: "car",
    location: "南側",
    monthly_fee: "15000",
  });
  await fillSubmit(page, "[data-parking-permit-form]", {
    space_id: await firstOptionValue(page, "[data-parking-space-select]"),
    vehicle_label: "青い車",
    start_date: "2026-05-17",
    end_date: "2026-12-31",
  });
  await page.locator("[data-parking-approve]").first().click();
  await page.locator("[data-parking-end]").first().click();

  await page.goto(`${baseUrl}/requests/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "requests");
  await fillSubmit(page, "[data-resident-request-form]", {
    title: "相談テスト",
    category: "rule",
    visibility: "board",
    body: "相談本文",
  });
  await page.locator("[data-request-progress]").first().click();
  await page.locator("[data-request-resolve]").first().click();

  await page.goto(`${baseUrl}/circulars/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "circulars");
  await fillSubmit(page, "[data-circular-form]", {
    title: "回覧テスト",
    kind: "event",
    target_role: "all",
    due_date: "2026-05-30",
    body: "回覧本文",
  });
  await page.locator("[data-circular-ack]").first().click();
  await page.locator("[data-circular-archive]").first().click();

  await page.goto(`${baseUrl}/lending/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "lending");
  await fillSubmit(page, "[data-lending-item-form]", {
    name: "貸出テスト品",
    kind: "equipment",
    location: "管理室",
    note: "貸出ノート",
  });
  await fillSubmit(page, "[data-lending-request-form]", {
    item_id: await firstOptionValue(page, "[data-lending-item-select]"),
    purpose: "貸出申請テスト",
    due_at: "2026-05-30T17:00",
  });
  await page.locator("[data-lending-approve]").first().click();
  await page.locator("[data-lending-return]").first().click();

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
  await page.locator("[data-duty-done]").first().click();

  await page.goto(`${baseUrl}/waste/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "waste");
  await fillSubmit(page, "[data-waste-schedule-form]", {
    title: "分別テスト",
    category: "recycle",
    collection_day: "水",
    location: "集積所B",
    note: "収集ルール",
  });
  await fillSubmit(page, "[data-bulky-request-form]", {
    item_name: "古い机",
    preferred_date: "2026-05-28",
    pickup_location: "1階",
    note: "粗大ごみ本文",
  });
  await page.locator("[data-bulky-schedule]").first().click();
  await page.locator("[data-bulky-complete]").first().click();

  await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "meetings");
  await fillSubmit(page, "[data-meeting-form]", {
    title: "臨時総会",
    kind: "general",
    scheduled_at: "2026-05-24T18:00",
    location: "集会室A",
    note: "会議本文",
  });
  await fillSubmit(page, "[data-agenda-form]", {
    meeting_id: await firstOptionValue(page, "[data-agenda-meeting-select]"),
    title: "議案テスト",
    sort_order: "1",
    description: "議案説明",
  });
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
  await page.locator("[data-meeting-close]").first().click();

  await page.goto(`${baseUrl}/inspections/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "inspections");
  await fillSubmit(page, "[data-inspection-plan-form]", {
    asset_id: await firstOptionValue(page, "[data-inspection-asset-select]"),
    title: "点検計画テスト",
    frequency: "annual",
    next_due_date: "2026-05-31",
    note: "点検計画本文",
  });
  await fillSubmit(page, "[data-inspection-record-form]", {
    plan_id: await firstOptionValue(page, "[data-inspection-plan-select]"),
    result: "repair_needed",
    inspected_at: "2026-05-17",
    note: "修理依頼に連携",
  });
  await expectText(page, "[data-metric='inspection-repair']", "1", "inspection repair metric");

  await page.goto(`${baseUrl}/admin/`, { waitUntil: "domcontentloaded" });
  await waitPage(page, "admin");
  await fillSubmit(page, "[data-room-form]", {
    name: "テスト会議室",
    capacity: "12",
    notes: "追加部屋",
  });
  const firstRoleSelect = page.locator("[data-role-select]").first();
  await firstRoleSelect.selectOption("board_member");

  assert(pageErrors.length === 0, `page errors: ${pageErrors.join(" | ")}`);
});

process.exit(0);
