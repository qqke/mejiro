import { animate, stagger } from "animejs";
import { hasSupabaseConfig, supabase, type BookingStatus, type Profile, type Role } from "../lib/supabase";

type Room = {
  id: string;
  name: string;
  capacity: number | null;
  notes: string | null;
};

type Booking = {
  id: string;
  room_id: string;
  user_id: string;
  purpose: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  rooms?: Pick<Room, "name"> | null;
  profiles?: Pick<Profile, "display_name"> | null;
};

type CalendarInstance = {
  render: () => void;
  prev: () => void;
  next: () => void;
  today: () => void;
  changeView: (viewName: string) => void;
  refetchEvents: () => void;
  getCurrentData: () => { viewTitle: string; viewApi: { type: string } };
};

type Notice = {
  id: string;
  title: string;
  body: string;
  kind: "notice" | "meeting" | "topic";
  target_role: Role | "all";
  created_at: string;
  created_by: string;
};

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
};

type DocumentStatus = "review" | "approved" | "rejected" | "archived";
type DocumentKind = "minutes" | "rule" | "estimate" | "approval" | "other";
type DocumentApprovalAction = "approved" | "rejected";

type ManagementDocument = {
  id: string;
  title: string;
  kind: DocumentKind;
  version: string;
  summary: string;
  file_url: string | null;
  status: DocumentStatus;
  created_by: string;
  updated_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "display_name"> | null;
};

type DocumentApproval = {
  id: string;
  document_id: string;
  actor_id: string;
  action: DocumentApprovalAction;
  comment: string | null;
  created_at: string;
  management_documents?: Pick<ManagementDocument, "title" | "version"> | null;
  profiles?: Pick<Profile, "display_name"> | null;
};

type DocumentSeal = {
  id: string;
  document_id: string;
  sealed_by: string;
  seal_name: string;
  sealed_at: string;
  note: string | null;
  management_documents?: Pick<ManagementDocument, "title" | "version"> | null;
  profiles?: Pick<Profile, "display_name"> | null;
};

type MaintenanceCategory = "common_area" | "equipment" | "safety" | "cleaning" | "other";
type MaintenancePriority = "normal" | "high" | "urgent";
type MaintenanceStatus = "open" | "in_progress" | "resolved" | "closed";
type FinanceEntryType = "income" | "expense";

type MaintenanceRequest = {
  id: string;
  title: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  location: string;
  description: string;
  requester_id: string;
  handled_by: string | null;
  handler_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "display_name"> | null;
};

type FinanceEntry = {
  id: string;
  title: string;
  entry_type: FinanceEntryType;
  category: string;
  amount: number;
  entry_date: string;
  note: string | null;
  created_by: string;
  created_at: string;
  profiles?: Pick<Profile, "display_name"> | null;
};

type AssetCategory = "equipment" | "fixture" | "disaster" | "document" | "other";
type AssetStatus = "active" | "inspection_due" | "repair_needed" | "retired";
type ContractStatus = "active" | "renewal_due" | "expired" | "terminated";

type AssetItem = {
  id: string;
  name: string;
  category: AssetCategory;
  status: AssetStatus;
  location: string;
  inspection_due_at: string | null;
  note: string | null;
  managed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type Vendor = {
  id: string;
  name: string;
  category: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type VendorContract = {
  id: string;
  vendor_id: string;
  title: string;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  amount: number | null;
  created_by: string;
  vendors?: Pick<Vendor, "name"> | null;
};

type Survey = {
  id: string;
  title: string;
  question: string;
  options: string[];
  is_open: boolean;
  closes_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type SurveyResponse = {
  id: string;
  survey_id: string;
  user_id: string;
  option_value: string;
  comment: string | null;
  created_at: string;
};

type SafetyEventKind = "drill" | "inspection" | "checkin" | "other";
type SafetyEventStatus = "planned" | "active" | "completed" | "cancelled";
type SafetyCheckinStatus = "safe" | "needs_help";
type BoardTaskStatus = "open" | "in_progress" | "done" | "cancelled";
type BoardTaskPriority = "normal" | "high" | "urgent";

type SafetyEvent = {
  id: string;
  title: string;
  kind: SafetyEventKind;
  status: SafetyEventStatus;
  scheduled_at: string;
  location: string | null;
  note: string | null;
  created_by: string;
  created_at: string;
};

type SafetyCheckin = {
  id: string;
  event_id: string;
  user_id: string;
  status: SafetyCheckinStatus;
  comment: string | null;
  created_at: string;
};

type BoardTask = {
  id: string;
  title: string;
  description: string;
  status: BoardTaskStatus;
  priority: BoardTaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type ParkingSpaceKind = "car" | "bicycle" | "motorbike";
type ParkingPermitStatus = "pending" | "active" | "rejected" | "ended";
type ResidentRequestCategory = "noise" | "rule" | "neighbor" | "common_area" | "other";
type ResidentRequestStatus = "open" | "in_progress" | "resolved" | "closed";
type ResidentRequestVisibility = "private" | "board" | "public";
type CircularKind = "notice" | "minutes" | "event" | "rule" | "other";
type CircularStatus = "published" | "archived";
type LendingItemKind = "key" | "equipment" | "document" | "other";
type LendingRequestStatus = "pending" | "checked_out" | "returned" | "rejected" | "lost";
type DutyKind = "cleaning" | "patrol" | "meeting" | "garden" | "other";
type DutyStatus = "planned" | "done" | "missed" | "cancelled";
type WasteCategory = "burnable" | "non_burnable" | "recycle" | "oversized" | "hazardous" | "other";
type BulkyWasteStatus = "submitted" | "scheduled" | "completed" | "cancelled";
type MeetingKind = "board" | "general" | "committee" | "other";
type MeetingStatus = "open" | "closed" | "cancelled";
type MeetingAttendanceStatus = "attending" | "proxy" | "absent";
type MeetingVoteChoice = "approve" | "reject" | "abstain";
type InspectionFrequency = "monthly" | "quarterly" | "semiannual" | "annual" | "ad_hoc";
type InspectionResult = "ok" | "watch" | "repair_needed" | "retired";

type ParkingSpace = {
  id: string;
  code: string;
  kind: ParkingSpaceKind;
  location: string | null;
  monthly_fee: number | null;
  is_active: boolean;
  is_available: boolean;
};

type ParkingPermit = {
  id: string;
  space_id: string;
  user_id: string;
  vehicle_label: string;
  status: ParkingPermitStatus;
  start_date: string;
  end_date: string | null;
  approved_by: string | null;
  approved_at: string | null;
  parking_spaces?: Pick<ParkingSpace, "code" | "kind" | "location"> | null;
};

type ResidentRequest = {
  id: string;
  title: string;
  category: ResidentRequestCategory;
  visibility: ResidentRequestVisibility;
  status: ResidentRequestStatus;
  body: string;
  response: string | null;
  requester_id: string;
  handled_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type Circular = {
  id: string;
  title: string;
  kind: CircularKind;
  target_role: Role | "all";
  status: CircularStatus;
  body: string;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type CircularAcknowledgement = {
  id: string;
  circular_id: string;
  user_id: string;
  note: string | null;
  created_at: string;
  circulars?: Pick<Circular, "title" | "kind"> | null;
};

type LendingItem = {
  id: string;
  name: string;
  kind: LendingItemKind;
  location: string | null;
  note: string | null;
  is_active: boolean;
  is_available: boolean;
};

type LendingRequest = {
  id: string;
  item_id: string;
  user_id: string;
  purpose: string;
  status: LendingRequestStatus;
  checkout_at: string | null;
  due_at: string | null;
  returned_at: string | null;
  approved_by: string | null;
  created_at: string;
  lending_items?: Pick<LendingItem, "name" | "kind" | "location"> | null;
};

type DutyAssignment = {
  id: string;
  title: string;
  kind: DutyKind;
  status: DutyStatus;
  assignee_id: string | null;
  scheduled_date: string;
  location: string | null;
  note: string | null;
  created_by: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type WasteSchedule = {
  id: string;
  title: string;
  category: WasteCategory;
  collection_day: string;
  location: string | null;
  note: string | null;
  is_active: boolean;
};

type BulkyWasteRequest = {
  id: string;
  user_id: string;
  item_name: string;
  status: BulkyWasteStatus;
  preferred_date: string | null;
  pickup_location: string | null;
  note: string | null;
  scheduled_date: string | null;
  handled_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MeetingSession = {
  id: string;
  title: string;
  kind: MeetingKind;
  status: MeetingStatus;
  scheduled_at: string;
  location: string | null;
  note: string | null;
  created_by: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MeetingAgendaItem = {
  id: string;
  meeting_id: string;
  title: string;
  description: string;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  meeting_sessions?: Pick<MeetingSession, "title" | "status"> | null;
};

type MeetingAttendance = {
  id: string;
  meeting_id: string;
  user_id: string;
  status: MeetingAttendanceStatus;
  proxy_to: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type MeetingVote = {
  id: string;
  agenda_item_id: string;
  user_id: string;
  choice: MeetingVoteChoice;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

type InspectionPlan = {
  id: string;
  asset_id: string;
  title: string;
  frequency: InspectionFrequency;
  next_due_date: string;
  note: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  asset_items?: Pick<AssetItem, "name" | "location" | "status"> | null;
};

type InspectionRecord = {
  id: string;
  plan_id: string;
  asset_id: string;
  inspected_by: string;
  result: InspectionResult;
  inspected_at: string;
  note: string;
  maintenance_request_id: string | null;
  created_at: string;
  updated_at: string;
  inspection_plans?: Pick<InspectionPlan, "title"> | null;
  asset_items?: Pick<AssetItem, "name"> | null;
};

const page = document.body.dataset.page ?? "home";
const base = import.meta.env.BASE_URL || "/";
let currentProfile: Profile | null = null;
let eventMonth = new Date();
let bookingCalendar: CalendarInstance | null = null;
let roomsCache: Room[] = [];
let bookingsCache: Booking[] = [];
let documentFilter: DocumentStatus | "all" = "all";
let maintenanceFilter: MaintenanceStatus | "all" = "all";
let financeFilter: FinanceEntryType | "all" = "all";
let assetFilter: AssetStatus | "all" = "all";
let vendorsCache: Vendor[] = [];
let taskFilter: BoardTaskStatus | "all" = "all";
let parkingSpacesCache: ParkingSpace[] = [];
let residentRequestFilter: ResidentRequestStatus | "all" = "all";
let lendingItemsCache: LendingItem[] = [];
let dutyFilter: DutyStatus | "all" = "all";
let meetingSessionsCache: MeetingSession[] = [];
let meetingAgendaCache: MeetingAgendaItem[] = [];
let inspectionPlansCache: InspectionPlan[] = [];
let inspectionAssetsCache: AssetItem[] = [];

const roleLabels: Record<Role, string> = {
  resident: "居民",
  board_member: "理事",
  admin: "管理者",
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  rejected: "却下",
  cancelled: "取消",
};

const noticeKindLabels: Record<Notice["kind"], string> = {
  notice: "通知",
  meeting: "会議案内",
  topic: "課題",
};

const documentKindLabels: Record<DocumentKind, string> = {
  minutes: "議事録",
  rule: "規約",
  estimate: "見積",
  approval: "稟議",
  other: "その他",
};

const documentStatusLabels: Record<DocumentStatus, string> = {
  review: "審査中",
  approved: "承認済み",
  rejected: "差戻し",
  archived: "保管済み",
};

const maintenanceCategoryLabels: Record<MaintenanceCategory, string> = {
  common_area: "共用部",
  equipment: "設備",
  safety: "安全",
  cleaning: "清掃",
  other: "その他",
};

const maintenancePriorityLabels: Record<MaintenancePriority, string> = {
  normal: "通常",
  high: "高",
  urgent: "緊急",
};

const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  open: "受付中",
  in_progress: "対応中",
  resolved: "完了",
  closed: "終了",
};

const financeTypeLabels: Record<FinanceEntryType, string> = {
  income: "収入",
  expense: "支出",
};

const assetCategoryLabels: Record<AssetCategory, string> = {
  equipment: "設備",
  fixture: "備品",
  disaster: "防災",
  document: "書類",
  other: "その他",
};

const assetStatusLabels: Record<AssetStatus, string> = {
  active: "利用中",
  inspection_due: "点検予定",
  repair_needed: "修理必要",
  retired: "廃止",
};

const contractStatusLabels: Record<ContractStatus, string> = {
  active: "有効",
  renewal_due: "更新注意",
  expired: "期限切れ",
  terminated: "終了",
};

const safetyKindLabels: Record<SafetyEventKind, string> = {
  drill: "防災訓練",
  inspection: "設備点検",
  checkin: "安否確認",
  other: "その他",
};

const safetyEventStatusLabels: Record<SafetyEventStatus, string> = {
  planned: "予定",
  active: "受付中",
  completed: "完了",
  cancelled: "中止",
};

const safetyCheckinLabels: Record<SafetyCheckinStatus, string> = {
  safe: "無事",
  needs_help: "要支援",
};

const boardTaskStatusLabels: Record<BoardTaskStatus, string> = {
  open: "未着手",
  in_progress: "対応中",
  done: "完了",
  cancelled: "中止",
};

const boardTaskPriorityLabels: Record<BoardTaskPriority, string> = {
  normal: "通常",
  high: "高",
  urgent: "緊急",
};

const parkingKindLabels: Record<ParkingSpaceKind, string> = {
  car: "駐車場",
  bicycle: "駐輪場",
  motorbike: "バイク置場",
};

const parkingPermitStatusLabels: Record<ParkingPermitStatus, string> = {
  pending: "申請中",
  active: "利用中",
  rejected: "却下",
  ended: "終了",
};

const residentRequestCategoryLabels: Record<ResidentRequestCategory, string> = {
  noise: "騒音",
  rule: "生活ルール",
  neighbor: "近隣",
  common_area: "共用部",
  other: "その他",
};

const residentRequestStatusLabels: Record<ResidentRequestStatus, string> = {
  open: "受付中",
  in_progress: "対応中",
  resolved: "完了",
  closed: "終了",
};

const circularKindLabels: Record<CircularKind, string> = {
  notice: "お知らせ",
  minutes: "議事録",
  event: "行事",
  rule: "規約",
  other: "その他",
};

const circularStatusLabels: Record<CircularStatus, string> = {
  published: "公開中",
  archived: "保管済み",
};

const lendingKindLabels: Record<LendingItemKind, string> = {
  key: "鍵",
  equipment: "備品",
  document: "書類",
  other: "その他",
};

const lendingRequestStatusLabels: Record<LendingRequestStatus, string> = {
  pending: "申請中",
  checked_out: "貸出中",
  returned: "返却済み",
  rejected: "却下",
  lost: "紛失",
};

const dutyKindLabels: Record<DutyKind, string> = {
  cleaning: "清掃",
  patrol: "巡回",
  meeting: "会議準備",
  garden: "植栽",
  other: "その他",
};

const dutyStatusLabels: Record<DutyStatus, string> = {
  planned: "予定",
  done: "完了",
  missed: "未実施",
  cancelled: "中止",
};

const wasteCategoryLabels: Record<WasteCategory, string> = {
  burnable: "燃えるごみ",
  non_burnable: "燃えないごみ",
  recycle: "資源",
  oversized: "粗大ごみ",
  hazardous: "有害ごみ",
  other: "その他",
};

const bulkyWasteStatusLabels: Record<BulkyWasteStatus, string> = {
  submitted: "申請中",
  scheduled: "予約済み",
  completed: "完了",
  cancelled: "取消",
};

const meetingKindLabels: Record<MeetingKind, string> = {
  board: "理事会",
  general: "総会",
  committee: "委員会",
  other: "その他",
};

const meetingStatusLabels: Record<MeetingStatus, string> = {
  open: "公開中",
  closed: "終了",
  cancelled: "中止",
};

const meetingAttendanceStatusLabels: Record<MeetingAttendanceStatus, string> = {
  attending: "出席",
  proxy: "委任",
  absent: "欠席",
};

const meetingVoteChoiceLabels: Record<MeetingVoteChoice, string> = {
  approve: "賛成",
  reject: "反対",
  abstain: "棄権",
};

const inspectionFrequencyLabels: Record<InspectionFrequency, string> = {
  monthly: "毎月",
  quarterly: "四半期",
  semiannual: "半年",
  annual: "年次",
  ad_hoc: "随時",
};

const inspectionResultLabels: Record<InspectionResult, string> = {
  ok: "異常なし",
  watch: "経過観察",
  repair_needed: "修理必要",
  retired: "廃止",
};

const roomPalette = ["#176b5b", "#3f6fb5", "#9a5b13", "#7c3aed", "#be3455", "#2f7d32"];

const statusColors: Record<BookingStatus, { background: string; border: string; text: string }> = {
  pending: { background: "#fff4df", border: "#d68a13", text: "#6f4300" },
  approved: { background: "#e7f6ed", border: "#167044", text: "#14532d" },
  rejected: { background: "#fff0ee", border: "#b42318", text: "#7a1b12" },
  cancelled: { background: "#eef1ea", border: "#7a8476", text: "#394236" },
};

function qs<T extends HTMLElement>(selector: string) {
  return document.querySelector<T>(selector);
}

function qsa<T extends HTMLElement>(selector: string) {
  return Array.from(document.querySelectorAll<T>(selector));
}

function setText(selector: string, text: string) {
  const element = qs(selector);
  if (element) element.textContent = text;
}

function setStatus(selector: string, message: string, error = false) {
  const element = qs(selector);
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", error);
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long" }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value);
}

function canManage() {
  return currentProfile?.role === "admin" || currentProfile?.role === "board_member";
}

function isAdmin() {
  return currentProfile?.role === "admin";
}

function requireClient() {
  if (!hasSupabaseConfig || !supabase) {
    return "Supabase 環境変数が未設定です。.env の PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。";
  }
  return null;
}

function route(path: string) {
  return `${base}${path.replace(/^\//, "")}`;
}

async function init() {
  animate(".panel, .card, .page-head, .login-visual > *, .login-form-wrap", {
    opacity: [0, 1],
    translateY: [10, 0],
    delay: stagger(45),
    duration: 420,
    easing: "out(3)",
  });

  const configError = requireClient();
  if (configError) {
    setStatus("[data-status]", configError, true);
    setText("[data-user-name]", "未設定");
    setText("[data-user-role]", "Supabase 接続なし");
    return;
  }

  if (page === "login") {
    await initLogin();
    return;
  }

  const { data } = await supabase!.auth.getSession();
  if (!data.session) {
    window.location.href = route("/login/");
    return;
  }

  currentProfile = await loadProfile(data.session.user.id, data.session.user.email ?? "");
  setText("[data-user-name]", currentProfile.display_name || data.session.user.email || "ユーザー");
  setText("[data-user-role]", roleLabels[currentProfile.role]);

  qs("[data-action='sign-out']")?.addEventListener("click", async () => {
    await supabase!.auth.signOut();
    window.location.href = route("/login/");
  });

  if (page === "home") await initHome();
  if (page === "rooms") await initRooms();
  if (page === "notices") await initNotices();
  if (page === "events") await initEvents();
  if (page === "documents") await initDocuments();
  if (page === "maintenance") await initMaintenance();
  if (page === "finance") await initFinance();
  if (page === "assets") await initAssets();
  if (page === "vendors") await initVendors();
  if (page === "residents") await initResidents();
  if (page === "surveys") await initSurveys();
  if (page === "safety") await initSafety();
  if (page === "tasks") await initTasks();
  if (page === "parking") await initParking();
  if (page === "requests") await initResidentRequests();
  if (page === "circulars") await initCirculars();
  if (page === "lending") await initLending();
  if (page === "duties") await initDuties();
  if (page === "waste") await initWaste();
  if (page === "meetings") await initMeetings();
  if (page === "inspections") await initInspections();
  if (page === "admin") await initAdmin();
}

async function initLogin() {
  const { data } = await supabase!.auth.getSession();
  if (data.session) {
    window.location.href = route("/");
    return;
  }

  qs<HTMLFormElement>("[data-login-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("[data-status]", "ログイン中...");
    const { error } = await supabase!.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setStatus("[data-status]", error.message, true);
      return;
    }
    window.location.href = route("/");
  });
}

async function loadProfile(userId: string, email: string): Promise<Profile> {
  const { data, error } = await supabase!
    .from("profiles")
    .select("id, display_name, role, building, unit_number, phone, emergency_contact_name, emergency_contact_phone")
    .eq("id", userId)
    .single();

  if (!error && data) return data as Profile;

  const fallbackName = email.split("@")[0] || "ユーザー";
  const { data: inserted } = await supabase!
    .from("profiles")
    .insert({ id: userId, display_name: fallbackName, role: "resident" })
    .select("id, display_name, role, building, unit_number, phone, emergency_contact_name, emergency_contact_phone")
    .single();

  return (inserted as Profile | null) ?? {
    id: userId,
    display_name: fallbackName,
    role: "resident",
    building: null,
    unit_number: null,
    phone: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
  };
}

async function initHome() {
  const [{ data: bookings }, { data: notices }, { data: events }, { data: documents }, unread] = await Promise.all([
    supabase!
      .from("room_bookings")
      .select("id, purpose, start_at, end_at, status, rooms(name)")
      .order("start_at", { ascending: true })
      .limit(5),
    supabase!.from("notices").select("*").order("created_at", { ascending: false }).limit(5),
    supabase!.from("events").select("*").order("start_at", { ascending: true }).limit(5),
    supabase!.from("management_documents").select("id, status").eq("status", "review"),
    countUnreadNotices(),
  ]);

  const pendingBookings = (bookings ?? []).filter((booking) => booking.status === "pending").length;
  const pendingDocuments = documents?.length ?? 0;
  const now = new Date();
  const monthEvents = (events ?? []).filter((event) => {
    const date = new Date(event.start_at);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;

  setText("[data-metric='pending-bookings']", String(pendingBookings + pendingDocuments));
  setText("[data-metric='unread-notices']", String(unread));
  setText("[data-metric='month-events']", String(monthEvents));
  renderBookingList("[data-home-bookings]", (bookings ?? []) as Booking[]);
  renderNoticeList("[data-home-notices]", (notices ?? []) as Notice[], false);
  renderEventList("[data-home-events]", (events ?? []) as EventItem[]);
}

async function initRooms() {
  await loadRoomsIntoSelect();
  await initBookingCalendar();

  qs<HTMLFormElement>("[data-booking-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const roomId = String(form.get("room_id"));
    const startAt = new Date(String(form.get("start_at")));
    const endAt = new Date(String(form.get("end_at")));

    if (endAt <= startAt) {
      setStatus("[data-booking-status]", "終了時間は開始時間より後にしてください。", true);
      return;
    }

    const hasOverlap = await checkBookingOverlap(roomId, startAt.toISOString(), endAt.toISOString());
    if (hasOverlap) {
      setStatus("[data-booking-status]", "同じ時間帯に承認済み予約があります。", true);
      return;
    }

    const { error } = await supabase!.from("room_bookings").insert({
      room_id: roomId,
      user_id: currentProfile!.id,
      purpose: String(form.get("purpose")),
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: "pending",
    });

    if (error) {
      setStatus("[data-booking-status]", error.message, true);
      return;
    }

    event.currentTarget.reset();
    setStatus("[data-booking-status]", "予約申請を送信しました。");
    await refreshBookingCalendar();
  });

  qs("[data-action='close-booking-detail']")?.addEventListener("click", () => {
    qs("[data-booking-detail]")?.classList.add("hidden");
  });
}

async function loadRoomsIntoSelect() {
  const { data } = await supabase!.from("rooms").select("*").eq("is_active", true).order("name");
  roomsCache = (data ?? []) as Room[];
  const select = qs<HTMLSelectElement>("[data-room-select]");
  if (!select) return;
  select.innerHTML = roomsCache
    .map((room) => `<option value="${room.id}">${escapeHtml(room.name)}</option>`)
    .join("");
}

async function initBookingCalendar() {
  const calendarElement = qs("[data-booking-calendar]");
  if (!calendarElement) return;

  const [{ Calendar }, dayGridPlugin, timeGridPlugin, interactionPlugin, jaLocale] = await Promise.all([
    import("@fullcalendar/core"),
    import("@fullcalendar/daygrid"),
    import("@fullcalendar/timegrid"),
    import("@fullcalendar/interaction"),
    import("@fullcalendar/core/locales/ja"),
  ]);

  bookingCalendar = new Calendar(calendarElement, {
    plugins: [dayGridPlugin.default, timeGridPlugin.default, interactionPlugin.default],
    locale: jaLocale.default,
    initialView: "timeGridWeek",
    headerToolbar: false,
    height: "auto",
    nowIndicator: true,
    selectable: true,
    allDaySlot: false,
    slotMinTime: "07:00:00",
    slotMaxTime: "22:00:00",
    slotDuration: "00:30:00",
    expandRows: true,
    eventTimeFormat: {
      hour: "2-digit",
      minute: "2-digit",
      meridiem: false,
    },
    select: (selection) => {
      prefillBookingForm(selection.start, selection.end);
    },
    dateClick: (info) => {
      const end = new Date(info.date.getTime() + 60 * 60 * 1000);
      prefillBookingForm(info.date, end);
    },
    eventClick: (info) => {
      const booking = bookingsCache.find((item) => item.id === info.event.id);
      if (booking) renderBookingDetail(booking);
    },
    events: async (_info, success, failure) => {
      try {
        const bookings = await loadBookings();
        success(bookings.map(toCalendarEvent));
      } catch (error) {
        failure(error as Error);
      }
    },
    datesSet: () => syncCalendarToolbar(),
  }) as CalendarInstance;

  bookingCalendar.render();
  syncCalendarToolbar();
  bindCalendarToolbar();
  await refreshPendingBookings();
}

function bindCalendarToolbar() {
  qs("[data-calendar-action='prev']")?.addEventListener("click", () => {
    bookingCalendar?.prev();
    syncCalendarToolbar();
  });
  qs("[data-calendar-action='next']")?.addEventListener("click", () => {
    bookingCalendar?.next();
    syncCalendarToolbar();
  });
  qs("[data-calendar-action='today']")?.addEventListener("click", () => {
    bookingCalendar?.today();
    syncCalendarToolbar();
  });
  qsa<HTMLButtonElement>("[data-calendar-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.calendarView;
      if (!view) return;
      bookingCalendar?.changeView(view);
      syncCalendarToolbar();
    });
  });
}

function syncCalendarToolbar() {
  if (!bookingCalendar) return;
  const data = bookingCalendar.getCurrentData();
  setText("[data-calendar-title]", data.viewTitle);
  qsa<HTMLButtonElement>("[data-calendar-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.calendarView === data.viewApi.type);
  });
}

async function refreshBookingCalendar() {
  bookingCalendar?.refetchEvents();
  qs("[data-booking-detail]")?.classList.add("hidden");
  await refreshPendingBookings();
}

async function loadBookings() {
  const { data } = await supabase!
    .from("room_bookings")
    .select("id, room_id, user_id, purpose, start_at, end_at, status, rooms(name), profiles(display_name)")
    .order("start_at");

  bookingsCache = (data ?? []) as Booking[];
  return bookingsCache;
}

async function refreshPendingBookings() {
  if (!bookingsCache.length) await loadBookings();
  renderPendingBookings(bookingsCache.filter((booking) => booking.status === "pending"));
}

function toCalendarEvent(booking: Booking) {
  const colors = statusColors[booking.status];
  const roomColor = roomColorFor(booking.room_id);
  return {
    id: booking.id,
    title: `${booking.rooms?.name ?? "会議室"} / ${booking.purpose}`,
    start: booking.start_at,
    end: booking.end_at,
    backgroundColor: colors.background,
    borderColor: booking.status === "approved" ? roomColor : colors.border,
    textColor: colors.text,
    extendedProps: {
      status: booking.status,
      roomId: booking.room_id,
      applicant: booking.profiles?.display_name ?? "申請者",
      purpose: booking.purpose,
    },
  };
}

function roomColorFor(roomId: string) {
  const index = roomsCache.findIndex((room) => room.id === roomId);
  return roomPalette[Math.max(index, 0) % roomPalette.length];
}

function prefillBookingForm(start: Date, end: Date) {
  const startInput = qs<HTMLInputElement>("#start-at");
  const endInput = qs<HTMLInputElement>("#end-at");
  if (startInput) startInput.value = toDateTimeLocal(start);
  if (endInput) endInput.value = toDateTimeLocal(end);
  setStatus("[data-booking-status]", "選択した時間を予約申請に反映しました。");
  qs("[data-booking-form]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function toDateTimeLocal(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function renderBookingDetail(booking: Booking) {
  const detail = qs("[data-booking-detail]");
  const body = qs("[data-booking-detail-body]");
  const actions = qs("[data-booking-detail-actions]");
  if (!detail || !body || !actions) return;

  body.innerHTML = `
    <div class="detail-stack">
      <div>
        <span class="meta">会議室</span>
        <strong>${escapeHtml(booking.rooms?.name ?? "会議室")}</strong>
      </div>
      <div>
        <span class="meta">時間</span>
        <strong>${formatDateTime(booking.start_at)} - ${formatDateTime(booking.end_at)}</strong>
      </div>
      <div>
        <span class="meta">申請者</span>
        <strong>${escapeHtml(booking.profiles?.display_name ?? "申請者")}</strong>
      </div>
      <div>
        <span class="meta">状態</span>
        ${statusBadge(booking.status)}
      </div>
      <div>
        <span class="meta">利用目的</span>
        <p>${escapeHtml(booking.purpose)}</p>
      </div>
    </div>
  `;

  actions.classList.toggle("hidden", !canManage() || booking.status !== "pending");
  qs<HTMLButtonElement>("[data-detail-approve]")!.onclick = () => updateBookingStatus(booking.id, "approved");
  qs<HTMLButtonElement>("[data-detail-reject]")!.onclick = () => updateBookingStatus(booking.id, "rejected");
  detail.classList.remove("hidden");
}

function renderPendingBookings(bookings: Booking[]) {
  const container = qs("[data-pending-bookings]");
  if (!container) return;
  if (!bookings.length) {
    container.innerHTML = `<p class="meta">承認待ち予約はありません。</p>`;
    return;
  }
  container.innerHTML = bookings
    .map(
      (booking) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(booking.rooms?.name ?? "会議室")}</strong>
              <p class="meta">${formatDateTime(booking.start_at)} - ${formatDateTime(booking.end_at)} / ${escapeHtml(booking.profiles?.display_name ?? "申請者")}</p>
            </div>
            ${statusBadge(booking.status)}
          </div>
          <p>${escapeHtml(booking.purpose)}</p>
          ${
            canManage()
              ? `<div class="toolbar">
                  <button class="button" type="button" data-booking-approve="${booking.id}">承認</button>
                  <button class="button danger" type="button" data-booking-reject="${booking.id}">却下</button>
                </div>`
              : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-booking-approve]").forEach((button) => {
    button.addEventListener("click", () => updateBookingStatus(button.dataset.bookingApprove!, "approved"));
  });
  qsa<HTMLButtonElement>("[data-booking-reject]").forEach((button) => {
    button.addEventListener("click", () => updateBookingStatus(button.dataset.bookingReject!, "rejected"));
  });
}

async function updateBookingStatus(id: string, status: BookingStatus) {
  const { error } = await supabase!
    .from("room_bookings")
    .update({ status, approved_by: currentProfile!.id, approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await refreshBookingCalendar();
}

async function checkBookingOverlap(roomId: string, startAt: string, endAt: string) {
  const { data } = await supabase!
    .from("room_bookings")
    .select("id")
    .eq("room_id", roomId)
    .eq("status", "approved")
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .limit(1);
  return Boolean(data?.length);
}

async function initNotices() {
  qs("[data-notice-form]")?.classList.toggle("hidden", !canManage());
  await renderNoticesPage();

  qs<HTMLFormElement>("[data-notice-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("notices").insert({
      title: String(form.get("title")),
      body: String(form.get("body")),
      kind: String(form.get("kind")),
      target_role: String(form.get("target_role")),
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-notice-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-notice-status]", "通知を発行しました。");
    await renderNoticesPage();
  });
}

async function renderNoticesPage() {
  const { data } = await supabase!.from("notices").select("*").order("created_at", { ascending: false });
  renderNoticeList("[data-notice-list]", (data ?? []) as Notice[], true);
}

function renderNoticeList(selector: string, notices: Notice[], canMarkRead: boolean) {
  const container = qs(selector);
  if (!container) return;
  if (!notices.length) {
    container.innerHTML = `<p class="meta">通知はありません。</p>`;
    return;
  }
  container.innerHTML = notices
    .map(
      (notice) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(notice.title)}</strong>
              <p class="meta">${noticeKindLabels[notice.kind]} / ${formatDateTime(notice.created_at)} / ${escapeHtml(notice.target_role)}</p>
            </div>
            <span class="badge">${escapeHtml(noticeKindLabels[notice.kind])}</span>
          </div>
          <p>${escapeHtml(notice.body)}</p>
          ${canMarkRead ? `<button class="button secondary" type="button" data-notice-read="${notice.id}">既読にする</button>` : ""}
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-notice-read]").forEach((button) => {
    button.addEventListener("click", async () => {
      await supabase!.from("notice_reads").upsert({
        notice_id: button.dataset.noticeRead,
        user_id: currentProfile!.id,
        read_at: new Date().toISOString(),
      });
      button.textContent = "既読";
      button.disabled = true;
    });
  });
}

async function countUnreadNotices() {
  const { data: notices } = await supabase!.from("notices").select("id");
  const { data: reads } = await supabase!.from("notice_reads").select("notice_id").eq("user_id", currentProfile!.id);
  const readIds = new Set((reads ?? []).map((read) => read.notice_id));
  return (notices ?? []).filter((notice) => !readIds.has(notice.id)).length;
}

async function initEvents() {
  qs("[data-event-form]")?.classList.toggle("hidden", !canManage());
  await renderEventsPage();

  qs("[data-action='prev-event-month']")?.addEventListener("click", async () => {
    eventMonth = new Date(eventMonth.getFullYear(), eventMonth.getMonth() - 1, 1);
    await renderEventsPage();
  });
  qs("[data-action='next-event-month']")?.addEventListener("click", async () => {
    eventMonth = new Date(eventMonth.getFullYear(), eventMonth.getMonth() + 1, 1);
    await renderEventsPage();
  });

  qs<HTMLFormElement>("[data-event-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("events").insert({
      title: String(form.get("title")),
      description: String(form.get("description") || ""),
      location: String(form.get("location") || ""),
      start_at: new Date(String(form.get("start_at"))).toISOString(),
      end_at: form.get("end_at") ? new Date(String(form.get("end_at"))).toISOString() : null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-event-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-event-status]", "行事を保存しました。");
    await renderEventsPage();
  });
}

async function renderEventsPage() {
  setText("[data-event-month]", formatMonth(eventMonth));
  const { data } = await supabase!.from("events").select("*").order("start_at");
  const events = (data ?? []) as EventItem[];
  renderEventList("[data-event-list]", events);
  renderCalendar("[data-event-calendar]", eventMonth, events, (event) => {
    return `${formatDateTime(event.start_at)} ${escapeHtml(event.title)}`;
  });
}

function renderEventList(selector: string, events: EventItem[]) {
  const container = qs(selector);
  if (!container) return;
  if (!events.length) {
    container.innerHTML = `<p class="meta">行事はありません。</p>`;
    return;
  }
  container.innerHTML = events
    .map(
      (event) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(event.title)}</strong>
              <p class="meta">${formatDateTime(event.start_at)}${event.location ? ` / ${escapeHtml(event.location)}` : ""}</p>
            </div>
          </div>
          ${event.description ? `<p>${escapeHtml(event.description)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

async function initDocuments() {
  qs("[data-document-form]")?.classList.toggle("hidden", !canManage());
  await renderDocumentsPage();

  qsa<HTMLButtonElement>("[data-document-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      documentFilter = (button.dataset.documentFilter as DocumentStatus | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-document-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      await renderDocumentsPage();
    });
  });

  qs<HTMLFormElement>("[data-document-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("management_documents").insert({
      title: String(form.get("title")),
      kind: String(form.get("kind")),
      version: String(form.get("version") || "1.0"),
      summary: String(form.get("summary")),
      file_url: String(form.get("file_url") || "") || null,
      status: "review",
      created_by: currentProfile!.id,
      updated_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-document-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    const version = qs<HTMLInputElement>("#document-version");
    if (version) version.value = "1.0";
    setStatus("[data-document-status]", "文書を審査へ回しました。");
    await renderDocumentsPage();
  });
}

async function renderDocumentsPage() {
  let query = supabase!
    .from("management_documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (documentFilter !== "all") query = query.eq("status", documentFilter);

  const [{ data: documents }, { data: approvals }, { data: seals }] = await Promise.all([
    query,
    supabase!
      .from("document_approvals")
      .select("*, management_documents(title, version), profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase!
      .from("document_seals")
      .select("*, management_documents(title, version), profiles(display_name)")
      .order("sealed_at", { ascending: false })
      .limit(8),
  ]);

  const allDocuments = (documents ?? []) as ManagementDocument[];
  setText("[data-metric='review-documents']", String(allDocuments.filter((document) => document.status === "review").length));
  setText("[data-metric='approved-documents']", String(allDocuments.filter((document) => document.status === "approved").length));
  setText("[data-metric='sealed-documents']", String((seals ?? []).length));
  renderDocumentList(allDocuments);
  renderDocumentApprovals((approvals ?? []) as DocumentApproval[]);
  renderDocumentSeals((seals ?? []) as DocumentSeal[]);
}

function renderDocumentList(documents: ManagementDocument[]) {
  const container = qs("[data-document-list]");
  if (!container) return;
  if (!documents.length) {
    container.innerHTML = `<p class="meta">文書はありません。</p>`;
    return;
  }

  container.innerHTML = documents
    .map(
      (document) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(document.title)}</strong>
              <p class="meta">${documentKindLabels[document.kind]} / v${escapeHtml(document.version)} / ${formatDateTime(document.updated_at)}</p>
            </div>
            ${documentStatusBadge(document.status)}
          </div>
          <p>${escapeHtml(document.summary)}</p>
          <p class="meta">登録者 ${escapeHtml(document.profiles?.display_name ?? "管理者")}${document.file_url ? ` / <a class="text-link" href="${escapeHtml(document.file_url)}" target="_blank" rel="noreferrer">参照ファイル</a>` : ""}</p>
          ${
            canManage()
              ? `<div class="toolbar">
                  ${
                    document.status === "review"
                      ? `<button class="button" type="button" data-document-approve="${document.id}">承認</button>
                         <button class="button danger" type="button" data-document-reject="${document.id}">差戻し</button>`
                      : ""
                  }
                  ${
                    document.status === "approved"
                      ? `<button class="button secondary" type="button" data-document-seal="${document.id}">電子印影</button>`
                      : ""
                  }
                  <button class="button secondary" type="button" data-document-archive="${document.id}">保管</button>
                </div>`
              : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-document-approve]").forEach((button) => {
    button.addEventListener("click", () => updateDocumentStatus(button.dataset.documentApprove!, "approved"));
  });
  qsa<HTMLButtonElement>("[data-document-reject]").forEach((button) => {
    button.addEventListener("click", () => updateDocumentStatus(button.dataset.documentReject!, "rejected"));
  });
  qsa<HTMLButtonElement>("[data-document-archive]").forEach((button) => {
    button.addEventListener("click", () => updateDocumentStatus(button.dataset.documentArchive!, "archived"));
  });
  qsa<HTMLButtonElement>("[data-document-seal]").forEach((button) => {
    button.addEventListener("click", () => sealDocument(button.dataset.documentSeal!));
  });
}

async function updateDocumentStatus(id: string, status: DocumentStatus) {
  const approvedAt = status === "approved" ? new Date().toISOString() : null;
  const { error } = await supabase!
    .from("management_documents")
    .update({ status, updated_by: currentProfile!.id, approved_at: approvedAt })
    .eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }

  if (status === "approved" || status === "rejected") {
    await supabase!.from("document_approvals").insert({
      document_id: id,
      actor_id: currentProfile!.id,
      action: status,
      comment: status === "approved" ? "承認しました。" : "差戻しました。",
    });
  }

  await renderDocumentsPage();
}

async function sealDocument(id: string) {
  const sealName = currentProfile?.role === "admin" ? "管理者印" : "理事印";
  const { error } = await supabase!.from("document_seals").insert({
    document_id: id,
    sealed_by: currentProfile!.id,
    seal_name: sealName,
    note: "承認済み文書へ電子印影を付与しました。",
  });
  if (error) {
    alert(error.message);
    return;
  }
  await renderDocumentsPage();
}

function renderDocumentApprovals(approvals: DocumentApproval[]) {
  const container = qs("[data-document-approvals]");
  if (!container) return;
  if (!approvals.length) {
    container.innerHTML = `<p class="meta">承認履歴はありません。</p>`;
    return;
  }
  container.innerHTML = approvals
    .map(
      (approval) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(approval.management_documents?.title ?? "文書")}</strong>
              <p class="meta">v${escapeHtml(approval.management_documents?.version ?? "-")} / ${formatDateTime(approval.created_at)} / ${escapeHtml(approval.profiles?.display_name ?? "担当者")}</p>
            </div>
            <span class="badge ${approval.action === "approved" ? "success" : "danger"}">${approval.action === "approved" ? "承認" : "差戻し"}</span>
          </div>
          ${approval.comment ? `<p>${escapeHtml(approval.comment)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

function renderDocumentSeals(seals: DocumentSeal[]) {
  const container = qs("[data-document-seals]");
  if (!container) return;
  if (!seals.length) {
    container.innerHTML = `<p class="meta">電子印影履歴はありません。</p>`;
    return;
  }
  container.innerHTML = seals
    .map(
      (seal) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(seal.management_documents?.title ?? "文書")}</strong>
              <p class="meta">v${escapeHtml(seal.management_documents?.version ?? "-")} / ${formatDateTime(seal.sealed_at)} / ${escapeHtml(seal.profiles?.display_name ?? "担当者")}</p>
            </div>
            <span class="seal-mark">${escapeHtml(seal.seal_name)}</span>
          </div>
          ${seal.note ? `<p>${escapeHtml(seal.note)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

async function initMaintenance() {
  await renderMaintenancePage();

  qsa<HTMLButtonElement>("[data-maintenance-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      maintenanceFilter = (button.dataset.maintenanceFilter as MaintenanceStatus | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-maintenance-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      await renderMaintenancePage();
    });
  });

  qs<HTMLFormElement>("[data-maintenance-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("maintenance_requests").insert({
      title: String(form.get("title")),
      category: String(form.get("category")),
      priority: String(form.get("priority")),
      location: String(form.get("location")),
      description: String(form.get("description")),
      requester_id: currentProfile!.id,
      status: "open",
    });
    if (error) {
      setStatus("[data-maintenance-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-maintenance-status]", "修繕依頼を受け付けました。");
    await renderMaintenancePage();
  });
}

async function renderMaintenancePage() {
  let query = supabase!
    .from("maintenance_requests")
    .select("*")
    .order("updated_at", { ascending: false });

  if (maintenanceFilter !== "all") query = query.eq("status", maintenanceFilter);

  const { data } = await query;
  const requests = (data ?? []) as MaintenanceRequest[];
  setText("[data-metric='maintenance-open']", String(requests.filter((item) => item.status === "open").length));
  setText("[data-metric='maintenance-progress']", String(requests.filter((item) => item.status === "in_progress").length));
  setText("[data-metric='maintenance-done']", String(requests.filter((item) => item.status === "resolved" || item.status === "closed").length));
  renderMaintenanceList(requests);
}

function renderMaintenanceList(requests: MaintenanceRequest[]) {
  const container = qs("[data-maintenance-list]");
  if (!container) return;
  if (!requests.length) {
    container.innerHTML = `<p class="meta">修繕依頼はありません。</p>`;
    return;
  }

  container.innerHTML = requests
    .map(
      (request) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(request.title)}</strong>
              <p class="meta">${maintenanceCategoryLabels[request.category]} / ${maintenancePriorityLabels[request.priority]} / ${escapeHtml(request.location)} / ${formatDateTime(request.updated_at)}</p>
            </div>
            ${maintenanceStatusBadge(request.status)}
          </div>
          <p>${escapeHtml(request.description)}</p>
          ${request.handler_note ? `<p class="meta">対応メモ: ${escapeHtml(request.handler_note)}</p>` : ""}
          ${
            canManage()
              ? `<div class="toolbar">
                  <button class="button secondary" type="button" data-maintenance-progress="${request.id}">対応中</button>
                  <button class="button" type="button" data-maintenance-resolve="${request.id}">完了</button>
                  <button class="button danger" type="button" data-maintenance-close="${request.id}">終了</button>
                </div>`
              : request.requester_id === currentProfile?.id && request.status === "open"
                ? `<div class="toolbar"><button class="button secondary" type="button" data-maintenance-close="${request.id}">取り下げ</button></div>`
                : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-maintenance-progress]").forEach((button) => {
    button.addEventListener("click", () => updateMaintenanceStatus(button.dataset.maintenanceProgress!, "in_progress"));
  });
  qsa<HTMLButtonElement>("[data-maintenance-resolve]").forEach((button) => {
    button.addEventListener("click", () => updateMaintenanceStatus(button.dataset.maintenanceResolve!, "resolved"));
  });
  qsa<HTMLButtonElement>("[data-maintenance-close]").forEach((button) => {
    button.addEventListener("click", () => updateMaintenanceStatus(button.dataset.maintenanceClose!, "closed"));
  });
}

async function updateMaintenanceStatus(id: string, status: MaintenanceStatus) {
  const patch: Record<string, string | null> = { status };
  if (canManage()) {
    patch.handled_by = currentProfile!.id;
    patch.handler_note =
      status === "in_progress" ? "対応を開始しました。" : status === "resolved" ? "対応を完了しました。" : "受付を終了しました。";
  }
  if (status === "resolved") patch.resolved_at = new Date().toISOString();

  const { error } = await supabase!.from("maintenance_requests").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderMaintenancePage();
}

async function initFinance() {
  qs("[data-finance-form]")?.classList.toggle("hidden", !canManage());
  const dateInput = qs<HTMLInputElement>("#finance-entry-date");
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  await renderFinancePage();

  qsa<HTMLButtonElement>("[data-finance-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      financeFilter = (button.dataset.financeFilter as FinanceEntryType | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-finance-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      await renderFinancePage();
    });
  });

  qs<HTMLFormElement>("[data-finance-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("finance_entries").insert({
      title: String(form.get("title")),
      entry_type: String(form.get("entry_type")),
      category: String(form.get("category")),
      amount: Number(form.get("amount") || 0),
      entry_date: String(form.get("entry_date")),
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-finance-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    setStatus("[data-finance-status]", "台帳に記録しました。");
    await renderFinancePage();
  });
}

async function renderFinancePage() {
  let query = supabase!
    .from("finance_entries")
    .select("*, profiles(display_name)")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (financeFilter !== "all") query = query.eq("entry_type", financeFilter);

  const { data } = await query;
  const entries = (data ?? []) as FinanceEntry[];
  const income = entries.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  setText("[data-metric='finance-income']", formatCurrency(income));
  setText("[data-metric='finance-expense']", formatCurrency(expense));
  setText("[data-metric='finance-balance']", formatCurrency(income - expense));
  renderFinanceList(entries);
}

function renderFinanceList(entries: FinanceEntry[]) {
  const container = qs("[data-finance-list]");
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = `<p class="meta">台帳記録はありません。</p>`;
    return;
  }
  container.innerHTML = entries
    .map(
      (entry) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(entry.title)}</strong>
              <p class="meta">${escapeHtml(entry.entry_date)} / ${escapeHtml(entry.category)} / ${escapeHtml(entry.profiles?.display_name ?? "担当者")}</p>
            </div>
            <span class="amount ${entry.entry_type}">${entry.entry_type === "income" ? "+" : "-"}${formatCurrency(entry.amount)}</span>
          </div>
          ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}
          <span class="badge ${entry.entry_type === "income" ? "success" : "warning"}">${financeTypeLabels[entry.entry_type]}</span>
        </article>
      `,
    )
    .join("");
}

async function initAssets() {
  qs("[data-asset-form]")?.classList.toggle("hidden", !canManage());
  await renderAssetsPage();

  qsa<HTMLButtonElement>("[data-asset-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      assetFilter = (button.dataset.assetFilter as AssetStatus | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-asset-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      await renderAssetsPage();
    });
  });

  qs<HTMLFormElement>("[data-asset-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("asset_items").insert({
      name: String(form.get("name")),
      category: String(form.get("category")),
      status: String(form.get("status")),
      location: String(form.get("location")),
      inspection_due_at: String(form.get("inspection_due_at") || "") || null,
      note: String(form.get("note") || "") || null,
      managed_by: currentProfile!.id,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-asset-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-asset-status]", "資産を登録しました。");
    await renderAssetsPage();
  });
}

async function renderAssetsPage() {
  let query = supabase!.from("asset_items").select("*").order("updated_at", { ascending: false });
  if (assetFilter !== "all") query = query.eq("status", assetFilter);
  const { data } = await query;
  const assets = (data ?? []) as AssetItem[];
  const today = new Date().toISOString().slice(0, 10);

  setText("[data-metric='asset-total']", String(assets.length));
  setText("[data-metric='asset-due']", String(assets.filter((asset) => asset.inspection_due_at && asset.inspection_due_at <= today).length));
  setText("[data-metric='asset-attention']", String(assets.filter((asset) => asset.status === "repair_needed").length));
  renderAssetList(assets);
}

function renderAssetList(assets: AssetItem[]) {
  const container = qs("[data-asset-list]");
  if (!container) return;
  if (!assets.length) {
    container.innerHTML = `<p class="meta">資産はありません。</p>`;
    return;
  }
  container.innerHTML = assets
    .map(
      (asset) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(asset.name)}</strong>
              <p class="meta">${assetCategoryLabels[asset.category]} / ${escapeHtml(asset.location)}${asset.inspection_due_at ? ` / 点検 ${escapeHtml(asset.inspection_due_at)}` : ""}</p>
            </div>
            ${assetStatusBadge(asset.status)}
          </div>
          ${asset.note ? `<p>${escapeHtml(asset.note)}</p>` : ""}
          ${
            canManage()
              ? `<div class="toolbar">
                  <button class="button secondary" type="button" data-asset-inspection="${asset.id}">点検予定</button>
                  <button class="button danger" type="button" data-asset-repair="${asset.id}">修理必要</button>
                  <button class="button" type="button" data-asset-active="${asset.id}">利用中</button>
                </div>`
              : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-asset-inspection]").forEach((button) => {
    button.addEventListener("click", () => updateAssetStatus(button.dataset.assetInspection!, "inspection_due"));
  });
  qsa<HTMLButtonElement>("[data-asset-repair]").forEach((button) => {
    button.addEventListener("click", () => updateAssetStatus(button.dataset.assetRepair!, "repair_needed"));
  });
  qsa<HTMLButtonElement>("[data-asset-active]").forEach((button) => {
    button.addEventListener("click", () => updateAssetStatus(button.dataset.assetActive!, "active"));
  });
}

async function updateAssetStatus(id: string, status: AssetStatus) {
  const { error } = await supabase!.from("asset_items").update({ status, managed_by: currentProfile!.id }).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderAssetsPage();
}

async function initVendors() {
  qs("[data-vendor-form]")?.classList.toggle("hidden", !canManage());
  qs("[data-contract-form]")?.classList.toggle("hidden", !canManage());
  await renderVendorsPage();

  qs<HTMLFormElement>("[data-vendor-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("vendors").insert({
      name: String(form.get("name")),
      category: String(form.get("category")),
      contact_name: String(form.get("contact_name") || "") || null,
      phone: String(form.get("phone") || "") || null,
      email: String(form.get("email") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-vendor-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-vendor-status]", "業者を登録しました。");
    await renderVendorsPage();
  });

  qs<HTMLFormElement>("[data-contract-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const endDate = String(form.get("end_date"));
    const { error } = await supabase!.from("vendor_contracts").insert({
      vendor_id: String(form.get("vendor_id")),
      title: String(form.get("title")),
      start_date: String(form.get("start_date")),
      end_date: endDate,
      amount: form.get("amount") ? Number(form.get("amount")) : null,
      status: contractStatusFromEndDate(endDate),
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-contract-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-contract-status]", "契約を保存しました。");
    await renderVendorsPage();
  });
}

async function renderVendorsPage() {
  const [{ data: vendors }, { data: contracts }] = await Promise.all([
    supabase!.from("vendors").select("*").order("name"),
    supabase!.from("vendor_contracts").select("*, vendors(name)").order("end_date", { ascending: true }),
  ]);
  vendorsCache = (vendors ?? []) as Vendor[];
  const contractItems = (contracts ?? []) as VendorContract[];
  setText("[data-metric='vendor-total']", String(vendorsCache.length));
  setText("[data-metric='contract-active']", String(contractItems.filter((contract) => contract.status === "active").length));
  setText("[data-metric='contract-renewal']", String(contractItems.filter((contract) => contract.status === "renewal_due").length));
  renderVendorSelect();
  renderVendorList(vendorsCache);
  renderContractList(contractItems);
}

function renderVendorSelect() {
  const select = qs<HTMLSelectElement>("[data-contract-vendor-select]");
  if (!select) return;
  select.innerHTML = vendorsCache.map((vendor) => `<option value="${vendor.id}">${escapeHtml(vendor.name)}</option>`).join("");
}

function renderVendorList(vendors: Vendor[]) {
  const container = qs("[data-vendor-list]");
  if (!container) return;
  if (!vendors.length) {
    container.innerHTML = `<p class="meta">業者はありません。</p>`;
    return;
  }
  container.innerHTML = vendors
    .map(
      (vendor) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(vendor.name)}</strong>
              <p class="meta">${escapeHtml(vendor.category)}${vendor.contact_name ? ` / ${escapeHtml(vendor.contact_name)}` : ""}</p>
            </div>
            <span class="badge ${vendor.is_active ? "success" : "danger"}">${vendor.is_active ? "有効" : "停止"}</span>
          </div>
          <p class="meta">${[vendor.phone, vendor.email].filter(Boolean).map(escapeHtml).join(" / ") || "連絡先未登録"}</p>
          ${vendor.note ? `<p>${escapeHtml(vendor.note)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

function renderContractList(contracts: VendorContract[]) {
  const container = qs("[data-contract-list]");
  if (!container) return;
  if (!contracts.length) {
    container.innerHTML = `<p class="meta">契約はありません。</p>`;
    return;
  }
  container.innerHTML = contracts
    .map(
      (contract) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(contract.title)}</strong>
              <p class="meta">${escapeHtml(contract.vendors?.name ?? "業者")} / ${escapeHtml(contract.start_date)} - ${escapeHtml(contract.end_date)}</p>
            </div>
            ${contractStatusBadge(contract.status)}
          </div>
          <p class="meta">契約金額 ${contract.amount == null ? "-" : formatCurrency(contract.amount)}</p>
        </article>
      `,
    )
    .join("");
}

function contractStatusFromEndDate(endDate: string): ContractStatus {
  const end = new Date(`${endDate}T00:00:00`);
  const now = new Date();
  const renewalThreshold = new Date();
  renewalThreshold.setDate(now.getDate() + 60);
  if (end < now) return "expired";
  if (end <= renewalThreshold) return "renewal_due";
  return "active";
}

async function initResidents() {
  fillResidentForm();
  await renderResidentsPage();

  qs<HTMLFormElement>("[data-resident-profile-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { data, error } = await supabase!
      .from("profiles")
      .update({
        display_name: String(form.get("display_name")),
        phone: String(form.get("phone") || "") || null,
        building: String(form.get("building") || "") || null,
        unit_number: String(form.get("unit_number") || "") || null,
        emergency_contact_name: String(form.get("emergency_contact_name") || "") || null,
        emergency_contact_phone: String(form.get("emergency_contact_phone") || "") || null,
      })
      .eq("id", currentProfile!.id)
      .select("id, display_name, role, building, unit_number, phone, emergency_contact_name, emergency_contact_phone")
      .single();

    if (error) {
      setStatus("[data-resident-status]", error.message, true);
      return;
    }

    currentProfile = data as Profile;
    setText("[data-user-name]", currentProfile.display_name || "ユーザー");
    setStatus("[data-resident-status]", "連絡先を更新しました。");
    await renderResidentsPage();
  });
}

function fillResidentForm() {
  const fields: Record<string, string | null | undefined> = {
    display_name: currentProfile?.display_name,
    phone: currentProfile?.phone,
    building: currentProfile?.building,
    unit_number: currentProfile?.unit_number,
    emergency_contact_name: currentProfile?.emergency_contact_name,
    emergency_contact_phone: currentProfile?.emergency_contact_phone,
  };
  Object.entries(fields).forEach(([name, value]) => {
    const input = qs<HTMLInputElement>(`[data-resident-profile-form] [name="${name}"]`);
    if (input) input.value = value ?? "";
  });
}

async function renderResidentsPage() {
  const { data } = await supabase!
    .from("profiles")
    .select("id, display_name, role, building, unit_number, phone, emergency_contact_name, emergency_contact_phone")
    .order("building")
    .order("unit_number");
  const profiles = (data ?? []) as Profile[];
  setText("[data-metric='resident-total']", String(profiles.length));
  setText("[data-metric='resident-contacted']", String(profiles.filter((profile) => profile.phone).length));
  setText("[data-metric='resident-missing']", String(profiles.filter((profile) => !profile.phone || !profile.building || !profile.unit_number).length));
  renderResidentList(profiles);
}

function renderResidentList(profiles: Profile[]) {
  const container = qs("[data-resident-list]");
  if (!container) return;
  if (!profiles.length) {
    container.innerHTML = `<p class="meta">名簿データはありません。</p>`;
    return;
  }
  container.innerHTML = profiles
    .map(
      (profile) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(profile.display_name ?? "ユーザー")}</strong>
              <p class="meta">${escapeHtml(profile.building ?? "-")} ${escapeHtml(profile.unit_number ?? "-")} / ${roleLabels[profile.role]}</p>
            </div>
            <span class="badge ${profile.phone ? "success" : "warning"}">${profile.phone ? "連絡可" : "要確認"}</span>
          </div>
          <p class="meta">電話 ${escapeHtml(profile.phone ?? "-")} / 緊急 ${escapeHtml(profile.emergency_contact_name ?? "-")} ${escapeHtml(profile.emergency_contact_phone ?? "")}</p>
        </article>
      `,
    )
    .join("");
}

async function initSurveys() {
  qs("[data-survey-form]")?.classList.toggle("hidden", !canManage());
  await renderSurveysPage();

  qs<HTMLFormElement>("[data-survey-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const options = String(form.get("options"))
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);

    if (options.length < 2) {
      setStatus("[data-survey-status]", "選択肢は2つ以上入力してください。", true);
      return;
    }

    const closesAt = String(form.get("closes_at") || "");
    const { error } = await supabase!.from("surveys").insert({
      title: String(form.get("title")),
      question: String(form.get("question")),
      options,
      closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-survey-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-survey-status]", "意見募集を作成しました。");
    await renderSurveysPage();
  });
}

async function renderSurveysPage() {
  const [{ data: surveys }, { data: responses }] = await Promise.all([
    supabase!.from("surveys").select("*").order("created_at", { ascending: false }),
    supabase!.from("survey_responses").select("*").order("created_at", { ascending: false }),
  ]);
  const surveyItems = (surveys ?? []) as Survey[];
  const responseItems = (responses ?? []) as SurveyResponse[];
  const myResponses = responseItems.filter((response) => response.user_id === currentProfile!.id);
  setText("[data-metric='survey-open']", String(surveyItems.filter(isSurveyOpen).length));
  setText("[data-metric='survey-answered']", String(myResponses.length));
  setText("[data-metric='survey-closed']", String(surveyItems.filter((survey) => !isSurveyOpen(survey)).length));
  renderSurveyList(surveyItems, responseItems);
}

function renderSurveyList(surveys: Survey[], responses: SurveyResponse[]) {
  const container = qs("[data-survey-list]");
  if (!container) return;
  if (!surveys.length) {
    container.innerHTML = `<p class="meta">意見募集はありません。</p>`;
    return;
  }
  container.innerHTML = surveys
    .map((survey) => {
      const surveyResponses = responses.filter((response) => response.survey_id === survey.id);
      const myResponse = surveyResponses.find((response) => response.user_id === currentProfile!.id);
      const open = isSurveyOpen(survey);
      return `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(survey.title)}</strong>
              <p class="meta">${survey.closes_at ? `締切 ${formatDateTime(survey.closes_at)} / ` : ""}${surveyResponses.length} 件回答</p>
            </div>
            <span class="badge ${open ? "success" : "danger"}">${open ? "受付中" : "締切"}</span>
          </div>
          <p>${escapeHtml(survey.question)}</p>
          <div class="survey-options">
            ${survey.options
              .map((option) => {
                const count = surveyResponses.filter((response) => response.option_value === option).length;
                return `
                  <button class="button ${myResponse?.option_value === option ? "" : "secondary"}" type="button" data-survey-answer="${survey.id}" data-survey-option="${escapeHtml(option)}" ${open ? "" : "disabled"}>
                    ${escapeHtml(option)}${canManage() ? ` (${count})` : ""}
                  </button>
                `;
              })
              .join("")}
          </div>
          ${myResponse ? `<p class="meta">あなたの回答: ${escapeHtml(myResponse.option_value)}</p>` : ""}
          ${canManage() && open ? `<button class="button danger" type="button" data-survey-close="${survey.id}">締切る</button>` : ""}
        </article>
      `;
    })
    .join("");

  qsa<HTMLButtonElement>("[data-survey-answer]").forEach((button) => {
    button.addEventListener("click", () => answerSurvey(button.dataset.surveyAnswer!, button.dataset.surveyOption!));
  });
  qsa<HTMLButtonElement>("[data-survey-close]").forEach((button) => {
    button.addEventListener("click", () => closeSurvey(button.dataset.surveyClose!));
  });
}

async function answerSurvey(surveyId: string, optionValue: string) {
  const { error } = await supabase!.from("survey_responses").upsert(
    {
      survey_id: surveyId,
      user_id: currentProfile!.id,
      option_value: optionValue,
    },
    { onConflict: "survey_id,user_id" },
  );
  if (error) {
    alert(error.message);
    return;
  }
  await renderSurveysPage();
}

async function closeSurvey(id: string) {
  const { error } = await supabase!.from("surveys").update({ is_open: false }).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderSurveysPage();
}

function isSurveyOpen(survey: Survey) {
  return survey.is_open && (!survey.closes_at || new Date(survey.closes_at) > new Date());
}

async function initSafety() {
  qs("[data-safety-form]")?.classList.toggle("hidden", !canManage());
  await renderSafetyPage();

  qs<HTMLFormElement>("[data-safety-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("safety_events").insert({
      title: String(form.get("title")),
      kind: String(form.get("kind")),
      status: String(form.get("status")),
      scheduled_at: new Date(String(form.get("scheduled_at"))).toISOString(),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-safety-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-safety-status]", "防災・安否イベントを登録しました。");
    await renderSafetyPage();
  });
}

async function renderSafetyPage() {
  const [{ data: events }, { data: checkins }] = await Promise.all([
    supabase!.from("safety_events").select("*").order("scheduled_at", { ascending: false }),
    supabase!.from("safety_checkins").select("*").order("created_at", { ascending: false }),
  ]);
  const safetyEvents = (events ?? []) as SafetyEvent[];
  const safetyCheckins = (checkins ?? []) as SafetyCheckin[];
  setText("[data-metric='safety-planned']", String(safetyEvents.filter((event) => event.status === "planned").length));
  setText("[data-metric='safety-confirmed']", String(safetyCheckins.filter((checkin) => checkin.status === "safe").length));
  setText("[data-metric='safety-help']", String(safetyCheckins.filter((checkin) => checkin.status === "needs_help").length));
  renderSafetyList(safetyEvents, safetyCheckins);
}

function renderSafetyList(events: SafetyEvent[], checkins: SafetyCheckin[]) {
  const container = qs("[data-safety-list]");
  if (!container) return;
  if (!events.length) {
    container.innerHTML = `<p class="meta">防災・安否イベントはありません。</p>`;
    return;
  }
  container.innerHTML = events
    .map((event) => {
      const eventCheckins = checkins.filter((checkin) => checkin.event_id === event.id);
      const myCheckin = eventCheckins.find((checkin) => checkin.user_id === currentProfile!.id);
      const active = event.status === "active";
      return `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(event.title)}</strong>
              <p class="meta">${safetyKindLabels[event.kind]} / ${formatDateTime(event.scheduled_at)}${event.location ? ` / ${escapeHtml(event.location)}` : ""}</p>
            </div>
            ${safetyEventStatusBadge(event.status)}
          </div>
          ${event.note ? `<p>${escapeHtml(event.note)}</p>` : ""}
          <p class="meta">無事 ${eventCheckins.filter((checkin) => checkin.status === "safe").length} / 要支援 ${eventCheckins.filter((checkin) => checkin.status === "needs_help").length}</p>
          <div class="toolbar">
            <button class="button ${myCheckin?.status === "safe" ? "" : "secondary"}" type="button" data-safety-safe="${event.id}" ${active ? "" : "disabled"}>無事</button>
            <button class="button ${myCheckin?.status === "needs_help" ? "danger" : "secondary"}" type="button" data-safety-help="${event.id}" ${active ? "" : "disabled"}>要支援</button>
            ${canManage() && event.status !== "completed" ? `<button class="button" type="button" data-safety-complete="${event.id}">完了</button>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

  qsa<HTMLButtonElement>("[data-safety-safe]").forEach((button) => {
    button.addEventListener("click", () => respondSafety(button.dataset.safetySafe!, "safe"));
  });
  qsa<HTMLButtonElement>("[data-safety-help]").forEach((button) => {
    button.addEventListener("click", () => respondSafety(button.dataset.safetyHelp!, "needs_help"));
  });
  qsa<HTMLButtonElement>("[data-safety-complete]").forEach((button) => {
    button.addEventListener("click", () => updateSafetyEventStatus(button.dataset.safetyComplete!, "completed"));
  });
}

async function respondSafety(eventId: string, status: SafetyCheckinStatus) {
  const { error } = await supabase!.from("safety_checkins").upsert(
    {
      event_id: eventId,
      user_id: currentProfile!.id,
      status,
      comment: safetyCheckinLabels[status],
    },
    { onConflict: "event_id,user_id" },
  );
  if (error) {
    alert(error.message);
    return;
  }
  await renderSafetyPage();
}

async function updateSafetyEventStatus(id: string, status: SafetyEventStatus) {
  const { error } = await supabase!.from("safety_events").update({ status }).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderSafetyPage();
}

async function initTasks() {
  qs("[data-task-form]")?.classList.toggle("hidden", !canManage());
  await renderTasksPage();

  qsa<HTMLButtonElement>("[data-task-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      taskFilter = (button.dataset.taskFilter as BoardTaskStatus | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-task-filter]").forEach((item) => item.classList.toggle("active", item === button));
      await renderTasksPage();
    });
  });

  qs<HTMLFormElement>("[data-task-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const assignee = String(form.get("assignee_id") || "").trim();
    const { error } = await supabase!.from("board_tasks").insert({
      title: String(form.get("title")),
      description: String(form.get("description")),
      priority: String(form.get("priority")),
      due_date: String(form.get("due_date") || "") || null,
      assignee_id: assignee || currentProfile!.id,
      created_by: currentProfile!.id,
      status: "open",
    });
    if (error) {
      setStatus("[data-task-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-task-status]", "タスクを作成しました。");
    await renderTasksPage();
  });
}

async function renderTasksPage() {
  let query = supabase!.from("board_tasks").select("*").order("updated_at", { ascending: false });
  if (taskFilter !== "all") query = query.eq("status", taskFilter);
  const { data } = await query;
  const tasks = (data ?? []) as BoardTask[];
  const today = new Date().toISOString().slice(0, 10);
  setText("[data-metric='task-open']", String(tasks.filter((task) => task.status === "open").length));
  setText("[data-metric='task-progress']", String(tasks.filter((task) => task.status === "in_progress").length));
  setText("[data-metric='task-overdue']", String(tasks.filter((task) => task.status !== "done" && task.due_date && task.due_date < today).length));
  renderTaskList(tasks);
}

function renderTaskList(tasks: BoardTask[]) {
  const container = qs("[data-task-list]");
  if (!container) return;
  if (!tasks.length) {
    container.innerHTML = `<p class="meta">タスクはありません。</p>`;
    return;
  }
  container.innerHTML = tasks
    .map(
      (task) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(task.title)}</strong>
              <p class="meta">${boardTaskPriorityLabels[task.priority]}${task.due_date ? ` / 期限 ${escapeHtml(task.due_date)}` : ""}</p>
            </div>
            ${boardTaskStatusBadge(task.status)}
          </div>
          <p>${escapeHtml(task.description)}</p>
          ${
            canManage() || task.assignee_id === currentProfile?.id
              ? `<div class="toolbar">
                  <button class="button secondary" type="button" data-task-progress="${task.id}">対応中</button>
                  <button class="button" type="button" data-task-done="${task.id}">完了</button>
                  <button class="button danger" type="button" data-task-cancel="${task.id}">中止</button>
                </div>`
              : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-task-progress]").forEach((button) => {
    button.addEventListener("click", () => updateTaskStatus(button.dataset.taskProgress!, "in_progress"));
  });
  qsa<HTMLButtonElement>("[data-task-done]").forEach((button) => {
    button.addEventListener("click", () => updateTaskStatus(button.dataset.taskDone!, "done"));
  });
  qsa<HTMLButtonElement>("[data-task-cancel]").forEach((button) => {
    button.addEventListener("click", () => updateTaskStatus(button.dataset.taskCancel!, "cancelled"));
  });
}

async function updateTaskStatus(id: string, status: BoardTaskStatus) {
  const patch: Record<string, string | null> = { status, completed_at: status === "done" ? new Date().toISOString() : null };
  const { error } = await supabase!.from("board_tasks").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderTasksPage();
}

async function initParking() {
  qs("[data-parking-space-form]")?.classList.toggle("hidden", !canManage());
  await renderParkingPage();

  qs<HTMLFormElement>("[data-parking-space-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("parking_spaces").insert({
      code: String(form.get("code")),
      kind: String(form.get("kind")),
      location: String(form.get("location") || "") || null,
      monthly_fee: form.get("monthly_fee") ? Number(form.get("monthly_fee")) : null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-parking-space-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-parking-space-status]", "区画を登録しました。");
    await renderParkingPage();
  });

  qs<HTMLFormElement>("[data-parking-permit-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("parking_permits").insert({
      space_id: String(form.get("space_id")),
      user_id: currentProfile!.id,
      vehicle_label: String(form.get("vehicle_label")),
      start_date: String(form.get("start_date")),
      end_date: String(form.get("end_date") || "") || null,
      status: "pending",
    });
    if (error) {
      setStatus("[data-parking-permit-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-parking-permit-status]", "利用申請を送信しました。");
    await renderParkingPage();
  });
}

async function renderParkingPage() {
  const [{ data: spaces }, { data: permits }] = await Promise.all([
    supabase!.from("parking_spaces").select("*").order("kind").order("code"),
    supabase!.from("parking_permits").select("*, parking_spaces(code, kind, location)").order("created_at", { ascending: false }),
  ]);
  parkingSpacesCache = (spaces ?? []) as ParkingSpace[];
  const parkingPermits = (permits ?? []) as ParkingPermit[];
  const availableSpaces = parkingSpacesCache.filter((space) => space.is_active && space.is_available);
  setText("[data-metric='parking-available']", String(availableSpaces.length));
  setText("[data-metric='parking-active']", String(parkingSpacesCache.filter((space) => space.is_active && !space.is_available).length));
  setText("[data-metric='parking-pending']", String(parkingPermits.filter((permit) => permit.status === "pending").length));
  renderParkingSpaceSelect(availableSpaces);
  renderParkingSpaces(parkingSpacesCache);
  renderParkingPermits(parkingPermits);
}

function renderParkingSpaceSelect(spaces: ParkingSpace[]) {
  const select = qs<HTMLSelectElement>("[data-parking-space-select]");
  if (!select) return;
  const submit = qs<HTMLButtonElement>("[data-parking-permit-form] button[type='submit']");
  select.disabled = spaces.length === 0;
  if (submit) submit.disabled = spaces.length === 0;
  select.innerHTML = spaces.length
    ? spaces.map((space) => `<option value="${space.id}">${parkingKindLabels[space.kind]} ${escapeHtml(space.code)}</option>`).join("")
    : `<option value="">空き区画はありません</option>`;
}

function renderParkingSpaces(spaces: ParkingSpace[]) {
  const container = qs("[data-parking-space-list]");
  if (!container) return;
  if (!spaces.length) {
    container.innerHTML = `<p class="meta">区画はありません。</p>`;
    return;
  }
  container.innerHTML = spaces
    .map(
      (space) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${parkingKindLabels[space.kind]} ${escapeHtml(space.code)}</strong>
              <p class="meta">${escapeHtml(space.location ?? "-")} / 月額 ${space.monthly_fee == null ? "-" : formatCurrency(space.monthly_fee)}</p>
            </div>
            <span class="badge ${space.is_available ? "success" : "warning"}">${space.is_available ? "空き" : "利用中"}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderParkingPermits(permits: ParkingPermit[]) {
  const container = qs("[data-parking-permit-list]");
  if (!container) return;
  if (!permits.length) {
    container.innerHTML = `<p class="meta">利用申請はありません。</p>`;
    return;
  }
  container.innerHTML = permits
    .map(
      (permit) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${parkingKindLabels[permit.parking_spaces?.kind ?? "car"]} ${escapeHtml(permit.parking_spaces?.code ?? "-")}</strong>
              <p class="meta">${escapeHtml(permit.vehicle_label)} / ${escapeHtml(permit.start_date)}${permit.end_date ? ` - ${escapeHtml(permit.end_date)}` : ""}</p>
            </div>
            ${parkingPermitStatusBadge(permit.status)}
          </div>
          ${
            canManage() && permit.status === "pending"
              ? `<div class="toolbar">
                  <button class="button" type="button" data-parking-approve="${permit.id}">承認</button>
                  <button class="button danger" type="button" data-parking-reject="${permit.id}">却下</button>
                </div>`
              : canManage() && permit.status === "active"
                ? `<div class="toolbar"><button class="button secondary" type="button" data-parking-end="${permit.id}">終了</button></div>`
                : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-parking-approve]").forEach((button) => {
    button.addEventListener("click", () => updateParkingPermitStatus(button.dataset.parkingApprove!, "active"));
  });
  qsa<HTMLButtonElement>("[data-parking-reject]").forEach((button) => {
    button.addEventListener("click", () => updateParkingPermitStatus(button.dataset.parkingReject!, "rejected"));
  });
  qsa<HTMLButtonElement>("[data-parking-end]").forEach((button) => {
    button.addEventListener("click", () => updateParkingPermitStatus(button.dataset.parkingEnd!, "ended"));
  });
}

async function updateParkingPermitStatus(id: string, status: ParkingPermitStatus) {
  const { data: permit, error: permitError } = await supabase!.from("parking_permits").select("space_id").eq("id", id).single();
  if (permitError || !permit) {
    alert(permitError?.message ?? "申請を確認できませんでした。");
    return;
  }
  const patch: Record<string, string | null> = { status };
  if (status === "active") {
    patch.approved_by = currentProfile!.id;
    patch.approved_at = new Date().toISOString();
  }
  const { error } = await supabase!.from("parking_permits").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  const { data: activePermits } = await supabase!.from("parking_permits").select("id").eq("space_id", permit.space_id).eq("status", "active").limit(1);
  await supabase!.from("parking_spaces").update({ is_available: !(activePermits ?? []).length }).eq("id", permit.space_id);
  await renderParkingPage();
}

async function initResidentRequests() {
  await renderResidentRequestsPage();

  qsa<HTMLButtonElement>("[data-request-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      residentRequestFilter = (button.dataset.requestFilter as ResidentRequestStatus | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-request-filter]").forEach((item) => item.classList.toggle("active", item === button));
      await renderResidentRequestsPage();
    });
  });

  qs<HTMLFormElement>("[data-resident-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("resident_requests").insert({
      title: String(form.get("title")),
      category: String(form.get("category")),
      visibility: String(form.get("visibility")),
      body: String(form.get("body")),
      requester_id: currentProfile!.id,
      status: "open",
    });
    if (error) {
      setStatus("[data-resident-request-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-resident-request-status]", "相談を送信しました。");
    await renderResidentRequestsPage();
  });
}

async function renderResidentRequestsPage() {
  let query = supabase!.from("resident_requests").select("*").order("updated_at", { ascending: false });
  if (residentRequestFilter !== "all") query = query.eq("status", residentRequestFilter);
  const { data } = await query;
  const requests = (data ?? []) as ResidentRequest[];
  setText("[data-metric='request-open']", String(requests.filter((request) => request.status === "open").length));
  setText("[data-metric='request-progress']", String(requests.filter((request) => request.status === "in_progress").length));
  setText("[data-metric='request-done']", String(requests.filter((request) => request.status === "resolved" || request.status === "closed").length));
  renderResidentRequestList(requests);
}

function renderResidentRequestList(requests: ResidentRequest[]) {
  const container = qs("[data-resident-request-list]");
  if (!container) return;
  if (!requests.length) {
    container.innerHTML = `<p class="meta">相談・苦情はありません。</p>`;
    return;
  }
  container.innerHTML = requests
    .map(
      (request) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(request.title)}</strong>
              <p class="meta">${residentRequestCategoryLabels[request.category]} / ${formatDateTime(request.updated_at)}</p>
            </div>
            ${residentRequestStatusBadge(request.status)}
          </div>
          <p>${escapeHtml(request.body)}</p>
          ${request.response ? `<p class="meta">回答: ${escapeHtml(request.response)}</p>` : ""}
          ${
            canManage()
              ? `<div class="toolbar">
                  <button class="button secondary" type="button" data-request-progress="${request.id}">対応中</button>
                  <button class="button" type="button" data-request-resolve="${request.id}">完了</button>
                  <button class="button danger" type="button" data-request-close="${request.id}">終了</button>
                </div>`
              : request.requester_id === currentProfile?.id && request.status === "open"
                ? `<div class="toolbar"><button class="button secondary" type="button" data-request-close="${request.id}">取り下げ</button></div>`
                : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-request-progress]").forEach((button) => {
    button.addEventListener("click", () => updateResidentRequestStatus(button.dataset.requestProgress!, "in_progress"));
  });
  qsa<HTMLButtonElement>("[data-request-resolve]").forEach((button) => {
    button.addEventListener("click", () => updateResidentRequestStatus(button.dataset.requestResolve!, "resolved"));
  });
  qsa<HTMLButtonElement>("[data-request-close]").forEach((button) => {
    button.addEventListener("click", () => updateResidentRequestStatus(button.dataset.requestClose!, "closed"));
  });
}

async function updateResidentRequestStatus(id: string, status: ResidentRequestStatus) {
  const patch: Record<string, string | null> = { status };
  if (canManage()) {
    patch.handled_by = currentProfile!.id;
    patch.response = status === "in_progress" ? "対応を開始しました。" : status === "resolved" ? "対応を完了しました。" : "受付を終了しました。";
  }
  if (status === "resolved") patch.resolved_at = new Date().toISOString();
  const { error } = await supabase!.from("resident_requests").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderResidentRequestsPage();
}

async function initCirculars() {
  qs("[data-circular-form]")?.classList.toggle("hidden", !canManage());
  await renderCircularsPage();

  qs<HTMLFormElement>("[data-circular-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("circulars").insert({
      title: String(form.get("title")),
      kind: String(form.get("kind")),
      target_role: String(form.get("target_role")),
      due_date: String(form.get("due_date") || "") || null,
      body: String(form.get("body")),
      status: "published",
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-circular-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-circular-status]", "回覧を公開しました。");
    await renderCircularsPage();
  });
}

async function renderCircularsPage() {
  const [{ data: circulars }, { data: acknowledgements }] = await Promise.all([
    supabase!.from("circulars").select("*").order("updated_at", { ascending: false }),
    supabase!.from("circular_acknowledgements").select("*, circulars(title, kind)").order("created_at", { ascending: false }),
  ]);
  const circularItems = (circulars ?? []) as Circular[];
  const ackItems = (acknowledgements ?? []) as CircularAcknowledgement[];
  const acknowledgedIds = new Set(ackItems.filter((ack) => ack.user_id === currentProfile?.id).map((ack) => ack.circular_id));
  const today = new Date().toISOString().slice(0, 10);
  const dueLimit = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  setText("[data-metric='circular-published']", String(circularItems.filter((item) => item.status === "published").length));
  setText("[data-metric='circular-unread']", String(circularItems.filter((item) => item.status === "published" && !acknowledgedIds.has(item.id)).length));
  setText("[data-metric='circular-due']", String(circularItems.filter((item) => item.status === "published" && item.due_date && item.due_date >= today && item.due_date <= dueLimit).length));
  renderCircularList(circularItems, acknowledgedIds);
  renderCircularAckList(ackItems);
}

function renderCircularList(circulars: Circular[], acknowledgedIds: Set<string>) {
  const container = qs("[data-circular-list]");
  if (!container) return;
  if (!circulars.length) {
    container.innerHTML = `<p class="meta">回覧はありません。</p>`;
    return;
  }
  container.innerHTML = circulars
    .map(
      (item) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p class="meta">${circularKindLabels[item.kind]} / 対象 ${roleLabels[item.target_role as Role] ?? "全員"}${item.due_date ? ` / 期限 ${escapeHtml(item.due_date)}` : ""}</p>
            </div>
            ${circularStatusBadge(item.status, acknowledgedIds.has(item.id))}
          </div>
          <p>${escapeHtml(item.body)}</p>
          ${
            item.status === "published" && !acknowledgedIds.has(item.id)
              ? `<div class="toolbar"><button class="button" type="button" data-circular-ack="${item.id}">確認済みにする</button></div>`
              : canManage() && item.status === "published"
                ? `<div class="toolbar"><button class="button secondary" type="button" data-circular-archive="${item.id}">保管する</button></div>`
                : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-circular-ack]").forEach((button) => {
    button.addEventListener("click", () => acknowledgeCircular(button.dataset.circularAck!));
  });
  qsa<HTMLButtonElement>("[data-circular-archive]").forEach((button) => {
    button.addEventListener("click", () => updateCircularStatus(button.dataset.circularArchive!, "archived"));
  });
}

function renderCircularAckList(acknowledgements: CircularAcknowledgement[]) {
  const container = qs("[data-circular-ack-list]");
  if (!container) return;
  const ownAcks = acknowledgements.filter((ack) => ack.user_id === currentProfile?.id);
  if (!ownAcks.length) {
    container.innerHTML = `<p class="meta">確認履歴はありません。</p>`;
    return;
  }
  container.innerHTML = ownAcks
    .map(
      (ack) => `
        <article class="list-item">
          <strong>${escapeHtml(ack.circulars?.title ?? "回覧")}</strong>
          <p class="meta">${ack.circulars?.kind ? circularKindLabels[ack.circulars.kind] : "回覧"} / ${formatDateTime(ack.created_at)}</p>
        </article>
      `,
    )
    .join("");
}

async function acknowledgeCircular(id: string) {
  const { error } = await supabase!.from("circular_acknowledgements").upsert(
    {
      circular_id: id,
      user_id: currentProfile!.id,
    },
    { onConflict: "circular_id,user_id", ignoreDuplicates: true },
  );
  if (error) {
    alert(error.message);
    return;
  }
  await renderCircularsPage();
}

async function updateCircularStatus(id: string, status: CircularStatus) {
  const { error } = await supabase!.from("circulars").update({ status }).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderCircularsPage();
}

async function initLending() {
  qs("[data-lending-item-form]")?.classList.toggle("hidden", !canManage());
  await renderLendingPage();

  qs<HTMLFormElement>("[data-lending-item-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("lending_items").insert({
      name: String(form.get("name")),
      kind: String(form.get("kind")),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-lending-item-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-lending-item-status]", "貸出品を登録しました。");
    await renderLendingPage();
  });

  qs<HTMLFormElement>("[data-lending-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("lending_requests").insert({
      item_id: String(form.get("item_id")),
      user_id: currentProfile!.id,
      purpose: String(form.get("purpose")),
      due_at: form.get("due_at") ? new Date(String(form.get("due_at"))).toISOString() : null,
      status: "pending",
    });
    if (error) {
      setStatus("[data-lending-request-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-lending-request-status]", "貸出申請を送信しました。");
    await renderLendingPage();
  });
}

async function renderLendingPage() {
  const [{ data: items }, { data: requests }] = await Promise.all([
    supabase!.from("lending_items").select("*").order("kind").order("name"),
    supabase!.from("lending_requests").select("*, lending_items(name, kind, location)").order("created_at", { ascending: false }),
  ]);
  lendingItemsCache = (items ?? []) as LendingItem[];
  const lendingRequests = (requests ?? []) as LendingRequest[];
  const availableItems = lendingItemsCache.filter((item) => item.is_active && item.is_available);
  setText("[data-metric='lending-available']", String(availableItems.length));
  setText("[data-metric='lending-pending']", String(lendingRequests.filter((request) => request.status === "pending").length));
  setText("[data-metric='lending-checked-out']", String(lendingRequests.filter((request) => request.status === "checked_out").length));
  renderLendingItemSelect(availableItems);
  renderLendingItems(lendingItemsCache);
  renderLendingRequests(lendingRequests);
}

function renderLendingItemSelect(items: LendingItem[]) {
  const select = qs<HTMLSelectElement>("[data-lending-item-select]");
  if (!select) return;
  const submit = qs<HTMLButtonElement>("[data-lending-request-form] button[type='submit']");
  select.disabled = items.length === 0;
  if (submit) submit.disabled = items.length === 0;
  select.innerHTML = items.length
    ? items.map((item) => `<option value="${item.id}">${lendingKindLabels[item.kind]} ${escapeHtml(item.name)}</option>`).join("")
    : `<option value="">貸出可能な品目はありません</option>`;
}

function renderLendingItems(items: LendingItem[]) {
  const container = qs("[data-lending-item-list]");
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<p class="meta">貸出品はありません。</p>`;
    return;
  }
  container.innerHTML = items
    .map(
      (item) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <p class="meta">${lendingKindLabels[item.kind]} / ${escapeHtml(item.location ?? "-")}</p>
            </div>
            <span class="badge ${item.is_available ? "success" : "warning"}">${item.is_available ? "貸出可" : "貸出中"}</span>
          </div>
          ${item.note ? `<p>${escapeHtml(item.note)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

function renderLendingRequests(requests: LendingRequest[]) {
  const container = qs("[data-lending-request-list]");
  if (!container) return;
  if (!requests.length) {
    container.innerHTML = `<p class="meta">貸出申請はありません。</p>`;
    return;
  }
  container.innerHTML = requests
    .map(
      (request) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(request.lending_items?.name ?? "貸出品")}</strong>
              <p class="meta">${request.due_at ? `返却予定 ${formatDateTime(request.due_at)}` : "返却予定なし"}</p>
            </div>
            ${lendingRequestStatusBadge(request.status)}
          </div>
          <p>${escapeHtml(request.purpose)}</p>
          ${
            canManage() && request.status === "pending"
              ? `<div class="toolbar">
                  <button class="button" type="button" data-lending-approve="${request.id}">貸出承認</button>
                  <button class="button danger" type="button" data-lending-reject="${request.id}">却下</button>
                </div>`
              : canManage() && request.status === "checked_out"
                ? `<div class="toolbar">
                    <button class="button" type="button" data-lending-return="${request.id}">返却済み</button>
                    <button class="button danger" type="button" data-lending-lost="${request.id}">紛失</button>
                  </div>`
                : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-lending-approve]").forEach((button) => {
    button.addEventListener("click", () => updateLendingRequestStatus(button.dataset.lendingApprove!, "checked_out"));
  });
  qsa<HTMLButtonElement>("[data-lending-reject]").forEach((button) => {
    button.addEventListener("click", () => updateLendingRequestStatus(button.dataset.lendingReject!, "rejected"));
  });
  qsa<HTMLButtonElement>("[data-lending-return]").forEach((button) => {
    button.addEventListener("click", () => updateLendingRequestStatus(button.dataset.lendingReturn!, "returned"));
  });
  qsa<HTMLButtonElement>("[data-lending-lost]").forEach((button) => {
    button.addEventListener("click", () => updateLendingRequestStatus(button.dataset.lendingLost!, "lost"));
  });
}

async function updateLendingRequestStatus(id: string, status: LendingRequestStatus) {
  const { data: request, error: requestError } = await supabase!.from("lending_requests").select("item_id").eq("id", id).single();
  if (requestError || !request) {
    alert(requestError?.message ?? "貸出申請を確認できませんでした。");
    return;
  }
  const patch: Record<string, string | null> = { status };
  if (status === "checked_out") {
    patch.approved_by = currentProfile!.id;
    patch.checkout_at = new Date().toISOString();
  }
  if (status === "returned") patch.returned_at = new Date().toISOString();
  const { error } = await supabase!.from("lending_requests").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  if (status === "checked_out" || status === "returned") {
    await supabase!.from("lending_items").update({ is_available: status === "returned" }).eq("id", request.item_id);
  }
  await renderLendingPage();
}

async function initDuties() {
  qs("[data-duty-form]")?.classList.toggle("hidden", !canManage());
  await renderDutiesPage();

  qsa<HTMLButtonElement>("[data-duty-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      dutyFilter = (button.dataset.dutyFilter as DutyStatus | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-duty-filter]").forEach((item) => item.classList.toggle("active", item === button));
      await renderDutiesPage();
    });
  });

  qs<HTMLFormElement>("[data-duty-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const assignee = String(form.get("assignee_id") || "").trim();
    const { error } = await supabase!.from("duty_assignments").insert({
      title: String(form.get("title")),
      kind: String(form.get("kind")),
      assignee_id: assignee || currentProfile!.id,
      scheduled_date: String(form.get("scheduled_date")),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      status: "planned",
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-duty-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-duty-status]", "当番を作成しました。");
    await renderDutiesPage();
  });
}

async function renderDutiesPage() {
  const { data } = await supabase!.from("duty_assignments").select("*").order("scheduled_date", { ascending: true }).order("created_at", { ascending: false });
  const duties = (data ?? []) as DutyAssignment[];
  const today = new Date().toISOString().slice(0, 10);
  const shownDuties = dutyFilter === "all" ? duties : duties.filter((duty) => duty.status === dutyFilter);
  setText("[data-metric='duty-planned']", String(duties.filter((duty) => duty.status === "planned").length));
  setText("[data-metric='duty-today']", String(duties.filter((duty) => duty.status === "planned" && duty.scheduled_date === today).length));
  setText("[data-metric='duty-done']", String(duties.filter((duty) => duty.status === "done").length));
  renderDutyList(shownDuties);
  renderOwnDutyList(duties.filter((duty) => duty.assignee_id === currentProfile?.id));
  bindDutyActions();
}

function renderDutyList(duties: DutyAssignment[]) {
  const container = qs("[data-duty-list]");
  if (!container) return;
  if (!duties.length) {
    container.innerHTML = `<p class="meta">当番はありません。</p>`;
    return;
  }
  container.innerHTML = duties.map(renderDutyItem).join("");
}

function renderOwnDutyList(duties: DutyAssignment[]) {
  const container = qs("[data-duty-own-list]");
  if (!container) return;
  if (!duties.length) {
    container.innerHTML = `<p class="meta">自分の当番はありません。</p>`;
    return;
  }
  container.innerHTML = duties.map(renderDutyItem).join("");
}

function renderDutyItem(duty: DutyAssignment) {
  return `
    <article class="list-item">
      <div class="list-row">
        <div>
          <strong>${escapeHtml(duty.title)}</strong>
          <p class="meta">${dutyKindLabels[duty.kind]} / ${escapeHtml(duty.scheduled_date)}${duty.location ? ` / ${escapeHtml(duty.location)}` : ""}</p>
        </div>
        ${dutyStatusBadge(duty.status)}
      </div>
      ${duty.note ? `<p>${escapeHtml(duty.note)}</p>` : ""}
      ${
        duty.status === "planned" && (canManage() || duty.assignee_id === currentProfile?.id)
          ? `<div class="toolbar">
              <button class="button" type="button" data-duty-done="${duty.id}">完了</button>
              ${canManage() ? `<button class="button secondary" type="button" data-duty-missed="${duty.id}">未実施</button><button class="button danger" type="button" data-duty-cancel="${duty.id}">中止</button>` : ""}
            </div>`
          : ""
      }
    </article>
  `;
}

function bindDutyActions() {
  qsa<HTMLButtonElement>("[data-duty-done]").forEach((button) => {
    button.addEventListener("click", () => updateDutyStatus(button.dataset.dutyDone!, "done"));
  });
  qsa<HTMLButtonElement>("[data-duty-missed]").forEach((button) => {
    button.addEventListener("click", () => updateDutyStatus(button.dataset.dutyMissed!, "missed"));
  });
  qsa<HTMLButtonElement>("[data-duty-cancel]").forEach((button) => {
    button.addEventListener("click", () => updateDutyStatus(button.dataset.dutyCancel!, "cancelled"));
  });
}

async function updateDutyStatus(id: string, status: DutyStatus) {
  const patch: Record<string, string | null> = { status, completed_at: status === "done" ? new Date().toISOString() : null };
  const { error } = await supabase!.from("duty_assignments").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderDutiesPage();
}

async function initWaste() {
  qs("[data-waste-schedule-form]")?.classList.toggle("hidden", !canManage());
  await renderWastePage();

  qs<HTMLFormElement>("[data-waste-schedule-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("waste_schedules").insert({
      title: String(form.get("title")),
      category: String(form.get("category")),
      collection_day: String(form.get("collection_day")),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-waste-schedule-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-waste-schedule-status]", "収集ルールを登録しました。");
    await renderWastePage();
  });

  qs<HTMLFormElement>("[data-bulky-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("bulky_waste_requests").insert({
      user_id: currentProfile!.id,
      item_name: String(form.get("item_name")),
      preferred_date: String(form.get("preferred_date") || "") || null,
      pickup_location: String(form.get("pickup_location") || "") || null,
      note: String(form.get("note") || "") || null,
      status: "submitted",
    });
    if (error) {
      setStatus("[data-bulky-request-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-bulky-request-status]", "粗大ごみ申請を送信しました。");
    await renderWastePage();
  });
}

async function renderWastePage() {
  const [{ data: schedules }, { data: requests }] = await Promise.all([
    supabase!.from("waste_schedules").select("*").order("category").order("collection_day"),
    supabase!.from("bulky_waste_requests").select("*").order("created_at", { ascending: false }),
  ]);
  const wasteSchedules = (schedules ?? []) as WasteSchedule[];
  const bulkyRequests = (requests ?? []) as BulkyWasteRequest[];
  setText("[data-metric='waste-schedules']", String(wasteSchedules.filter((schedule) => schedule.is_active).length));
  setText("[data-metric='bulky-submitted']", String(bulkyRequests.filter((request) => request.status === "submitted").length));
  setText("[data-metric='bulky-scheduled']", String(bulkyRequests.filter((request) => request.status === "scheduled").length));
  renderWasteSchedules(wasteSchedules);
  renderBulkyWasteRequests(bulkyRequests);
}

function renderWasteSchedules(schedules: WasteSchedule[]) {
  const container = qs("[data-waste-schedule-list]");
  if (!container) return;
  if (!schedules.length) {
    container.innerHTML = `<p class="meta">収集ルールはありません。</p>`;
    return;
  }
  container.innerHTML = schedules
    .map(
      (schedule) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(schedule.title)}</strong>
              <p class="meta">${wasteCategoryLabels[schedule.category]} / ${escapeHtml(schedule.collection_day)}${schedule.location ? ` / ${escapeHtml(schedule.location)}` : ""}</p>
            </div>
            <span class="badge ${schedule.is_active ? "success" : "danger"}">${schedule.is_active ? "有効" : "停止"}</span>
          </div>
          ${schedule.note ? `<p>${escapeHtml(schedule.note)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

function renderBulkyWasteRequests(requests: BulkyWasteRequest[]) {
  const container = qs("[data-bulky-request-list]");
  if (!container) return;
  if (!requests.length) {
    container.innerHTML = `<p class="meta">粗大ごみ申請はありません。</p>`;
    return;
  }
  container.innerHTML = requests
    .map(
      (request) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(request.item_name)}</strong>
              <p class="meta">${request.preferred_date ? `希望 ${escapeHtml(request.preferred_date)}` : "希望日なし"}${request.pickup_location ? ` / ${escapeHtml(request.pickup_location)}` : ""}</p>
            </div>
            ${bulkyWasteStatusBadge(request.status)}
          </div>
          ${request.note ? `<p>${escapeHtml(request.note)}</p>` : ""}
          ${
            canManage() && request.status === "submitted"
              ? `<div class="toolbar">
                  <button class="button" type="button" data-bulky-schedule="${request.id}">予約済み</button>
                  <button class="button danger" type="button" data-bulky-cancel="${request.id}">取消</button>
                </div>`
              : canManage() && request.status === "scheduled"
                ? `<div class="toolbar"><button class="button" type="button" data-bulky-complete="${request.id}">完了</button></div>`
                : request.user_id === currentProfile?.id && request.status === "submitted"
                  ? `<div class="toolbar"><button class="button secondary" type="button" data-bulky-cancel="${request.id}">取り下げ</button></div>`
                  : ""
          }
        </article>
      `,
    )
    .join("");

  qsa<HTMLButtonElement>("[data-bulky-schedule]").forEach((button) => {
    button.addEventListener("click", () => updateBulkyWasteStatus(button.dataset.bulkySchedule!, "scheduled"));
  });
  qsa<HTMLButtonElement>("[data-bulky-complete]").forEach((button) => {
    button.addEventListener("click", () => updateBulkyWasteStatus(button.dataset.bulkyComplete!, "completed"));
  });
  qsa<HTMLButtonElement>("[data-bulky-cancel]").forEach((button) => {
    button.addEventListener("click", () => updateBulkyWasteStatus(button.dataset.bulkyCancel!, "cancelled"));
  });
}

async function updateBulkyWasteStatus(id: string, status: BulkyWasteStatus) {
  const patch: Record<string, string | null> = { status };
  if (canManage()) patch.handled_by = currentProfile!.id;
  if (status === "scheduled") patch.scheduled_date = new Date().toISOString().slice(0, 10);
  if (status === "completed") patch.completed_at = new Date().toISOString();
  const { error } = await supabase!.from("bulky_waste_requests").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderWastePage();
}

async function initMeetings() {
  qs("[data-meeting-form]")?.classList.toggle("hidden", !canManage());
  qs("[data-agenda-form]")?.classList.toggle("hidden", !canManage());
  await renderMeetingsPage();

  qs<HTMLFormElement>("[data-meeting-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("meeting_sessions").insert({
      title: String(form.get("title")),
      kind: String(form.get("kind")),
      scheduled_at: new Date(String(form.get("scheduled_at"))).toISOString(),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      status: "open",
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-meeting-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-meeting-status]", "会議を公開しました。");
    await renderMeetingsPage();
  });

  qs<HTMLFormElement>("[data-agenda-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("meeting_agenda_items").insert({
      meeting_id: String(form.get("meeting_id")),
      title: String(form.get("title")),
      description: String(form.get("description")),
      sort_order: Number(form.get("sort_order") || 0),
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-agenda-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-agenda-status]", "議案を追加しました。");
    await renderMeetingsPage();
  });

  qs<HTMLFormElement>("[data-attendance-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("meeting_attendances").upsert(
      {
        meeting_id: String(form.get("meeting_id")),
        user_id: currentProfile!.id,
        status: String(form.get("status")),
        proxy_to: String(form.get("proxy_to") || "") || null,
        note: String(form.get("note") || "") || null,
      },
      { onConflict: "meeting_id,user_id" },
    );
    if (error) {
      setStatus("[data-attendance-status]", error.message, true);
      return;
    }
    setStatus("[data-attendance-status]", "出席・委任を登録しました。");
    await renderMeetingsPage();
  });

  qs<HTMLFormElement>("[data-vote-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("meeting_votes").upsert(
      {
        agenda_item_id: String(form.get("agenda_item_id")),
        user_id: currentProfile!.id,
        choice: String(form.get("choice")),
        comment: String(form.get("comment") || "") || null,
      },
      { onConflict: "agenda_item_id,user_id" },
    );
    if (error) {
      setStatus("[data-vote-status]", error.message, true);
      return;
    }
    setStatus("[data-vote-status]", "投票を登録しました。");
    await renderMeetingsPage();
  });
}

async function renderMeetingsPage() {
  const [{ data: sessions }, { data: agendaItems }, { data: attendances }, { data: votes }] = await Promise.all([
    supabase!.from("meeting_sessions").select("*").order("scheduled_at", { ascending: false }),
    supabase!.from("meeting_agenda_items").select("*, meeting_sessions(title, status)").order("sort_order").order("created_at"),
    supabase!.from("meeting_attendances").select("*").order("created_at", { ascending: false }),
    supabase!.from("meeting_votes").select("*").order("created_at", { ascending: false }),
  ]);
  meetingSessionsCache = (sessions ?? []) as MeetingSession[];
  meetingAgendaCache = (agendaItems ?? []) as MeetingAgendaItem[];
  const meetingAttendances = (attendances ?? []) as MeetingAttendance[];
  const meetingVotes = (votes ?? []) as MeetingVote[];
  setText("[data-metric='meeting-open']", String(meetingSessionsCache.filter((meeting) => meeting.status === "open").length));
  setText("[data-metric='meeting-agendas']", String(meetingAgendaCache.length));
  setText("[data-metric='meeting-attendance']", String(meetingAttendances.length));
  renderMeetingSelects(meetingSessionsCache, meetingAgendaCache);
  renderMeetingList(meetingSessionsCache, meetingAttendances);
  renderAgendaList(meetingAgendaCache, meetingVotes);
}

function renderMeetingSelects(sessions: MeetingSession[], agendaItems: MeetingAgendaItem[]) {
  const openSessions = sessions.filter((session) => session.status === "open");
  const openAgendaItems = agendaItems.filter((item) => item.meeting_sessions?.status === "open");
  const meetingOptions = openSessions.length
    ? openSessions.map((session) => `<option value="${session.id}">${escapeHtml(session.title)}</option>`).join("")
    : `<option value="">公開中の会議はありません</option>`;
  ["[data-agenda-meeting-select]", "[data-attendance-meeting-select]"].forEach((selector) => {
    const select = qs<HTMLSelectElement>(selector);
    if (!select) return;
    select.disabled = openSessions.length === 0;
    select.innerHTML = meetingOptions;
  });

  const agendaSelect = qs<HTMLSelectElement>("[data-vote-agenda-select]");
  if (agendaSelect) {
    agendaSelect.disabled = openAgendaItems.length === 0;
    agendaSelect.innerHTML = openAgendaItems.length
      ? openAgendaItems.map((item) => `<option value="${item.id}">${escapeHtml(item.meeting_sessions?.title ?? "会議")} / ${escapeHtml(item.title)}</option>`).join("")
      : `<option value="">投票可能な議案はありません</option>`;
  }
}

function renderMeetingList(sessions: MeetingSession[], attendances: MeetingAttendance[]) {
  const container = qs("[data-meeting-list]");
  if (!container) return;
  if (!sessions.length) {
    container.innerHTML = `<p class="meta">会議はありません。</p>`;
    return;
  }
  container.innerHTML = sessions
    .map((session) => {
      const related = attendances.filter((attendance) => attendance.meeting_id === session.id);
      const attending = related.filter((attendance) => attendance.status === "attending").length;
      const proxy = related.filter((attendance) => attendance.status === "proxy").length;
      return `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(session.title)}</strong>
              <p class="meta">${meetingKindLabels[session.kind]} / ${formatDateTime(session.scheduled_at)}${session.location ? ` / ${escapeHtml(session.location)}` : ""}</p>
            </div>
            ${meetingStatusBadge(session.status)}
          </div>
          ${session.note ? `<p>${escapeHtml(session.note)}</p>` : ""}
          <p class="meta">出席 ${attending} / 委任 ${proxy}</p>
          ${
            canManage() && session.status === "open"
              ? `<div class="toolbar">
                  <button class="button" type="button" data-meeting-close="${session.id}">終了</button>
                  <button class="button danger" type="button" data-meeting-cancel="${session.id}">中止</button>
                </div>`
              : ""
          }
        </article>
      `;
    })
    .join("");

  qsa<HTMLButtonElement>("[data-meeting-close]").forEach((button) => {
    button.addEventListener("click", () => updateMeetingStatus(button.dataset.meetingClose!, "closed"));
  });
  qsa<HTMLButtonElement>("[data-meeting-cancel]").forEach((button) => {
    button.addEventListener("click", () => updateMeetingStatus(button.dataset.meetingCancel!, "cancelled"));
  });
}

function renderAgendaList(agendaItems: MeetingAgendaItem[], votes: MeetingVote[]) {
  const container = qs("[data-agenda-list]");
  if (!container) return;
  if (!agendaItems.length) {
    container.innerHTML = `<p class="meta">議案はありません。</p>`;
    return;
  }
  container.innerHTML = agendaItems
    .map((item) => {
      const related = votes.filter((vote) => vote.agenda_item_id === item.id);
      const approve = related.filter((vote) => vote.choice === "approve").length;
      const reject = related.filter((vote) => vote.choice === "reject").length;
      const abstain = related.filter((vote) => vote.choice === "abstain").length;
      return `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p class="meta">${escapeHtml(item.meeting_sessions?.title ?? "会議")} / 表示順 ${item.sort_order}</p>
            </div>
            <span class="badge ${item.meeting_sessions?.status === "open" ? "warning" : "success"}">${item.meeting_sessions?.status === "open" ? "投票中" : "集計"}</span>
          </div>
          <p>${escapeHtml(item.description)}</p>
          <p class="meta">賛成 ${approve} / 反対 ${reject} / 棄権 ${abstain}</p>
        </article>
      `;
    })
    .join("");
}

async function updateMeetingStatus(id: string, status: MeetingStatus) {
  const patch: Record<string, string | null> = { status, closed_at: status === "closed" ? new Date().toISOString() : null };
  const { error } = await supabase!.from("meeting_sessions").update(patch).eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  await renderMeetingsPage();
}

async function initInspections() {
  qs("[data-inspection-plan-form]")?.classList.toggle("hidden", !canManage());
  qs("[data-inspection-record-form]")?.classList.toggle("hidden", !canManage());
  await renderInspectionsPage();

  qs<HTMLFormElement>("[data-inspection-plan-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("inspection_plans").insert({
      asset_id: String(form.get("asset_id")),
      title: String(form.get("title")),
      frequency: String(form.get("frequency")),
      next_due_date: String(form.get("next_due_date")),
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    });
    if (error) {
      setStatus("[data-inspection-plan-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-inspection-plan-status]", "点検計画を作成しました。");
    await renderInspectionsPage();
  });

  qs<HTMLFormElement>("[data-inspection-record-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const planId = String(form.get("plan_id"));
    const result = String(form.get("result")) as InspectionResult;
    const plan = inspectionPlansCache.find((item) => item.id === planId);
    if (!plan) {
      setStatus("[data-inspection-record-status]", "点検計画を確認できませんでした。", true);
      return;
    }
    const note = String(form.get("note"));
    let maintenanceRequestId: string | null = null;
    if (result === "repair_needed") {
      const { data: maintenance, error: maintenanceError } = await supabase!
        .from("maintenance_requests")
        .insert({
          title: `点検異常: ${plan.title}`,
          category: "equipment",
          priority: "high",
          status: "open",
          location: plan.asset_items?.location ?? "共用部",
          description: note,
          requester_id: currentProfile!.id,
        })
        .select("id")
        .single();
      if (maintenanceError) {
        setStatus("[data-inspection-record-status]", maintenanceError.message, true);
        return;
      }
      maintenanceRequestId = maintenance?.id ?? null;
    }

    const { error } = await supabase!.from("inspection_records").insert({
      plan_id: plan.id,
      asset_id: plan.asset_id,
      inspected_by: currentProfile!.id,
      result,
      inspected_at: String(form.get("inspected_at")),
      note,
      maintenance_request_id: maintenanceRequestId,
    });
    if (error) {
      setStatus("[data-inspection-record-status]", error.message, true);
      return;
    }
    if (result === "repair_needed") {
      await supabase!.from("asset_items").update({ status: "repair_needed", managed_by: currentProfile!.id }).eq("id", plan.asset_id);
    }
    event.currentTarget.reset();
    setStatus("[data-inspection-record-status]", "点検記録を登録しました。");
    await renderInspectionsPage();
  });
}

async function renderInspectionsPage() {
  const [{ data: assets }, { data: plans }, { data: records }] = await Promise.all([
    supabase!.from("asset_items").select("*").order("name"),
    supabase!.from("inspection_plans").select("*, asset_items(name, location, status)").order("next_due_date", { ascending: true }),
    supabase!.from("inspection_records").select("*, inspection_plans(title), asset_items(name)").order("inspected_at", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  inspectionAssetsCache = (assets ?? []) as AssetItem[];
  inspectionPlansCache = (plans ?? []) as InspectionPlan[];
  const inspectionRecords = (records ?? []) as InspectionRecord[];
  const today = new Date().toISOString().slice(0, 10);
  setText("[data-metric='inspection-active']", String(inspectionPlansCache.filter((plan) => plan.is_active).length));
  setText("[data-metric='inspection-due']", String(inspectionPlansCache.filter((plan) => plan.is_active && plan.next_due_date <= today).length));
  setText("[data-metric='inspection-repair']", String(inspectionRecords.filter((record) => record.result === "repair_needed").length));
  renderInspectionSelects(inspectionAssetsCache, inspectionPlansCache);
  renderInspectionPlans(inspectionPlansCache);
  renderInspectionRecords(inspectionRecords);
}

function renderInspectionSelects(assets: AssetItem[], plans: InspectionPlan[]) {
  const assetSelect = qs<HTMLSelectElement>("[data-inspection-asset-select]");
  if (assetSelect) {
    assetSelect.disabled = assets.length === 0;
    assetSelect.innerHTML = assets.length
      ? assets.map((asset) => `<option value="${asset.id}">${escapeHtml(asset.name)} / ${escapeHtml(asset.location)}</option>`).join("")
      : `<option value="">資産はありません</option>`;
  }

  const planSelect = qs<HTMLSelectElement>("[data-inspection-plan-select]");
  const activePlans = plans.filter((plan) => plan.is_active);
  if (planSelect) {
    planSelect.disabled = activePlans.length === 0;
    planSelect.innerHTML = activePlans.length
      ? activePlans.map((plan) => `<option value="${plan.id}">${escapeHtml(plan.title)} / ${escapeHtml(plan.asset_items?.name ?? "資産")}</option>`).join("")
      : `<option value="">有効な点検計画はありません</option>`;
  }
}

function renderInspectionPlans(plans: InspectionPlan[]) {
  const container = qs("[data-inspection-plan-list]");
  if (!container) return;
  if (!plans.length) {
    container.innerHTML = `<p class="meta">点検計画はありません。</p>`;
    return;
  }
  container.innerHTML = plans
    .map(
      (plan) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(plan.title)}</strong>
              <p class="meta">${escapeHtml(plan.asset_items?.name ?? "資産")} / ${inspectionFrequencyLabels[plan.frequency]} / 次回 ${escapeHtml(plan.next_due_date)}</p>
            </div>
            <span class="badge ${plan.is_active ? "success" : "danger"}">${plan.is_active ? "有効" : "停止"}</span>
          </div>
          ${plan.note ? `<p>${escapeHtml(plan.note)}</p>` : ""}
        </article>
      `,
    )
    .join("");
}

function renderInspectionRecords(records: InspectionRecord[]) {
  const container = qs("[data-inspection-record-list]");
  if (!container) return;
  if (!records.length) {
    container.innerHTML = `<p class="meta">点検記録はありません。</p>`;
    return;
  }
  container.innerHTML = records
    .map(
      (record) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(record.inspection_plans?.title ?? "点検")}</strong>
              <p class="meta">${escapeHtml(record.asset_items?.name ?? "資産")} / ${escapeHtml(record.inspected_at)}</p>
            </div>
            ${inspectionResultBadge(record.result)}
          </div>
          <p>${escapeHtml(record.note)}</p>
          ${record.maintenance_request_id ? `<p class="meta">修繕依頼へ連携済み</p>` : ""}
        </article>
      `,
    )
    .join("");
}

async function initAdmin() {
  if (!isAdmin()) {
    qs(".main")!.innerHTML = `<section class="panel"><h1>アクセス権限がありません</h1><p class="meta">管理者のみ利用できます。</p></section>`;
    return;
  }

  await Promise.all([renderAdminRooms(), renderProfiles()]);

  qs<HTMLFormElement>("[data-room-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const { error } = await supabase!.from("rooms").insert({
      name: String(form.get("name")),
      capacity: Number(form.get("capacity") || 0),
      notes: String(form.get("notes") || ""),
      is_active: true,
    });
    if (error) {
      setStatus("[data-room-status]", error.message, true);
      return;
    }
    event.currentTarget.reset();
    setStatus("[data-room-status]", "会議室を追加しました。");
    await renderAdminRooms();
  });
}

async function renderAdminRooms() {
  const { data } = await supabase!.from("rooms").select("*").order("name");
  const rooms = (data ?? []) as Room[];
  const container = qs("[data-room-list]");
  if (!container) return;
  container.innerHTML = rooms.length
    ? rooms
        .map(
          (room) => `
            <article class="list-item">
              <strong>${escapeHtml(room.name)}</strong>
              <p class="meta">定員 ${room.capacity ?? "-"} / ${escapeHtml(room.notes)}</p>
            </article>
          `,
        )
        .join("")
    : `<p class="meta">会議室は未登録です。</p>`;
}

async function renderProfiles() {
  const { data } = await supabase!.from("profiles").select("*").order("display_name");
  const container = qs("[data-profile-list]");
  if (!container) return;
  container.innerHTML = (data ?? [])
    .map(
      (profile: Profile) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(profile.display_name)}</strong>
              <p class="meta">${escapeHtml(profile.building)} ${escapeHtml(profile.unit_number)}</p>
            </div>
            <select class="select" data-role-select="${profile.id}">
              ${(["resident", "board_member", "admin"] as Role[])
                .map((role) => `<option value="${role}" ${profile.role === role ? "selected" : ""}>${roleLabels[role]}</option>`)
                .join("")}
            </select>
          </div>
        </article>
      `,
    )
    .join("");

  qsa<HTMLSelectElement>("[data-role-select]").forEach((select) => {
    select.addEventListener("change", async () => {
      const { error } = await supabase!.from("profiles").update({ role: select.value }).eq("id", select.dataset.roleSelect);
      if (error) alert(error.message);
    });
  });
}

function renderBookingList(selector: string, bookings: Booking[]) {
  const container = qs(selector);
  if (!container) return;
  if (!bookings.length) {
    container.innerHTML = `<p class="meta">予約はありません。</p>`;
    return;
  }
  container.innerHTML = bookings
    .map(
      (booking) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(booking.rooms?.name ?? "会議室")}</strong>
              <p class="meta">${formatDateTime(booking.start_at)} - ${formatDateTime(booking.end_at)}</p>
            </div>
            ${statusBadge(booking.status)}
          </div>
          <p>${escapeHtml(booking.purpose)}</p>
        </article>
      `,
    )
    .join("");
}

function renderCalendar<T extends { start_at: string }>(
  selector: string,
  month: Date,
  items: T[],
  label: (item: T) => string,
) {
  const container = qs(selector);
  if (!container) return;
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells: string[] = [];

  for (let day = 1; day <= end.getDate(); day += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), day);
    const dayItems = items.filter((item) => {
      const itemDate = new Date(item.start_at);
      return (
        itemDate.getFullYear() === date.getFullYear() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getDate() === date.getDate()
      );
    });
    cells.push(`
      <div class="day">
        <strong>${day}</strong>
        ${dayItems.map((item) => `<span class="day-item">${label(item)}</span>`).join("")}
      </div>
    `);
  }

  container.innerHTML = cells.join("");
}

function statusBadge(status: BookingStatus) {
  const className = status === "approved" ? "success" : status === "pending" ? "warning" : "danger";
  return `<span class="badge ${className}">${statusLabels[status]}</span>`;
}

function documentStatusBadge(status: DocumentStatus) {
  const className = status === "approved" ? "success" : status === "review" ? "warning" : "danger";
  return `<span class="badge ${className}">${documentStatusLabels[status]}</span>`;
}

function maintenanceStatusBadge(status: MaintenanceStatus) {
  const className = status === "resolved" || status === "closed" ? "success" : status === "open" ? "warning" : "";
  return `<span class="badge ${className}">${maintenanceStatusLabels[status]}</span>`;
}

function assetStatusBadge(status: AssetStatus) {
  const className = status === "active" ? "success" : status === "inspection_due" ? "warning" : "danger";
  return `<span class="badge ${className}">${assetStatusLabels[status]}</span>`;
}

function contractStatusBadge(status: ContractStatus) {
  const className = status === "active" ? "success" : status === "renewal_due" ? "warning" : "danger";
  return `<span class="badge ${className}">${contractStatusLabels[status]}</span>`;
}

function safetyEventStatusBadge(status: SafetyEventStatus) {
  const className = status === "completed" ? "success" : status === "active" || status === "planned" ? "warning" : "danger";
  return `<span class="badge ${className}">${safetyEventStatusLabels[status]}</span>`;
}

function boardTaskStatusBadge(status: BoardTaskStatus) {
  const className = status === "done" ? "success" : status === "open" || status === "in_progress" ? "warning" : "danger";
  return `<span class="badge ${className}">${boardTaskStatusLabels[status]}</span>`;
}

function parkingPermitStatusBadge(status: ParkingPermitStatus) {
  const className = status === "active" ? "success" : status === "pending" ? "warning" : "danger";
  return `<span class="badge ${className}">${parkingPermitStatusLabels[status]}</span>`;
}

function residentRequestStatusBadge(status: ResidentRequestStatus) {
  const className = status === "resolved" || status === "closed" ? "success" : "warning";
  return `<span class="badge ${className}">${residentRequestStatusLabels[status]}</span>`;
}

function circularStatusBadge(status: CircularStatus, acknowledged: boolean) {
  if (acknowledged) return `<span class="badge success">確認済み</span>`;
  const className = status === "published" ? "warning" : "success";
  return `<span class="badge ${className}">${circularStatusLabels[status]}</span>`;
}

function lendingRequestStatusBadge(status: LendingRequestStatus) {
  const className = status === "returned" ? "success" : status === "pending" || status === "checked_out" ? "warning" : "danger";
  return `<span class="badge ${className}">${lendingRequestStatusLabels[status]}</span>`;
}

function dutyStatusBadge(status: DutyStatus) {
  const className = status === "done" ? "success" : status === "planned" ? "warning" : "danger";
  return `<span class="badge ${className}">${dutyStatusLabels[status]}</span>`;
}

function bulkyWasteStatusBadge(status: BulkyWasteStatus) {
  const className = status === "completed" ? "success" : status === "submitted" || status === "scheduled" ? "warning" : "danger";
  return `<span class="badge ${className}">${bulkyWasteStatusLabels[status]}</span>`;
}

function meetingStatusBadge(status: MeetingStatus) {
  const className = status === "open" ? "warning" : status === "closed" ? "success" : "danger";
  return `<span class="badge ${className}">${meetingStatusLabels[status]}</span>`;
}

function inspectionResultBadge(result: InspectionResult) {
  const className = result === "ok" ? "success" : result === "watch" ? "warning" : "danger";
  return `<span class="badge ${className}">${inspectionResultLabels[result]}</span>`;
}

void init();
