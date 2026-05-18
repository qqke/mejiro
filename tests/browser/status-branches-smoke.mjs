import { assert, expectText, login, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

function rowByText(page, selector, text) {
  return page.locator(selector).filter({ hasText: text });
}

async function firstOptionValue(page, selector) {
  return await page.locator(selector).evaluate((select) => {
    const option = select.querySelector("option[value]:not([value=''])");
    return option?.value ?? "";
  });
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

  await login(page, baseUrl, "admin@example.com", "password");

  await page.goto(`${baseUrl}/tasks/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='tasks']").waitFor({ state: "attached", timeout: 20000 });
  await page.locator("#task-title").fill("中止タスク");
  await page.locator("#task-description").fill("中止分岐の確認");
  await page.locator("#task-priority").selectOption("high");
  await page.locator("#task-due-date").fill("2026-05-25");
  await page.locator("#task-assignee").fill("board-user");
  await page.locator("[data-task-form] button[type='submit']").click();
  await waitForCondition(() => backend.state.board_tasks.some((task) => task.title === "中止タスク"), "task insert");
  const taskRow = rowByText(page, "[data-task-list] .list-item", "中止タスク");
  await assert((await taskRow.count()) === 1, "created task row should exist");
  await taskRow.locator("[data-task-cancel]").click();
  await waitForCondition(() => backend.state.board_tasks.some((task) => task.title === "中止タスク" && task.status === "cancelled"), "task cancelled");

  await page.goto(`${baseUrl}/parking/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='parking']").waitFor({ state: "attached", timeout: 20000 });
  await page.locator("#parking-space").selectOption(await firstOptionValue(page, "#parking-space"));
  await page.locator("#parking-vehicle").fill("分岐車両");
  await page.locator("#parking-start").fill("2026-05-17");
  await page.locator("#parking-end").fill("2026-12-31");
  await page.locator("[data-parking-permit-form] button[type='submit']").click();
  await waitForCondition(() => backend.state.parking_permits.some((permit) => permit.vehicle_label === "分岐車両"), "parking permit insert");
  const parkingRow = rowByText(page, "[data-parking-permit-list] .list-item", "分岐車両");
  await assert((await parkingRow.count()) === 1, "created parking permit row should exist");
  await parkingRow.locator("[data-parking-reject]").click();
  await waitForCondition(() => backend.state.parking_permits.some((permit) => permit.vehicle_label === "分岐車両" && permit.status === "rejected"), "parking permit rejected");

  await page.goto(`${baseUrl}/lending/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='lending']").waitFor({ state: "attached", timeout: 20000 });
  await page.locator("#lending-item").selectOption(await firstOptionValue(page, "#lending-item"));
  await page.locator("#lending-purpose").fill("拒否テスト");
  await page.locator("#lending-due").fill("2026-05-30T18:00");
  await page.locator("[data-lending-request-form] button[type='submit']").click();
  await waitForCondition(() => backend.state.lending_requests.some((request) => request.purpose === "拒否テスト"), "lending request insert");
  const lendingRow = rowByText(page, "[data-lending-request-list] .list-item", "拒否テスト");
  await assert((await lendingRow.count()) === 1, "created lending request row should exist");
  await lendingRow.locator("[data-lending-reject]").click();
  await waitForCondition(() => backend.state.lending_requests.some((request) => request.purpose === "拒否テスト" && request.status === "rejected"), "lending request rejected");

  await page.locator("#lending-item").selectOption(await firstOptionValue(page, "#lending-item"));
  await page.locator("#lending-purpose").fill("紛失テスト");
  await page.locator("#lending-due").fill("2026-05-30T18:00");
  await page.locator("[data-lending-request-form] button[type='submit']").click();
  await waitForCondition(() => backend.state.lending_requests.some((request) => request.purpose === "紛失テスト"), "lending checked out insert");
  const checkedOutRow = rowByText(page, "[data-lending-request-list] .list-item", "紛失テスト");
  await assert((await checkedOutRow.count()) === 1, "checked out lending request row should exist");
  await checkedOutRow.locator("[data-lending-approve]").click();
  await waitForCondition(() => backend.state.lending_requests.some((request) => request.purpose === "紛失テスト" && request.status === "checked_out"), "lending request checked out");
  await checkedOutRow.locator("[data-lending-lost]").click();
  await waitForCondition(() => backend.state.lending_requests.some((request) => request.purpose === "紛失テスト" && request.status === "lost"), "lending request lost");

  await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='meetings']").waitFor({ state: "attached", timeout: 20000 });
  await page.locator("#meeting-title").fill("中止会議");
  await page.locator("#meeting-kind").selectOption("board");
  await page.locator("#meeting-scheduled").fill("2026-05-24T18:00");
  await page.locator("#meeting-location").fill("集会室B");
  await page.locator("#meeting-note").fill("中止分岐確認");
  await page.locator("[data-meeting-form] button[type='submit']").click();
  await waitForCondition(() => backend.state.meeting_sessions.some((meeting) => meeting.title === "中止会議"), "meeting insert");
  const meetingRow = rowByText(page, "[data-meeting-list] .list-item", "中止会議");
  await assert((await meetingRow.count()) === 1, "created meeting row should exist");
  await meetingRow.locator("[data-meeting-cancel]").click();
  await waitForCondition(() => backend.state.meeting_sessions.some((meeting) => meeting.title === "中止会議" && meeting.status === "cancelled"), "meeting cancelled");

  await expectText(page, "[data-metric='meeting-open']", "1", "meeting open metric should keep the seeded open meeting");
});

process.exit(0);
