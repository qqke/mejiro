import { assert, expectText, login, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

await withPreviewPage(async ({ page, baseUrl }) => {
  const backend = createMockSupabaseBackend();
  backend.state.room_bookings[0].status = "approved";
  backend.state.room_bookings[0].approved_by = "admin-user";
  backend.state.room_bookings[0].approved_at = "2026-05-10T00:00:00Z";
  backend.state.room_bookings.push({
    id: "booking-overlap-seed",
    room_id: "room-1",
    user_id: "board-user",
    purpose: "重複判定用",
    start_at: "2026-01-01T00:00:00.000Z",
    end_at: "2026-12-31T23:59:59.000Z",
    status: "approved",
    approved_by: "admin-user",
    approved_at: "2026-05-10T00:00:00Z",
    created_at: "2026-05-10T00:00:00Z",
  });
  await backend.install(page);

  await login(page, baseUrl, "admin@example.com", "password");
  await page.goto(`${baseUrl}/rooms/`, { waitUntil: "domcontentloaded" });
  await page.locator("body[data-page='rooms']").waitFor({ state: "attached", timeout: 20000 });

  const initialCount = backend.state.room_bookings.length;

  await page.locator("#start-at").fill("2026-05-20T12:00");
  await page.locator("#end-at").fill("2026-05-20T11:00");
  await page.locator("#purpose").fill("逆順テスト");
  await page.locator("[data-booking-form] button[type='submit']").click();
  await expectText(page, "[data-booking-status]", "終了時間は開始時間より後にしてください。", "booking time validation");
  assert(backend.state.room_bookings.length === initialCount, "invalid time booking should not be inserted");

  await page.locator("#start-at").fill("2026-05-20T09:30");
  await page.locator("#end-at").fill("2026-05-20T09:45");
  await page.locator("#purpose").fill("重複テスト");
  await page.locator("[data-booking-form] button[type='submit']").click();
  await expectText(page, "[data-booking-status]", "同じ時間帯に承認済み予約があります。", "booking overlap validation");
  assert(backend.state.room_bookings.length === initialCount, "overlapping booking should not be inserted");

  await page.locator("#start-at").fill("2027-05-20T10:30");
  await page.locator("#end-at").fill("2027-05-20T11:30");
  await page.locator("#purpose").fill("正常テスト");
  await page.locator("[data-booking-form] button[type='submit']").click();
  await expectText(page, "[data-booking-status]", "予約申請を送信しました。", "booking success path");
  assert(backend.state.room_bookings.length === initialCount + 1, "valid booking should be inserted");
});

process.exit(0);
