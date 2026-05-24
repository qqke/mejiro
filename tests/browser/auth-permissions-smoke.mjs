import { assert, expectText, login, waitForPath, withPreviewPage } from "./_helpers.mjs";
import { createMockSupabaseBackend } from "./mock-backend.mjs";

async function waitForCondition(condition, label) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
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

async function runInvalidLoginCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);
    await page.goto(`${baseUrl}/login/`, { waitUntil: "domcontentloaded" });
    await page.locator("#email").fill("resident@example.com");
    await page.locator("#password").fill("wrong-password");
    await page.locator("[data-login-form] button[type='submit']").click();

    await expectText(page, "[data-status]", "メールアドレスまたはパスワードが正しくありません。", "invalid login message");
    assert((await page.locator("body[data-page='login']").count()) === 1, "invalid login should stay on login page");
  });
}

async function runAuthSchemaErrorCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    await page.route("**/auth/v1/token**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          code: 500,
          error_code: "unexpected_failure",
          msg: "Database error querying schema",
        }),
      });
    });

    await page.goto(`${baseUrl}/login/`, { waitUntil: "domcontentloaded" });
    await page.locator("#email").fill("resident@example.com");
    await page.locator("#password").fill("password");
    await page.locator("[data-login-form] button[type='submit']").click();

    await expectText(
      page,
      "[data-status]",
      "Supabase Auth のデータベース設定でエラーが発生しています。管理者に Auth Logs / Postgres Logs と未適用の schema.sql / migration を確認してもらってください。",
      "auth schema error message",
    );
  });
}

async function runBoardAccessCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);
    backend.state.notices.unshift({
      id: "notice-board-only",
      title: "理事限定通知",
      body: "理事だけに共有する内容です。",
      kind: "topic",
      target_role: "board_member",
      created_by: "admin-user",
      created_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.circulars.unshift({
      id: "circular-board-only",
      title: "理事限定回覧",
      kind: "notice",
      target_role: "board_member",
      status: "published",
      body: "理事だけに回す内容です。",
      due_date: "2026-05-31",
      created_by: "admin-user",
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    await login(page, baseUrl, "board@example.com", "password");
    await expectText(page, "[data-user-role]", "理事", "board role label");
    assert((await page.locator("[data-nav-group='admin']").count()) === 0, "board member should not see admin navigation");
    await expectText(page, "[data-metric='home-actions']", "9", "board home actionable work metric");
    await expectText(page, "[data-metric='home-risks']", "6", "board home risk metric");
    await expectText(page, "[data-metric='unread-notices']", "2", "board home unread notices should include board-targeted notices");
    assert((await page.locator("[data-home-notices] .list-item").filter({ hasText: "理事限定通知" }).count()) === 1, "board home should show board-targeted notice");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "2件の未確認回覧" }).count()) === 1, "board home should count board-targeted circulars");
    await page.locator("[data-global-search-input]").fill("権限");
    assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "管理" }).count()) === 0, "board member should not find admin page in global search");
    await page.locator("[data-global-search-input]").press("Escape");

    await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='meetings']").waitFor({ state: "attached", timeout: 20000 });
    await waitForCondition(async () => {
      const className = await page.locator("[data-meeting-form]").getAttribute("class");
      return Boolean(className && !className.includes("hidden"));
    }, "board meeting form visibility");
    await waitForCondition(async () => {
      const className = await page.locator("[data-agenda-form]").getAttribute("class");
      return Boolean(className && !className.includes("hidden"));
    }, "board agenda form visibility");
    assert((await page.locator("[data-attendance-form]").count()) === 1, "board member should see attendance form");
    assert((await page.locator("[data-vote-form]").count()) === 1, "board member should see vote form");

    await page.goto(`${baseUrl}/admin/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='admin']").waitFor({ state: "attached", timeout: 20000 });
    await expectText(page, "h1", "アクセス権限がありません", "admin denied heading for board member");

    await page.locator("[data-action='sign-out']").click();
    await waitForPath(page, (pathname) => pathname === "/login/" || pathname === "/login");
    await expectText(page, "h2", "ログイン", "sign-out should return to login");
  });
}

async function runResidentAccessCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);
    backend.state.notices.unshift({
      id: "notice-board-only",
      title: "理事限定通知",
      body: "理事だけに共有する内容です。",
      kind: "topic",
      target_role: "board_member",
      created_by: "admin-user",
      created_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.circulars.unshift({
      id: "circular-board-only",
      title: "理事限定回覧",
      kind: "notice",
      target_role: "board_member",
      status: "published",
      body: "理事だけに回す内容です。",
      due_date: "2026-05-31",
      created_by: "admin-user",
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.maintenance_requests.unshift({
      id: "maint-board-only",
      title: "他人の修繕",
      category: "equipment",
      priority: "normal",
      status: "open",
      location: "2階廊下",
      description: "別の住戸からの依頼です。",
      requester_id: "board-user",
      handled_by: null,
      handler_note: null,
      resolved_at: null,
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.resident_requests.unshift({
      id: "request-board-only",
      title: "他人の相談",
      category: "neighbor",
      visibility: "board",
      status: "open",
      body: "理事だけに共有する相談です。",
      response: null,
      requester_id: "board-user",
      handled_by: null,
      resolved_at: null,
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.parking_permits.unshift({
      id: "permit-board-only",
      space_id: "space-1",
      user_id: "board-user",
      vehicle_label: "他人の車",
      status: "pending",
      start_date: "2026-05-16",
      end_date: null,
      approved_by: null,
      approved_at: null,
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.lending_requests.unshift({
      id: "lendreq-board-only",
      item_id: "lending-1",
      user_id: "board-user",
      purpose: "他人の貸出",
      status: "pending",
      checkout_at: null,
      due_at: null,
      returned_at: null,
      approved_by: null,
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.duty_assignments.unshift({
      id: "duty-board-only",
      title: "他人の当番",
      kind: "patrol",
      status: "planned",
      assignee_id: "board-user",
      scheduled_date: "2026-05-19",
      location: "2階",
      note: "別の担当です。",
      created_by: "admin-user",
      completed_at: null,
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.bulky_waste_requests.unshift({
      id: "bulky-board-only",
      user_id: "board-user",
      item_name: "他人の粗大ごみ",
      status: "submitted",
      preferred_date: "2026-05-29",
      pickup_location: "2階玄関",
      note: "別の住戸からの申請です。",
      scheduled_date: null,
      handled_by: null,
      completed_at: null,
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });
    await login(page, baseUrl, "resident@example.com", "password");
    await expectText(page, "[data-user-role]", "居民", "resident role label");
    assert((await page.locator("[data-nav-group='admin']").count()) === 0, "resident should not see admin navigation");
    await expectText(page, "[data-metric='pending-bookings']", "0", "resident home approval metric should hide manager approvals");
    await expectText(page, "[data-metric='unread-notices']", "1", "resident home unread notices should exclude board-targeted notices");
    await expectText(page, "[data-metric='home-actions']", "6", "resident home actionable work metric should show resident-relevant work");
    await expectText(page, "[data-metric='home-risks']", "1", "resident home risk metric should show resident-relevant risks");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "会議室予約の承認" }).count()) === 0, "resident home should not show booking approvals");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "回覧の確認" }).count()) === 1, "resident home should show unread circulars");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "修繕依頼の状況" }).count()) === 1, "resident home should show own maintenance requests");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "相談・苦情の状況" }).count()) === 1, "resident home should show own resident requests");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "粗大ごみ申請" }).count()) === 1, "resident home should show own bulky waste requests");
    assert((await page.locator("[data-home-risk-list] .list-item").filter({ hasText: "当番・巡回期限" }).count()) === 1, "resident home should show assigned duty risks");
    assert((await page.locator("[data-home-bookings] .list-item").filter({ hasText: "定例会議" }).count()) === 1, "resident home should show own booking");
    backend.state.room_bookings.unshift({
      id: "booking-board-only",
      room_id: "room-2",
      user_id: "board-user",
      purpose: "理事だけの予約",
      start_at: "2026-05-20T12:00:00.000Z",
      end_at: "2026-05-20T13:00:00.000Z",
      status: "pending",
      approved_by: null,
      approved_at: null,
      created_at: "2026-05-10T00:00:00.000Z",
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectText(page, "[data-user-role]", "居民", "resident role label after reload");
    assert((await page.locator("[data-home-bookings] .list-item").filter({ hasText: "理事だけの予約" }).count()) === 0, "resident home should not show other users' bookings");
    assert((await page.locator("[data-home-notices] .list-item").filter({ hasText: "理事限定通知" }).count()) === 0, "resident home should not show board-targeted notice");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "2件の未確認回覧" }).count()) === 0, "resident home should not count board-targeted circulars");
    await page.goto(`${baseUrl}/notices/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='notices']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-notice-list] .list-item").filter({ hasText: "理事限定通知" }).count()) === 0, "resident notice page should not show board-targeted notice");
    await page.goto(`${baseUrl}/circulars/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='circulars']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-circular-list] .list-item").filter({ hasText: "理事限定回覧" }).count()) === 0, "resident circular page should not show board-targeted circular");
    await page.goto(`${baseUrl}/maintenance/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='maintenance']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-maintenance-list] .list-item").filter({ hasText: "他人の修繕" }).count()) === 0, "resident maintenance page should not show other users' requests");
    await page.goto(`${baseUrl}/requests/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='requests']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-resident-request-list] .list-item").filter({ hasText: "他人の相談" }).count()) === 0, "resident request page should not show board-only requests from others");
    await page.goto(`${baseUrl}/parking/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='parking']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-parking-permit-list] .list-item").filter({ hasText: "他人の車" }).count()) === 0, "resident parking page should not show other users' permits");
    await page.goto(`${baseUrl}/lending/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='lending']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-lending-request-list] .list-item").filter({ hasText: "他人の貸出" }).count()) === 0, "resident lending page should not show other users' lending requests");
    await page.goto(`${baseUrl}/duties/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='duties']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-duty-list] .list-item").filter({ hasText: "他人の当番" }).count()) === 0, "resident duties page should not show other users' duties");
    await page.goto(`${baseUrl}/waste/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='waste']").waitFor({ state: "attached", timeout: 20000 });
    assert((await page.locator("[data-bulky-request-list] .list-item").filter({ hasText: "他人の粗大ごみ" }).count()) === 0, "resident waste page should not show other users' bulky waste requests");
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='home']").waitFor({ state: "attached", timeout: 20000 });
    await page.locator("[data-global-search-input]").fill("権限");
    assert((await page.locator("[data-global-search-results] [data-global-search-link]").filter({ hasText: "管理" }).count()) === 0, "resident should not find admin page in global search");
    await page.locator("[data-global-search-input]").press("Escape");

    await page.goto(`${baseUrl}/meetings/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='meetings']").waitFor({ state: "attached", timeout: 20000 });
    await waitForCondition(async () => {
      const className = await page.locator("[data-meeting-form]").getAttribute("class");
      return Boolean(className && className.includes("hidden"));
    }, "resident meeting form hidden");
    await waitForCondition(async () => {
      const className = await page.locator("[data-agenda-form]").getAttribute("class");
      return Boolean(className && className.includes("hidden"));
    }, "resident agenda form hidden");
    assert((await page.locator("[data-attendance-form]").count()) === 1, "resident should still see attendance form");
    assert((await page.locator("[data-vote-form]").count()) === 1, "resident should still see vote form");

    await page.goto(`${baseUrl}/admin/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='admin']").waitFor({ state: "attached", timeout: 20000 });
    await expectText(page, "h1", "アクセス権限がありません", "admin denied heading for resident");
  });
}

async function runChairTargetRoleCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    await backend.install(page);
    backend.state.notices.unshift({
      id: "notice-chair-only",
      title: "主席限定通知",
      body: "主席だけに共有する内容です。",
      kind: "topic",
      target_role: "chair",
      created_by: "admin-user",
      created_at: "2026-05-11T00:00:00.000Z",
    });
    backend.state.circulars.unshift({
      id: "circular-chair-only",
      title: "主席限定回覧",
      kind: "notice",
      target_role: "chair",
      status: "published",
      body: "主席だけに回す内容です。",
      due_date: "2026-05-31",
      created_by: "admin-user",
      created_at: "2026-05-11T00:00:00.000Z",
      updated_at: "2026-05-11T00:00:00.000Z",
    });

    await login(page, baseUrl, "chair@example.com", "password");
    await expectText(page, "[data-user-role]", "主席", "chair role label");
    await expectText(page, "[data-metric='unread-notices']", "2", "chair home unread notices should include chair-targeted notices");
    assert((await page.locator("[data-home-notices] .list-item").filter({ hasText: "主席限定通知" }).count()) === 1, "chair home should show chair-targeted notice");
    assert((await page.locator("[data-home-actions] .list-item").filter({ hasText: "2件の未確認回覧" }).count()) === 1, "chair home should count chair-targeted circulars");
    await page.goto(`${baseUrl}/circulars/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='circulars']").waitFor({ state: "attached", timeout: 20000 });
    await waitForCondition(
      async () => (await page.locator("[data-circular-list] .list-item").filter({ hasText: "主席限定回覧" }).count()) === 1,
      "chair circular page should show chair-targeted circular",
    );
  });
}

async function runDocumentStageRoleCheck(email, status, expectedRoleLabel, expectedButtonText) {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    backend.state.management_documents[0].status = status;
    await backend.install(page);
    await login(page, baseUrl, email, "password");
    await expectText(page, "[data-user-role]", expectedRoleLabel, `${email} role label`);

    await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='documents']").waitFor({ state: "attached", timeout: 20000 });
    const document = page.locator("[data-document-list] .list-item").filter({ hasText: "管理規約改定案" });
    await document.waitFor({ state: "visible", timeout: 20000 });
    await expectText(page, "[data-document-list] [data-document-approve]", expectedButtonText, `${email} stage approval button`);
  });
}

async function runDocumentStageDeniedCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    backend.state.management_documents[0].status = "chair_review";
    await backend.install(page);
    await login(page, baseUrl, "board@example.com", "password");

    await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='documents']").waitFor({ state: "attached", timeout: 20000 });
    const document = page.locator("[data-document-list] .list-item").filter({ hasText: "管理規約改定案" });
    await document.waitFor({ state: "visible", timeout: 20000 });
    assert((await document.locator("[data-document-approve]").count()) === 0, "board member should not approve chair stage");
    assert(/主席承認待ち/.test((await document.textContent()) ?? ""), "board member should see chair pending label");
  });
}

async function runDocumentRejectResubmitCheck() {
  await withPreviewPage(async ({ page, baseUrl }) => {
    const backend = createMockSupabaseBackend();
    backend.state.management_documents[0].status = "chair_review";
    await backend.install(page);
    await login(page, baseUrl, "admin@example.com", "password");

    await page.goto(`${baseUrl}/documents/`, { waitUntil: "domcontentloaded" });
    await page.locator("body[data-page='documents']").waitFor({ state: "attached", timeout: 20000 });
    const document = page.locator("[data-document-list] .list-item").filter({ hasText: "管理規約改定案" });
    await clickAndConfirm(page, () => document.locator("[data-document-reject]").click(), "差戻");
    await waitForCondition(() => backend.state.management_documents[0].status === "rejected", "chair-stage rejection");
    assert(backend.state.document_approvals.some((approval) => approval.stage === "chair" && approval.action === "rejected"), "rejection should record chair stage");

    await document.locator("[data-document-resubmit]").click();
    await waitForCondition(() => backend.state.management_documents[0].status === "board_review", "document resubmission");
  });
}

await runInvalidLoginCheck();
await runAuthSchemaErrorCheck();
await runBoardAccessCheck();
await runResidentAccessCheck();
await runChairTargetRoleCheck();
await runDocumentStageRoleCheck("board@example.com", "board_review", "理事", "理事承認");
await runDocumentStageRoleCheck("chair@example.com", "chair_review", "主席", "主席承認");
await runDocumentStageRoleCheck("president@example.com", "president_review", "理事長", "理事長承認");
await runDocumentStageRoleCheck("admin@example.com", "chair_review", "管理者", "主席承認");
await runDocumentStageDeniedCheck();
await runDocumentRejectResubmitCheck();

process.exit(0);
