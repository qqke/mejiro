const iso = (value) => new Date(value).toISOString();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix, counter) {
  return `${prefix}-${counter}`;
}

function seedState() {
  const state = {
    counters: Object.create(null),
    profiles: [
      {
        id: "admin-user",
        email: "admin@example.com",
        display_name: "管理者テスト",
        role: "admin",
        building: "A",
        unit_number: "101",
        phone: "090-0000-0000",
        emergency_contact_name: "緊急先",
        emergency_contact_phone: "090-1111-1111",
        parking_application_blocked: false,
        parking_application_blocked_reason: null,
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-01T00:00:00Z"),
      },
      {
        id: "board-user",
        email: "board@example.com",
        display_name: "理事テスト",
        role: "board_member",
        building: "B",
        unit_number: "202",
        phone: "090-2222-2222",
        emergency_contact_name: "理事緊急先",
        emergency_contact_phone: "090-3333-3333",
        parking_application_blocked: false,
        parking_application_blocked_reason: null,
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-01T00:00:00Z"),
      },
      {
        id: "chair-user",
        email: "chair@example.com",
        display_name: "主席テスト",
        role: "chair",
        building: "B",
        unit_number: "203",
        phone: "090-3333-0000",
        emergency_contact_name: "主席緊急先",
        emergency_contact_phone: "090-3333-1111",
        parking_application_blocked: false,
        parking_application_blocked_reason: null,
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-01T00:00:00Z"),
      },
      {
        id: "president-user",
        email: "president@example.com",
        display_name: "理事長テスト",
        role: "president",
        building: "B",
        unit_number: "204",
        phone: "090-4444-0000",
        emergency_contact_name: "理事長緊急先",
        emergency_contact_phone: "090-4444-1111",
        parking_application_blocked: false,
        parking_application_blocked_reason: null,
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-01T00:00:00Z"),
      },
      {
        id: "resident-user",
        email: "resident@example.com",
        display_name: "住民テスト",
        role: "resident",
        building: "C",
        unit_number: "303",
        phone: "090-4444-4444",
        emergency_contact_name: "住民緊急先",
        emergency_contact_phone: "090-5555-5555",
        parking_application_blocked: false,
        parking_application_blocked_reason: null,
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-01T00:00:00Z"),
      },
    ],
    rooms: [
      { id: "room-1", name: "集会室A", capacity: 30, notes: "テスト会議室", is_active: true, created_at: iso("2026-05-01T00:00:00Z") },
      { id: "room-2", name: "集会室B", capacity: 18, notes: "補助会議室", is_active: true, created_at: iso("2026-05-01T00:00:00Z") },
    ],
    room_bookings: [
      {
        id: "booking-1",
        room_id: "room-1",
        user_id: "resident-user",
        purpose: "定例会議",
        start_at: iso("2026-05-20T09:00:00Z"),
        end_at: iso("2026-05-20T10:00:00Z"),
        status: "pending",
        approved_by: null,
        approved_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    notices: [
      {
        id: "notice-1",
        title: "総会のお知らせ",
        body: "管理組合総会の案内です。",
        kind: "notice",
        target_role: "all",
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    notice_reads: [],
    events: [
      {
        id: "event-1",
        title: "春の清掃",
        description: "共用部の清掃活動",
        location: "中庭",
        start_at: iso("2026-05-18T08:00:00Z"),
        end_at: iso("2026-05-18T09:00:00Z"),
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    management_documents: [
      {
        id: "doc-1",
        title: "管理規約改定案",
        kind: "rule",
        version: "1.0",
        summary: "改定案の概要",
        file_url: null,
        markdown_body: "# 管理規約改定案\n\n- 現行条文\n- 改定案の概要",
        current_version_id: "version-1",
        crdt_snapshot_id: null,
        status: "board_review",
        created_by: "admin-user",
        updated_by: "admin-user",
        approved_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    document_versions: [
      {
        id: "version-1",
        document_id: "doc-1",
        version_label: "v1",
        markdown_body: "# 管理規約改定案\n\n- 現行条文\n- 改定案の概要",
        summary: "初期版",
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    document_crdt_snapshots: [],
    document_approvals: [],
    document_seals: [],
    maintenance_requests: [
      {
        id: "maint-1",
        title: "廊下の照明不点灯",
        category: "equipment",
        priority: "high",
        status: "open",
        location: "1階廊下",
        description: "照明がつかない",
        requester_id: "resident-user",
        handled_by: null,
        handler_note: null,
        resolved_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    finance_entries: [
      {
        id: "finance-1",
        title: "管理費収入",
        entry_type: "income",
        category: "管理費",
        amount: 100000,
        entry_date: "2026-05-01",
        note: "月次収入",
        created_by: "admin-user",
        created_at: iso("2026-05-01T00:00:00Z"),
      },
      {
        id: "finance-2",
        title: "修繕支出",
        entry_type: "expense",
        category: "修繕",
        amount: 25000,
        entry_date: "2026-05-02",
        note: "配線修理",
        created_by: "admin-user",
        created_at: iso("2026-05-02T00:00:00Z"),
      },
    ],
    asset_items: [
      {
        id: "asset-1",
        name: "共用ポンプ",
        category: "equipment",
        status: "active",
        location: "機械室",
        inspection_due_at: "2026-05-25",
        note: "点検計画あり",
        managed_by: "admin-user",
        created_by: "admin-user",
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
      {
        id: "asset-2",
        name: "非常灯",
        category: "disaster",
        status: "inspection_due",
        location: "共用廊下",
        inspection_due_at: "2026-05-17",
        note: "交換検討",
        managed_by: "admin-user",
        created_by: "admin-user",
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    vendors: [
      {
        id: "vendor-1",
        name: "メンテ株式会社",
        category: "設備保守",
        contact_name: "担当A",
        phone: "03-1111-2222",
        email: "a@example.com",
        note: "テスト業者",
        is_active: true,
        created_by: "admin-user",
        created_at: iso("2026-05-01T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    vendor_contracts: [
      {
        id: "contract-1",
        vendor_id: "vendor-1",
        title: "保守契約A",
        status: "active",
        start_date: "2026-04-01",
        end_date: "2026-06-10",
        amount: 500000,
        created_by: "admin-user",
        created_at: iso("2026-04-01T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    surveys: [
      {
        id: "survey-1",
        title: "共用部改善アンケート",
        question: "優先して改善したい場所は？",
        options: ["玄関", "廊下", "階段"],
        is_open: true,
        closes_at: null,
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    survey_responses: [],
    safety_events: [
      {
        id: "safety-1",
        title: "防災訓練",
        kind: "drill",
        status: "planned",
        scheduled_at: iso("2026-05-22T09:00:00Z"),
        location: "広場",
        note: "訓練テスト",
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    safety_checkins: [],
    board_tasks: [
      {
        id: "task-1",
        title: "総会準備",
        description: "資料準備",
        status: "open",
        priority: "high",
        assignee_id: "board-user",
        due_date: "2026-05-25",
        created_by: "admin-user",
        completed_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    parking_spaces: [
      {
        id: "space-1",
        code: "P-01",
        kind: "car",
        location: "北側",
        monthly_fee: 12000,
        assignment_method: "first_come",
        is_active: true,
        is_available: true,
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    parking_permits: [
      {
        id: "permit-1",
        space_id: "space-1",
        user_id: "resident-user",
        vehicle_label: "白い車",
        status: "pending",
        priority: "primary",
        space_kind: "car",
        resident_unit_key: "C-303",
        start_date: "2026-05-15",
        end_date: null,
        approved_by: null,
        approved_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    parking_procedure_requests: [],
    resident_requests: [
      {
        id: "request-1",
        title: "騒音相談",
        category: "noise",
        visibility: "board",
        status: "open",
        body: "夜間の騒音です。",
        response: null,
        requester_id: "resident-user",
        handled_by: null,
        resolved_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    circulars: [
      {
        id: "circular-1",
        title: "配布物",
        kind: "notice",
        target_role: "all",
        status: "published",
        body: "回覧テスト",
        due_date: "2026-05-31",
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    circular_acknowledgements: [],
    lending_items: [
      {
        id: "lending-1",
        name: "共用鍵",
        kind: "key",
        location: "管理室",
        note: "貸出テスト",
        is_active: true,
        is_available: true,
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    lending_requests: [
      {
        id: "lendreq-1",
        item_id: "lending-1",
        user_id: "resident-user",
        purpose: "鍵の貸出確認",
        status: "pending",
        checkout_at: null,
        due_at: null,
        returned_at: null,
        approved_by: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    duty_assignments: [
      {
        id: "duty-1",
        title: "清掃当番",
        kind: "cleaning",
        status: "planned",
        assignee_id: "resident-user",
        scheduled_date: "2026-05-19",
        location: "1階",
        note: "当番テスト",
        created_by: "admin-user",
        completed_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    waste_schedules: [
      {
        id: "waste-1",
        title: "燃えるごみ",
        category: "burnable",
        collection_day: "火・金",
        location: "集積所A",
        note: "ごみテスト",
        is_active: true,
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    bulky_waste_requests: [
      {
        id: "bulky-1",
        user_id: "resident-user",
        item_name: "古い椅子",
        status: "submitted",
        preferred_date: "2026-05-28",
        pickup_location: "1階玄関",
        note: "粗大ごみテスト",
        scheduled_date: null,
        handled_by: null,
        completed_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    meeting_sessions: [
      {
        id: "meeting-1",
        title: "理事会",
        kind: "board",
        status: "open",
        scheduled_at: iso("2026-05-24T18:00:00Z"),
        location: "集会室A",
        note: "会議テスト",
        created_by: "admin-user",
        closed_at: null,
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    meeting_agenda_items: [
      {
        id: "agenda-1",
        meeting_id: "meeting-1",
        title: "議案A",
        description: "予算承認",
        sort_order: 1,
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    meeting_attendances: [],
    meeting_votes: [],
    inspection_plans: [
      {
        id: "inspection-1",
        asset_id: "asset-1",
        title: "共用ポンプ点検",
        frequency: "quarterly",
        next_due_date: "2026-05-20",
        note: "点検テスト",
        is_active: true,
        created_by: "admin-user",
        created_at: iso("2026-05-10T00:00:00Z"),
        updated_at: iso("2026-05-10T00:00:00Z"),
      },
    ],
    inspection_records: [],
    activity_logs: [],
  };

  return state;
}

function authAccountForEmail(state, email) {
  return state.profiles.find((profile) => profile.email === email) ?? null;
}

function tableNameFromUrl(url) {
  const match = url.pathname.match(/\/rest\/v1\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function matchFilter(row, column, op, rawValue) {
  const value = row[column];
  const decoded = decodeURIComponent(rawValue);
  if (op === "eq") return String(value) === decoded;
  if (op === "neq") return String(value) !== decoded;
  if (op === "lt") return String(value) < decoded;
  if (op === "lte") return String(value) <= decoded;
  if (op === "gt") return String(value) > decoded;
  if (op === "gte") return String(value) >= decoded;
  if (op === "is") return decoded === "null" ? value == null : String(value) === decoded;
  if (op === "in") {
    const items = decoded.replace(/^\(|\)$/g, "").split(",").map((item) => item.trim());
    return items.includes(String(value));
  }
  return true;
}

function applyFilters(rows, url) {
  let result = [...rows];
  const params = [...url.searchParams.entries()];

  for (const [key, raw] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns", "head"].includes(key)) continue;
    const [op, ...rest] = raw.split(".");
    const value = rest.join(".");
    result = result.filter((row) => matchFilter(row, key, op, value));
  }

  const orderParams = url.searchParams.getAll("order");
  for (const orderParam of orderParams) {
    const [column, direction = "asc"] = orderParam.split(".");
    result.sort((a, b) => {
      const left = a[column];
      const right = b[column];
      if (left === right) return 0;
      const comparison = String(left).localeCompare(String(right));
      return direction === "desc" ? -comparison : comparison;
    });
  }

  const limit = url.searchParams.get("limit");
  if (limit) {
    result = result.slice(0, Number(limit));
  }

  return result;
}

function enrichRow(state, table, row) {
  const next = clone(row);
  if (table === "room_bookings") {
    next.rooms = state.rooms.find((room) => room.id === row.room_id)
      ? { name: state.rooms.find((room) => room.id === row.room_id).name }
      : null;
    next.profiles = state.profiles.find((profile) => profile.id === row.user_id)
      ? { display_name: state.profiles.find((profile) => profile.id === row.user_id).display_name }
      : null;
  } else if (table === "management_documents") {
    next.profiles = state.profiles.find((profile) => profile.id === row.created_by)
      ? { display_name: state.profiles.find((profile) => profile.id === row.created_by).display_name }
      : null;
  } else if (table === "document_approvals" || table === "document_seals") {
    const doc = state.management_documents.find((document) => document.id === row.document_id);
    next.management_documents = doc ? { title: doc.title, version: doc.version } : null;
    const profile = state.profiles.find((item) => item.id === row.actor_id || item.id === row.sealed_by);
    next.profiles = profile ? { display_name: profile.display_name } : null;
  } else if (table === "document_versions" || table === "document_crdt_snapshots") {
    const doc = state.management_documents.find((document) => document.id === row.document_id);
    next.management_documents = doc ? { title: doc.title, version: doc.version } : null;
    const profile = state.profiles.find((item) => item.id === row.created_by);
    next.profiles = profile ? { display_name: profile.display_name } : null;
  } else if (table === "maintenance_requests" || table === "finance_entries" || table === "rooms" || table === "assets") {
    const profile = state.profiles.find((item) => item.id === row.created_by || item.id === row.requester_id);
    if (profile) next.profiles = { display_name: profile.display_name };
  } else if (table === "vendor_contracts") {
    const vendor = state.vendors.find((item) => item.id === row.vendor_id);
    next.vendors = vendor ? { name: vendor.name } : null;
  } else if (table === "parking_permits") {
    const space = state.parking_spaces.find((item) => item.id === row.space_id);
    next.parking_spaces = space ? { code: space.code, kind: space.kind, location: space.location, assignment_method: space.assignment_method } : null;
  } else if (table === "parking_procedure_requests") {
    const permit = state.parking_permits.find((item) => item.id === row.permit_id);
    const space = permit ? state.parking_spaces.find((item) => item.id === permit.space_id) : null;
    next.parking_permits = permit
      ? {
          vehicle_label: permit.vehicle_label,
          space_id: permit.space_id,
          parking_spaces: space ? { code: space.code, kind: space.kind, location: space.location } : null,
        }
      : null;
  } else if (table === "circular_acknowledgements") {
    const circular = state.circulars.find((item) => item.id === row.circular_id);
    next.circulars = circular ? { title: circular.title, kind: circular.kind, target_role: circular.target_role } : null;
  } else if (table === "lending_requests") {
    const item = state.lending_items.find((entry) => entry.id === row.item_id);
    next.lending_items = item ? { name: item.name, kind: item.kind, location: item.location } : null;
  } else if (table === "duty_assignments") {
    const profile = state.profiles.find((item) => item.id === row.assignee_id);
    next.profiles = profile ? { display_name: profile.display_name } : null;
  } else if (table === "meeting_agenda_items") {
    const meeting = state.meeting_sessions.find((item) => item.id === row.meeting_id);
    next.meeting_sessions = meeting ? { title: meeting.title, status: meeting.status } : null;
  } else if (table === "inspection_plans") {
    const asset = state.asset_items.find((item) => item.id === row.asset_id);
    next.asset_items = asset ? { name: asset.name, location: asset.location, status: asset.status } : null;
  } else if (table === "inspection_records") {
    const plan = state.inspection_plans.find((item) => item.id === row.plan_id);
    const asset = state.asset_items.find((item) => item.id === row.asset_id);
    next.inspection_plans = plan ? { title: plan.title } : null;
    next.asset_items = asset ? { name: asset.name } : null;
  } else if (table === "activity_logs") {
    const profile = state.profiles.find((item) => item.id === row.actor_id);
    next.profiles = profile ? { display_name: profile.display_name } : null;
  }
  return next;
}

function getTable(state, table) {
  return state[table];
}

function nextId(state, prefix) {
  const tables = Object.values(state).filter((value) => Array.isArray(value));
  let counter = state.counters[prefix] ?? 0;

  while (true) {
    counter += 1;
    const id = createId(prefix, counter);
    if (!tables.some((rows) => rows.some((row) => row.id === id))) {
      state.counters[prefix] = counter;
      return id;
    }
  }
}

function uniqueMatch(table, payload, row) {
  if (table === "notice_reads") return row.notice_id === payload.notice_id && row.user_id === payload.user_id;
  if (table === "survey_responses") return row.survey_id === payload.survey_id && row.user_id === payload.user_id;
  if (table === "safety_checkins") return row.event_id === payload.event_id && row.user_id === payload.user_id;
  if (table === "circular_acknowledgements") return row.circular_id === payload.circular_id && row.user_id === payload.user_id;
  if (table === "meeting_attendances") return row.meeting_id === payload.meeting_id && row.user_id === payload.user_id;
  if (table === "meeting_votes") return row.agenda_item_id === payload.agenda_item_id && row.user_id === payload.user_id;
  if (table === "parking_permits") return row.id === payload.id || row.space_id === payload.space_id && row.status === "active";
  return false;
}

function isUuid(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function applyInsert(state, table, payload) {
  const items = Array.isArray(payload) ? payload : [payload];
  const inserted = [];

  for (const item of items) {
    const row = clone(item);
    if (table === "activity_logs" && row.entity_id != null && !isUuid(row.entity_id)) {
      throw new Error(`invalid uuid for activity_logs.entity_id: ${row.entity_id}`);
    }
    if (table === "parking_spaces") {
      if (row.assignment_method === undefined) row.assignment_method = "first_come";
      if (row.is_active === undefined) row.is_active = true;
      if (row.is_available === undefined) row.is_available = true;
    }
    if (table === "parking_permits") {
      const space = state.parking_spaces.find((entry) => entry.id === row.space_id);
      const profile = state.profiles.find((entry) => entry.id === row.user_id);
      row.priority = row.priority ?? "primary";
      row.space_kind = space?.kind ?? "car";
      row.resident_unit_key = profile?.building && profile?.unit_number ? `${profile.building}-${profile.unit_number}` : row.user_id;
    }
    if (table === "parking_procedure_requests") {
      const permit = state.parking_permits.find((entry) => entry.id === row.permit_id);
      if (row.kind === "return_notice") {
        const minimum = new Date();
        minimum.setDate(minimum.getDate() + 14);
        if (!row.requested_return_date || new Date(row.requested_return_date) < new Date(minimum.toISOString().slice(0, 10))) {
          throw new Error("返還届は14日以上前に提出してください。");
        }
      }
      if (row.kind === "vehicle_change" && !row.requested_vehicle_label) {
        throw new Error("車両変更では変更後車両を入力してください。");
      }
      if (permit?.status !== "active") {
        throw new Error("利用中の駐車許可のみ手続きできます。");
      }
    }
    if (!row.id) row.id = nextId(state, table.replace(/_.*$/, ""));
    if (table === "surveys" && row.is_open === undefined) row.is_open = true;
    if (table === "meeting_sessions" && row.status === undefined) row.status = "open";
    if (table === "inspection_plans" && row.is_active === undefined) row.is_active = true;
    if (table === "management_documents" && row.markdown_body === undefined) row.markdown_body = `# ${row.title}\n\n${row.summary}`;
    const now = iso(new Date());
    if (table === "document_seals" && !row.sealed_at) row.sealed_at = now;
    if (!row.created_at) row.created_at = now;
    if (!row.updated_at) row.updated_at = now;
    const existing = getTable(state, table).find((entry) => uniqueMatch(table, row, entry));
    if (existing) {
      Object.assign(existing, row, { updated_at: row.updated_at ?? iso(new Date()) });
      inserted.push(clone(existing));
      continue;
    }
    getTable(state, table).push(row);
    inserted.push(clone(row));
  }

  return inserted;
}

function applyUpdate(state, table, payload, url) {
  const rows = getTable(state, table);
  const filtered = applyFilters(rows, url);
  const updated = [];
  for (const row of rows) {
    if (!filtered.some((match) => match.id === row.id)) continue;
    Object.assign(row, payload, { updated_at: iso(new Date()) });
    updated.push(clone(row));
  }
  return updated;
}

function approveParkingApplication(state, permitId, actorId) {
  const permit = state.parking_permits.find((item) => item.id === permitId);
  if (!permit || permit.status !== "pending") throw new Error("承認対象の駐車申請が見つからないか、承認できません。");
  const space = state.parking_spaces.find((item) => item.id === permit.space_id);
  if (!space || !space.is_active || !space.is_available) throw new Error("対象区画は利用できません。");
  if (space.assignment_method === "lottery") throw new Error("抽選区画は抽選実施から承認してください。");
  permit.status = "active";
  permit.approved_by = actorId;
  permit.approved_at = iso(new Date());
  permit.updated_at = iso(new Date());
  space.is_available = false;
  space.updated_at = iso(new Date());
  return clone(permit);
}

function drawParkingLottery(state, spaceId, actorId) {
  const space = state.parking_spaces.find((item) => item.id === spaceId);
  if (!space || space.assignment_method !== "lottery") throw new Error("抽選対象の区画が見つかりません。");
  const candidates = state.parking_permits
    .filter((permit) => permit.space_id === spaceId && permit.status === "pending")
    .sort((a, b) => (a.priority === b.priority ? a.created_at.localeCompare(b.created_at) : a.priority === "primary" ? -1 : 1));
  const winner = candidates[0];
  if (!winner) throw new Error("抽選対象の申請がありません。");
  for (const permit of candidates.slice(1)) {
    permit.status = "rejected";
    permit.updated_at = iso(new Date());
  }
  winner.status = "active";
  winner.approved_by = actorId;
  winner.approved_at = iso(new Date());
  winner.updated_at = iso(new Date());
  space.is_available = false;
  space.updated_at = iso(new Date());
  return clone(winner);
}

function handleParkingProcedureRequest(state, requestId, approve, actorId) {
  const request = state.parking_procedure_requests.find((item) => item.id === requestId);
  if (!request || request.status !== "pending") throw new Error("処理対象の駐車手続きが見つかりません。");
  const permit = state.parking_permits.find((item) => item.id === request.permit_id);
  if (!permit) throw new Error("対象の駐車利用が見つかりません。");
  if (approve) {
    if (request.kind === "vehicle_change") {
      permit.vehicle_label = request.requested_vehicle_label;
      permit.updated_at = iso(new Date());
    } else if (request.kind === "return_notice") {
      permit.status = "ended";
      permit.end_date = request.requested_return_date;
      permit.updated_at = iso(new Date());
      const space = state.parking_spaces.find((item) => item.id === permit.space_id);
      if (space) {
        space.is_available = true;
        space.updated_at = iso(new Date());
      }
    }
  }
  request.status = approve ? "approved" : "rejected";
  request.handled_by = actorId;
  request.handled_at = iso(new Date());
  request.updated_at = iso(new Date());
  return clone(request);
}

function applyRpc(state, name, payload, actorId) {
  if (name === "approve_parking_application") return approveParkingApplication(state, payload.p_permit_id, actorId);
  if (name === "draw_parking_lottery") return drawParkingLottery(state, payload.p_space_id, actorId);
  if (name === "handle_parking_procedure_request") return handleParkingProcedureRequest(state, payload.p_request_id, payload.p_approve, actorId);
  throw new Error(`unknown rpc ${name}`);
}

function authResponse(state, email) {
  const profile = authAccountForEmail(state, email) ?? state.profiles[0];
  const user = {
    id: profile.id,
    aud: "authenticated",
    role: "authenticated",
    email: profile.email ?? "admin@example.com",
    phone: "",
    created_at: profile.created_at ?? iso("2026-05-01T00:00:00Z"),
    updated_at: profile.updated_at ?? iso("2026-05-01T00:00:00Z"),
    app_metadata: {},
    user_metadata: { display_name: profile.display_name ?? "ユーザー" },
  };

  return {
    access_token: "mock-access-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "mock-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  };
}

export function createMockSupabaseBackend() {
  const state = seedState();
  const realtimeEvents = [];
  let currentUserId = state.profiles[0]?.id ?? "admin-user";

  return {
    state,
    realtimeEvents,
    async install(page) {
      await page.exposeFunction("__mejiroRecordRealtime", (event) => {
        realtimeEvents.push(event);
      });
      await page.addInitScript(() => {
        window.__MEJIRO_PRINT_CALLED__ = false;
        window.print = () => {
          window.__MEJIRO_PRINT_CALLED__ = true;
        };
        const channels = new Map();
        window.__MEJIRO_MOCK_REALTIME__ = {
          channel(topic) {
            if (!channels.has(topic)) {
              const handlers = [];
              channels.set(topic, {
                on(type, filter, callback) {
                  handlers.push({ type, event: filter?.event, callback });
                  return this;
                },
                subscribe(callback) {
                  setTimeout(() => callback?.("SUBSCRIBED"), 0);
                  return this;
                },
                async send(message) {
                  const event = { topic, event: message.event, payload: message.payload };
                  window.__MEJIRO_REALTIME_EVENTS__ = window.__MEJIRO_REALTIME_EVENTS__ || [];
                  window.__MEJIRO_REALTIME_EVENTS__.push(event);
                  window.__mejiroRecordRealtime?.(event);
                  for (const handler of handlers) {
                    if (handler.type === message.type && handler.event === message.event) {
                      handler.callback({ event: message.event, payload: message.payload });
                    }
                  }
                  return "ok";
                },
                async track(payload) {
                  const event = { topic, event: "presence-track", payload };
                  window.__MEJIRO_REALTIME_EVENTS__ = window.__MEJIRO_REALTIME_EVENTS__ || [];
                  window.__MEJIRO_REALTIME_EVENTS__.push(event);
                  window.__mejiroRecordRealtime?.(event);
                  return "ok";
                },
                async untrack() {
                  return "ok";
                },
              });
            }
            return channels.get(topic);
          },
        };
      });

      await page.route("**/auth/v1/token**", async (route) => {
        const request = route.request();
        const payload = request.postDataJSON?.() ?? {};
        const email = String(payload.email ?? "");
        const password = String(payload.password ?? "");
        const profile = authAccountForEmail(state, email);

        if (!profile || password !== "password") {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              error: "invalid_grant",
              error_description: "Invalid login credentials",
              code: "invalid_credentials",
            }),
          });
          return;
        }

        const body = authResponse(state, email);
        currentUserId = profile.id;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(body),
        });
      });

      await page.route("**/auth/v1/logout**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      });

      await page.route("**/rest/v1/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const rpcMatch = url.pathname.match(/\/rest\/v1\/rpc\/([^/]+)$/);
        if (rpcMatch) {
          try {
            const body = applyRpc(state, decodeURIComponent(rpcMatch[1]), request.postDataJSON?.() ?? {}, currentUserId);
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
          } catch (error) {
            await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ message: error.message }) });
          }
          return;
        }
        const table = tableNameFromUrl(url);
        if (!table || !state[table]) {
          await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "not found" }) });
          return;
        }

        if (request.method() === "GET") {
          const rows = applyFilters(state[table].map((row) => enrichRow(state, table, row)), url);
          const body = JSON.stringify(rows.map((row) => enrichRow(state, table, row)));
          const accept = request.headers()["accept"] ?? "";
          if (accept.includes("application/vnd.pgrst.object+json")) {
            const first = rows[0] ?? null;
            await route.fulfill({
              status: first ? 200 : 406,
              contentType: "application/json",
              body: first ? JSON.stringify(enrichRow(state, table, first)) : JSON.stringify({ message: "No rows" }),
            });
            return;
          }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: {
              "content-range": `${Math.max(0, rows.length - 1)}/${rows.length}`,
            },
            body,
          });
          return;
        }

        if (request.method() === "POST") {
          const payload = request.postDataJSON();
          const inserted = applyInsert(state, table, payload);
          const accept = request.headers()["accept"] ?? "";
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: accept.includes("application/vnd.pgrst.object+json")
              ? JSON.stringify(enrichRow(state, table, inserted[0]))
              : JSON.stringify(inserted.map((row) => enrichRow(state, table, row))),
          });
          return;
        }

        if (request.method() === "PATCH") {
          const payload = request.postDataJSON();
          const updated = applyUpdate(state, table, payload, url);
          const accept = request.headers()["accept"] ?? "";
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: accept.includes("application/vnd.pgrst.object+json")
              ? JSON.stringify(enrichRow(state, table, updated[0]))
              : JSON.stringify(updated.map((row) => enrichRow(state, table, row))),
          });
          return;
        }

        await route.fulfill({ status: 405, contentType: "application/json", body: JSON.stringify({ message: "method not allowed" }) });
      });
    },
  };
}
