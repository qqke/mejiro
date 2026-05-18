import { assert, login, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

const emptyTables = [
  "room_bookings",
  "notices",
  "notice_reads",
  "events",
  "management_documents",
  "document_approvals",
  "document_seals",
  "maintenance_requests",
  "finance_entries",
  "vendors",
  "vendor_contracts",
  "surveys",
  "survey_responses",
  "safety_events",
  "safety_checkins",
  "board_tasks",
  "parking_spaces",
  "parking_permits",
  "resident_requests",
  "circulars",
  "circular_acknowledgements",
  "lending_items",
  "lending_requests",
  "duty_assignments",
  "waste_schedules",
  "bulky_waste_requests",
  "meeting_sessions",
  "meeting_agenda_items",
  "meeting_attendances",
  "meeting_votes",
  "inspection_plans",
  "inspection_records",
];

const emptyStateChecks = [
  ["/notices/", "通知はありません。"],
  ["/events/", "行事はありません。"],
  ["/documents/", "文書はありません。"],
  ["/maintenance/", "修繕依頼はありません。"],
  ["/finance/", "台帳記録はありません。"],
  ["/vendors/", "業者はありません。"],
  ["/vendors/", "契約はありません。"],
  ["/surveys/", "意見募集はありません。"],
  ["/safety/", "防災・安否イベントはありません。"],
  ["/tasks/", "タスクはありません。"],
  ["/parking/", "区画はありません。"],
  ["/parking/", "利用申請はありません。"],
  ["/requests/", "相談・苦情はありません。"],
  ["/circulars/", "回覧はありません。"],
  ["/circulars/", "確認履歴はありません。"],
  ["/lending/", "貸出品はありません。"],
  ["/lending/", "貸出申請はありません。"],
  ["/duties/", "当番はありません。"],
  ["/duties/", "自分の当番はありません。"],
  ["/waste/", "収集ルールはありません。"],
  ["/waste/", "粗大ごみ申請はありません。"],
  ["/meetings/", "会議はありません。"],
  ["/meetings/", "議案はありません。"],
  ["/inspections/", "点検計画はありません。"],
  ["/inspections/", "点検記録はありません。"],
];

await withPreviewPage(async ({ page, baseUrl }) => {
  const backend = createMockSupabaseBackend();
  for (const table of emptyTables) {
    backend.state[table] = [];
  }

  await backend.install(page);
  await login(page, baseUrl, "admin@example.com", "password");

  const visited = new Set();
  for (const [path, text] of emptyStateChecks) {
    await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    const bodyPage = path === "/" ? "home" : path.replaceAll("/", "").replaceAll("-", "");
    await page.locator(`body[data-page='${bodyPage}']`).waitFor({ state: "attached", timeout: 20000 });

    const key = `${path}::${text}`;
    if (!visited.has(key)) {
      await page.getByText(text, { exact: true }).waitFor({ state: "visible", timeout: 20000 });
      assert((await page.getByText(text, { exact: true }).count()) >= 1, `${path} should show "${text}"`);
      visited.add(key);
    }
  }
});

process.exit(0);
