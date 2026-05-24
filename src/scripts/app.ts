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

type DocumentStatus = "review" | "board_review" | "chair_review" | "president_review" | "approved" | "rejected" | "archived";
type DocumentKind = "minutes" | "rule" | "estimate" | "approval" | "other";
type DocumentApprovalAction = "approved" | "rejected";
type DocumentApprovalStage = "board" | "chair" | "president";

type ManagementDocument = {
  id: string;
  title: string;
  kind: DocumentKind;
  version: string;
  summary: string;
  file_url: string | null;
  markdown_body: string;
  current_version_id: string | null;
  crdt_snapshot_id: string | null;
  status: DocumentStatus;
  created_by: string;
  updated_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "display_name"> | null;
};

type DocumentVersion = {
  id: string;
  document_id: string;
  version_label: string;
  markdown_body: string;
  summary: string | null;
  created_by: string;
  created_at: string;
  profiles?: Pick<Profile, "display_name"> | null;
};

type DocumentCrdtSnapshot = {
  id: string;
  document_id: string;
  yjs_update: string | number[];
  markdown_body: string;
  created_by: string;
  created_at: string;
};

type DocumentApproval = {
  id: string;
  document_id: string;
  actor_id: string;
  stage: DocumentApprovalStage;
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
  stage: DocumentApprovalStage;
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
  circulars?: Pick<Circular, "title" | "kind" | "target_role"> | null;
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

type ActivityLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  detail: string | null;
  created_at: string;
  profiles?: Pick<Profile, "display_name"> | null;
};

type HomeWorkItem = {
  title: string;
  detail: string;
  href: string;
  badge?: string;
  tone?: "success" | "warning" | "danger";
};

const page = document.body.dataset.page ?? "home";
const base = import.meta.env.BASE_URL || "/";
let currentProfile: Profile | null = null;
let eventMonth = new Date();
let bookingCalendar: CalendarInstance | null = null;
let roomsCache: Room[] = [];
let bookingsCache: Booking[] = [];
let activeBookingId: string | null = null;
let bookingHoverCard: HTMLDivElement | null = null;
let documentFilter: DocumentStatus | "all" = "all";
let documentSearch = "";
let activeDocumentId: string | null = null;
let activeDocument: ManagementDocument | null = null;
let activeDocumentVersions: DocumentVersion[] = [];
let documentCollab: DocumentCollabSession | null = null;
let documentCollabRuntimePromise: Promise<DocumentCollabRuntime> | null = null;
let maintenanceFilter: MaintenanceStatus | "all" = "all";
let maintenanceSearch = "";
let financeFilter: FinanceEntryType | "all" = "all";
let financeSearch = "";
let assetFilter: AssetStatus | "all" = "all";
let assetSearch = "";
let vendorsCache: Vendor[] = [];
let vendorContractsCache: VendorContract[] = [];
let vendorSearch = "";
let contractSearch = "";
let taskFilter: BoardTaskStatus | "all" = "all";
let parkingSpacesCache: ParkingSpace[] = [];
let parkingSpaceSearch = "";
let parkingPermitSearch = "";
let residentRequestFilter: ResidentRequestStatus | "all" = "all";
let residentRequestSearch = "";
let lendingItemsCache: LendingItem[] = [];
let circularSearch = "";
let circularAckSearch = "";
let lendingItemSearch = "";
let lendingRequestSearch = "";
let dutyFilter: DutyStatus | "all" = "all";
let dutySearch = "";
let ownDutySearch = "";
let meetingSessionsCache: MeetingSession[] = [];
let meetingAgendaCache: MeetingAgendaItem[] = [];
let meetingSearch = "";
let agendaSearch = "";
let inspectionPlansCache: InspectionPlan[] = [];
let inspectionAssetsCache: AssetItem[] = [];
let inspectionPlanSearch = "";
let inspectionRecordSearch = "";
let wasteScheduleSearch = "";
let bulkyRequestSearch = "";
let activityLogsCache: ActivityLog[] = [];

type DocumentRealtimeChannel = {
  on: (type: string, filter: { event?: string }, callback: (payload: { event?: string; payload: unknown }) => void) => DocumentRealtimeChannel;
  subscribe: (callback?: (status: string) => void) => DocumentRealtimeChannel;
  send: (message: { type: string; event: string; payload: unknown }) => Promise<unknown>;
  track?: (payload: unknown) => Promise<unknown>;
  untrack?: () => Promise<unknown>;
};

type DocumentCollabSession = {
  documentId: string;
  runtime: DocumentCollabRuntime;
  ydoc: any;
  ytext: any;
  awareness: any;
  editor: any;
  channel: DocumentRealtimeChannel | null;
  destroy: () => void;
};

type DocumentCollabRuntime = {
  Y: typeof import("yjs");
  Awareness: typeof import("y-protocols/awareness").Awareness;
  encodeAwarenessUpdate: typeof import("y-protocols/awareness").encodeAwarenessUpdate;
  applyAwarenessUpdate: typeof import("y-protocols/awareness").applyAwarenessUpdate;
  EditorState: typeof import("@codemirror/state").EditorState;
  EditorView: typeof import("@codemirror/view").EditorView;
  placeholder: typeof import("@codemirror/view").placeholder;
  basicSetup: typeof import("codemirror").basicSetup;
  markdown: typeof import("@codemirror/lang-markdown").markdown;
  yCollab: typeof import("y-codemirror.next").yCollab;
};

type MockRealtime = {
  channel: (topic: string) => DocumentRealtimeChannel;
};

declare global {
  interface Window {
    __MEJIRO_MOCK_REALTIME__?: MockRealtime;
  }
}

const roleLabels: Record<Role, string> = {
  resident: "居民",
  board_member: "理事",
  chair: "主席",
  president: "理事長",
  admin: "管理者",
};
const assignableRoles: Role[] = ["resident", "board_member", "chair", "president", "admin"];

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
  review: "理事承認待ち",
  board_review: "理事承認待ち",
  chair_review: "主席承認待ち",
  president_review: "理事長承認待ち",
  approved: "承認済み",
  rejected: "差戻し",
  archived: "保管済み",
};

const documentStageLabels: Record<DocumentApprovalStage, string> = {
  board: "理事",
  chair: "主席",
  president: "理事長",
};

const documentStageSealNames: Record<DocumentApprovalStage, string> = {
  board: "理事印",
  chair: "主席印",
  president: "理事長印",
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

const residentRequestVisibilityLabels: Record<ResidentRequestVisibility, string> = {
  private: "理事・管理者のみ",
  board: "理事会共有",
  public: "住民共有",
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
  animateStatus(selector, error);
}

function showToast(message: string, variant: "success" | "error" = "success") {
  let region = qs<HTMLDivElement>("[data-toast-region]");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    region.dataset.toastRegion = "";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "false");
    document.body.append(region);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${variant}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `<strong>${variant === "error" ? "処理できませんでした" : "完了しました"}</strong><span></span>`;
  const body = toast.querySelector("span");
  if (body) body.textContent = message;
  region.append(toast);

  animate(toast, {
    opacity: [0, 1],
    translateY: [8, 0],
    duration: 180,
    easing: "easeOutQuad",
  });

  window.setTimeout(() => {
    animate(toast, {
      opacity: [1, 0],
      translateY: [0, 8],
      duration: 180,
      easing: "easeInQuad",
      onComplete: () => toast.remove(),
    });
  }, 5200);
}

function showErrorToast(message: string) {
  showToast(message, "error");
}

function confirmAction(message: string) {
  return window.confirm(message);
}

function confirmDocumentAction(status: DocumentStatus) {
  const messages: Partial<Record<DocumentStatus, string>> = {
    approved: "この管理文書を承認しますか？",
    rejected: "この管理文書を差戻しますか？",
    archived: "この管理文書を保管しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmParkingAction(status: ParkingPermitStatus) {
  const messages: Partial<Record<ParkingPermitStatus, string>> = {
    active: "この駐車・駐輪申請を承認しますか？",
    rejected: "この駐車・駐輪申請を却下しますか？",
    ended: "この駐車・駐輪利用を終了しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmCircularAction(status: CircularStatus) {
  if (status !== "archived") return true;
  return confirmAction("この回覧を保管しますか？");
}

function confirmLendingAction(status: LendingRequestStatus) {
  const messages: Partial<Record<LendingRequestStatus, string>> = {
    checked_out: "この貸出申請を貸出承認しますか？",
    rejected: "この貸出申請を却下しますか？",
    returned: "この貸出を返却済みにしますか？",
    lost: "この貸出品を紛失として記録しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmMaintenanceAction(status: MaintenanceStatus) {
  const messages: Partial<Record<MaintenanceStatus, string>> = {
    resolved: "この修繕依頼を完了にしますか？",
    closed: "この修繕依頼を終了しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmSurveyAction() {
  return confirmAction("この意見募集を締切りますか？");
}

function confirmSafetyAction(status: SafetyEventStatus) {
  const messages: Partial<Record<SafetyEventStatus, string>> = {
    completed: "この防災・安否イベントを完了にしますか？",
    cancelled: "この防災・安否イベントを中止しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmTaskAction(status: BoardTaskStatus) {
  const messages: Partial<Record<BoardTaskStatus, string>> = {
    done: "この理事会タスクを完了にしますか？",
    cancelled: "この理事会タスクを中止しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmResidentRequestAction(status: ResidentRequestStatus) {
  const messages: Partial<Record<ResidentRequestStatus, string>> = {
    resolved: "この住民相談を完了にしますか？",
    closed: "この住民相談を終了しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmDutyAction(status: DutyStatus) {
  const messages: Partial<Record<DutyStatus, string>> = {
    done: "この当番を完了にしますか？",
    missed: "この当番を未実施にしますか？",
    cancelled: "この当番を中止しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmBulkyWasteAction(status: BulkyWasteStatus) {
  const messages: Partial<Record<BulkyWasteStatus, string>> = {
    scheduled: "この粗大ごみ申請を予約済みにしますか？",
    completed: "この粗大ごみ申請を完了にしますか？",
    cancelled: "この粗大ごみ申請を取消しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function confirmMeetingAction(status: MeetingStatus) {
  const messages: Partial<Record<MeetingStatus, string>> = {
    closed: "この会議を終了しますか？",
    cancelled: "この会議を中止しますか？",
  };
  const message = messages[status];
  return !message || confirmAction(message);
}

function nullableUuid(value: string | null | undefined) {
  if (!value) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

async function recordActivity(entityType: string, entityId: string | null | undefined, action: string, detail: string) {
  if (!currentProfile) return;
  const { error } = await supabase!.from("activity_logs").insert({
    actor_id: currentProfile.id,
    entity_type: entityType,
    entity_id: nullableUuid(entityId),
    action,
    detail,
  });
  if (error) {
    console.warn(`activity log skipped: ${error.message}`);
  }
}

async function loadDocumentCollabRuntime() {
  documentCollabRuntimePromise ??= Promise.all([
    import("yjs"),
    import("y-protocols/awareness"),
    import("@codemirror/state"),
    import("@codemirror/view"),
    import("codemirror"),
    import("@codemirror/lang-markdown"),
    import("y-codemirror.next"),
  ]).then(([Y, awarenessModule, stateModule, viewModule, codemirrorModule, markdownModule, yCodemirrorModule]) => ({
    Y,
    Awareness: awarenessModule.Awareness,
    encodeAwarenessUpdate: awarenessModule.encodeAwarenessUpdate,
    applyAwarenessUpdate: awarenessModule.applyAwarenessUpdate,
    EditorState: stateModule.EditorState,
    EditorView: viewModule.EditorView,
    placeholder: viewModule.placeholder,
    basicSetup: codemirrorModule.basicSetup,
    markdown: markdownModule.markdown,
    yCollab: yCodemirrorModule.yCollab,
  }));
  return documentCollabRuntimePromise;
}

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function animatePageEntry() {
  if (shouldReduceMotion()) return;
  animate(".panel, .card, .page-head, .login-visual > *, .login-form-wrap", {
    opacity: [0, 1],
    translateY: [10, 0],
    delay: stagger(45),
    duration: 420,
    ease: "out(3)",
  });
}

function animateList(container: Element | null) {
  if (!container || shouldReduceMotion()) return;
  const items = Array.from(container.querySelectorAll(".list-item"));
  if (items.length) {
    animate(items, {
      opacity: [0, 1],
      translateY: [6, 0],
      delay: stagger(24),
      duration: 220,
      ease: "out(3)",
    });
    return;
  }
  const emptyState = container.querySelector(".meta");
  if (emptyState) {
    animate(emptyState, {
      opacity: [0, 1],
      duration: 180,
      ease: "out(2)",
    });
  }
}

function animateStatus(selector: string, error = false) {
  const element = qs(selector);
  if (!element || shouldReduceMotion() || !element.textContent.trim()) return;
  animate(element, {
    opacity: [0.35, 1],
    translateX: error ? [-4, 0] : [0, 0],
    duration: error ? 220 : 180,
    ease: "out(3)",
  });
}

function revealElement(element: Element | null) {
  if (!element || shouldReduceMotion()) return;
  animate(element, {
    opacity: [0, 1],
    translateY: [8, 0],
    duration: 240,
    ease: "out(3)",
  });
}

function hideElement(element: Element | null) {
  if (!element) return;
  if (shouldReduceMotion()) {
    element.classList.add("hidden");
    return;
  }
  animate(element, {
    opacity: [1, 0],
    translateY: [0, 6],
    duration: 160,
    ease: "in(2)",
  });
  window.setTimeout(() => {
    element.classList.add("hidden");
    element.removeAttribute("style");
  }, 170);
}

function openModalWithMotion(element: Element | null) {
  if (!element) return;
  element.classList.remove("hidden");
  if (shouldReduceMotion()) return;
  const modalPanel = element.querySelector(".modal");
  animate(element, {
    opacity: [0, 1],
    duration: 180,
    ease: "out(2)",
  });
  if (modalPanel) {
    animate(modalPanel, {
      opacity: [0, 1],
      scale: [0.98, 1],
      translateY: [10, 0],
      duration: 240,
      ease: "out(3)",
    });
  }
}

function closeModalWithMotion(element: Element | null) {
  if (!element) return;
  if (shouldReduceMotion()) {
    element.classList.add("hidden");
    return;
  }
  const modalPanel = element.querySelector(".modal");
  animate(element, {
    opacity: [1, 0],
    duration: 160,
    ease: "in(2)",
  });
  if (modalPanel) {
    animate(modalPanel, {
      opacity: [1, 0],
      scale: [1, 0.985],
      translateY: [0, 8],
      duration: 160,
      ease: "in(2)",
    });
  }
  window.setTimeout(() => {
    element.classList.add("hidden");
    element.removeAttribute("style");
    modalPanel?.removeAttribute("style");
  }, 170);
}

function initListMotion() {
  if (shouldReduceMotion()) return;
  qsa<HTMLElement>(".list").forEach((container) => {
    const observer = new MutationObserver(() => animateList(container));
    observer.observe(container, { childList: true });
    animateList(container);
  });
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

function normalizeSearchText(value: string | number | null | undefined) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function includesSearch(terms: Array<string | number | null | undefined>, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return terms.some((term) => normalizeSearchText(term).includes(normalizedQuery));
}

function canManage() {
  return currentProfile?.role === "admin" || currentProfile?.role === "board_member";
}

function canManageDocuments() {
  return currentProfile?.role === "admin" || currentProfile?.role === "board_member" || currentProfile?.role === "chair" || currentProfile?.role === "president";
}

function isAdmin() {
  return currentProfile?.role === "admin";
}

function isTargetedToCurrentRole(item: { target_role: Role | "all" }) {
  return item.target_role === "all" || item.target_role === currentProfile?.role || canManage();
}

function requireClient() {
  if (!hasSupabaseConfig || !supabase) {
    return "環境変数が未設定です。.env の必要項目を設定してください。";
  }
  return null;
}

function normalizeLoginError(message: string) {
  if (message.includes("Invalid login credentials")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (message.includes("Database error querying schema") || message.includes("unexpected_failure")) {
    return "Supabase Auth のデータベース設定でエラーが発生しています。管理者に Auth Logs / Postgres Logs と未適用の schema.sql / migration を確認してもらってください。";
  }
  return message;
}

function route(path: string) {
  return `${base}${path.replace(/^\//, "")}`;
}

async function init() {
  animatePageEntry();

  const configError = requireClient();
  if (configError) {
    setStatus("[data-status]", configError, true);
    setText("[data-user-name]", "未設定");
    setText("[data-user-role]", "接続設定なし");
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
  initSidebarMenu();
  applyRoleNavigation();
  initGlobalSearch();

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
  initListMotion();
}

function initSidebarMenu() {
  const sidebar = qs<HTMLElement>(".sidebar");
  const toggle = qs<HTMLButtonElement>("[data-sidebar-toggle]");
  if (!sidebar || !toggle) return;

  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const syncExpandedState = () => {
    const shouldExpand = !mobileQuery.matches;
    sidebar.classList.toggle("is-expanded", shouldExpand);
    toggle.setAttribute("aria-expanded", String(shouldExpand));
  };

  syncExpandedState();
  mobileQuery.addEventListener("change", syncExpandedState);

  toggle.addEventListener("click", () => {
    const expanded = sidebar.classList.toggle("is-expanded");
    toggle.setAttribute("aria-expanded", String(expanded));
  });

  qsa<HTMLAnchorElement>(".nav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (!mobileQuery.matches) return;
      sidebar.classList.remove("is-expanded");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function applyRoleNavigation() {
  if (!isAdmin()) qs("[data-nav-group='admin']")?.remove();
}

function initGlobalSearch() {
  const search = qs<HTMLElement>("[data-global-search]");
  const input = qs<HTMLInputElement>("[data-global-search-input]");
  const results = qs<HTMLElement>("[data-global-search-results]");
  if (!search || !input || !results) return;
  let activeIndex = -1;
  const normalizeSearchText = (value: string) => value.toLowerCase();
  const compactSearchText = (value: string) => normalizeSearchText(value).replace(/\s+/g, "");
  const keywordByLabel: Record<string, string> = {
    ホーム: "dashboard ダッシュボード 今日 対応 期限",
    会議室: "予約 承認 却下 利用 部屋",
    "通知・課題": "お知らせ 課題 未読 共有",
    年間行事: "行事 イベント 予定 カレンダー",
    相談苦情: "相談 苦情 要望 受付 対応",
    ごみ資源: "ごみ 資源 粗大 粗大ごみ 申請 受付待ち 回収",
    管理文書: "文書 承認 稟議 議事録 規約",
    意見収集: "アンケート 投票 意見",
    理事タスク: "タスク 担当 進捗 理事 期限 期限超過 期日",
    回覧配布: "回覧 配布 確認 未確認 未読",
    会議治理: "会議 議案 採決 出欠",
    修繕工事: "修繕 依頼 工事 故障",
    収支台帳: "会計 収支 収入 支出",
    資産台帳: "資産 点検 備品",
    業者契約: "業者 契約 更新 委託",
    住民名簿: "住民 世帯 名簿",
    防災安否: "防災 安否 訓練",
    駐車駐輪: "駐車 駐輪 申請 承認",
    鍵貸出: "鍵 備品 貸出 返却 承認",
    当番巡回: "当番 巡回 予定",
    長期点検: "点検 長期 期限 計画",
    管理: "管理 権限 ユーザー 履歴 操作",
  };

  const items = qsa<HTMLAnchorElement>(".nav .nav-link")
    .filter((link) => !link.closest(".nav-section")?.classList.contains("hidden"))
    .map((link) => {
      const section = link.closest(".nav-section");
      const group = section?.querySelector(".nav-group-label")?.textContent?.trim() ?? "";
      const label = link.textContent?.trim() ?? "";
      const keywords = keywordByLabel[label] ?? "";
      return {
        href: link.href,
        label,
        group,
        haystack: normalizeSearchText(`${label} ${group} ${keywords}`),
        compactHaystack: compactSearchText(`${label} ${group} ${keywords}`),
      };
    });

  const closeResults = () => {
    activeIndex = -1;
    results.classList.add("hidden");
    results.innerHTML = "";
  };

  const getResultLinks = () => qsa<HTMLAnchorElement>("[data-global-search-link]");

  const setActiveResult = (nextIndex: number) => {
    const links = getResultLinks();
    if (!links.length) {
      activeIndex = -1;
      return;
    }

    activeIndex = (nextIndex + links.length) % links.length;
    links.forEach((link, index) => {
      link.setAttribute("aria-selected", String(index === activeIndex));
      if (index === activeIndex) link.scrollIntoView({ block: "nearest" });
    });
  };

  const renderResults = () => {
    const query = normalizeSearchText(input.value.trim());
    if (!query) {
      closeResults();
      return;
    }

    const compactQuery = compactSearchText(query);
    const matches = items.filter((item) => item.haystack.includes(query) || item.compactHaystack.includes(compactQuery)).slice(0, 8);
    activeIndex = matches.length ? 0 : -1;
    results.classList.remove("hidden");
    results.innerHTML = matches.length
      ? matches
          .map(
            (item, index) => `
              <a class="global-search-link" href="${escapeHtml(item.href)}" data-global-search-link aria-selected="${index === activeIndex}">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.group)}</span>
              </a>
            `,
          )
          .join("")
      : `<p class="global-search-empty">該当する画面はありません。</p>`;
  };

  input.addEventListener("input", renderResults);
  input.addEventListener("focus", renderResults);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.classList.contains("hidden")) renderResults();
      setActiveResult(activeIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.classList.contains("hidden")) renderResults();
      setActiveResult(activeIndex - 1);
      return;
    }
    if (event.key === "Enter") {
      const links = getResultLinks();
      if (links[activeIndex]) {
        event.preventDefault();
        links[activeIndex].click();
      }
      return;
    }
    if (event.key === "Escape") {
      input.value = "";
      closeResults();
    }
  });
  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && search.contains(event.target)) return;
    closeResults();
  });
}

async function initLogin() {
  const { data } = await supabase!.auth.getSession();
  if (data.session) {
    window.location.href = route("/");
    return;
  }

  qs<HTMLFormElement>("[data-login-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    setStatus("[data-status]", "ログイン中...");
    const { error } = await supabase!.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setStatus("[data-status]", normalizeLoginError(error.message), true);
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
  const [
    { data: bookings },
    { data: notices },
    { data: events },
    { data: documents },
    { data: maintenanceRequests },
    { data: parkingPermits },
    { data: residentRequests },
    { data: lendingRequests },
    { data: circulars },
    { data: circularAcknowledgements },
    { data: bulkyWasteRequests },
    { data: boardTasks },
    { data: assets },
    { data: contracts },
    { data: duties },
    { data: inspectionPlans },
    unread,
  ] = await Promise.all([
    supabase!
      .from("room_bookings")
      .select("id, user_id, purpose, start_at, end_at, status, rooms(name)")
      .order("start_at", { ascending: true })
      .limit(5),
    supabase!.from("notices").select("*").order("created_at", { ascending: false }).limit(20),
    supabase!.from("events").select("*").order("start_at", { ascending: true }).limit(5),
    supabase!.from("management_documents").select("id, status").in("status", ["review", "board_review", "chair_review", "president_review"]),
    supabase!.from("maintenance_requests").select("id, title, status, requester_id").in("status", ["open", "in_progress"]),
    supabase!.from("parking_permits").select("id, user_id, vehicle_label, status").eq("status", "pending"),
    supabase!.from("resident_requests").select("id, title, status, requester_id").in("status", ["open", "in_progress"]),
    supabase!.from("lending_requests").select("id, user_id, purpose, status").in("status", ["pending", "checked_out"]),
    supabase!.from("circulars").select("id, title, status, target_role, due_date").eq("status", "published"),
    supabase!.from("circular_acknowledgements").select("circular_id").eq("user_id", currentProfile!.id),
    supabase!.from("bulky_waste_requests").select("id, user_id, item_name, status").eq("status", "submitted"),
    supabase!.from("board_tasks").select("id, title, status, due_date, assignee_id").in("status", ["open", "in_progress"]),
    supabase!.from("asset_items").select("id, name, status, inspection_due_at"),
    supabase!.from("vendor_contracts").select("id, title, status, end_date").order("end_date", { ascending: true }),
    supabase!.from("duty_assignments").select("id, title, status, scheduled_date, assignee_id"),
    supabase!.from("inspection_plans").select("id, title, is_active, next_due_date").eq("is_active", true),
    countUnreadNotices(),
  ]);

  const pendingBookings = (bookings ?? []).filter((booking) => booking.status === "pending").length;
  const pendingDocuments = documents?.length ?? 0;
  const canHandleOperations = canManage();
  const canHandleDocuments = canManageDocuments();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const dueSoon = new Date(now);
  dueSoon.setDate(now.getDate() + 7);
  const dueLimit = dueSoon.toISOString().slice(0, 10);
  const monthEvents = (events ?? []).filter((event) => {
    const date = new Date(event.start_at);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;
  const openMaintenance = (maintenanceRequests ?? []).filter((item) => item.status === "open").length;
  const openResidentRequests = (residentRequests ?? []).filter((item) => item.status === "open").length;
  const pendingParking = (parkingPermits ?? []).filter((item) => item.status === "pending").length;
  const pendingLending = (lendingRequests ?? []).filter((item) => item.status === "pending").length;
  const ownOpenMaintenance = (maintenanceRequests ?? []).filter((item) => item.status === "open" && item.requester_id === currentProfile?.id).length;
  const ownOpenResidentRequests = (residentRequests ?? []).filter((item) => item.status === "open" && item.requester_id === currentProfile?.id).length;
  const ownPendingParking = (parkingPermits ?? []).filter((item) => item.status === "pending" && item.user_id === currentProfile?.id).length;
  const ownPendingLending = (lendingRequests ?? []).filter((item) => item.status === "pending" && item.user_id === currentProfile?.id).length;
  const acknowledgedCircularIds = new Set((circularAcknowledgements ?? []).map((item) => item.circular_id));
  const visibleCirculars = ((circulars ?? []) as Pick<Circular, "id" | "target_role">[]).filter(isTargetedToCurrentRole);
  const unreadCirculars = visibleCirculars.filter((item) => !acknowledgedCircularIds.has(item.id)).length;
  const submittedBulkyWaste = (bulkyWasteRequests ?? []).filter((item) => item.status === "submitted").length;
  const ownSubmittedBulkyWaste = (bulkyWasteRequests ?? []).filter((item) => item.status === "submitted" && item.user_id === currentProfile?.id).length;
  const boardTaskDueItems = (boardTasks ?? []).filter(
    (item) => item.status !== "done" && item.due_date && item.due_date <= dueLimit && (canHandleOperations || item.assignee_id === currentProfile?.id),
  );
  const assetDueItems = (assets ?? []).filter((item) => item.inspection_due_at && item.inspection_due_at <= dueLimit);
  const inspectionDueItems = (inspectionPlans ?? []).filter((item) => item.is_active && item.next_due_date <= dueLimit);
  const dutyDueItems = (duties ?? []).filter((item) => item.status === "planned" && item.scheduled_date <= today && (canHandleOperations || item.assignee_id === currentProfile?.id));
  const contractRiskItems = (contracts ?? []).filter((item) => item.status === "renewal_due" || item.status === "expired" || contractStatusFromEndDate(item.end_date) !== "active");
  const visibleBookings = canHandleOperations ? (bookings ?? []) : (bookings ?? []).filter((booking) => booking.user_id === currentProfile?.id);

  const actionItems: HomeWorkItem[] = [
    ...(canHandleOperations
      ? [
          {
            title: "会議室予約の承認",
            detail: `${pendingBookings}件の予約が承認待ちです。`,
            href: route("/rooms/"),
            badge: String(pendingBookings),
            tone: pendingBookings ? "warning" : "success",
          },
        ]
      : []),
    ...(!canHandleOperations
      ? [
          {
            title: "修繕依頼の状況",
            detail: `${ownOpenMaintenance}件の依頼が受付中です。`,
            href: route("/maintenance/"),
            badge: String(ownOpenMaintenance),
            tone: ownOpenMaintenance ? "warning" : "success",
          },
          {
            title: "相談・苦情の状況",
            detail: `${ownOpenResidentRequests}件の相談が受付中です。`,
            href: route("/requests/"),
            badge: String(ownOpenResidentRequests),
            tone: ownOpenResidentRequests ? "warning" : "success",
          },
          {
            title: "駐車・駐輪申請",
            detail: `${ownPendingParking}件の申請が承認待ちです。`,
            href: route("/parking/"),
            badge: String(ownPendingParking),
            tone: ownPendingParking ? "warning" : "success",
          },
          {
            title: "鍵・備品貸出",
            detail: `${ownPendingLending}件の申請が承認待ちです。`,
            href: route("/lending/"),
            badge: String(ownPendingLending),
            tone: ownPendingLending ? "warning" : "success",
          },
        ]
      : []),
    ...(canHandleDocuments
      ? [
          {
            title: "管理文書の承認",
            detail: `${pendingDocuments}件の文書が承認フロー中です。`,
            href: route("/documents/"),
            badge: String(pendingDocuments),
            tone: pendingDocuments ? "warning" : "success",
          },
        ]
      : []),
    ...(canHandleOperations
      ? [
          {
            title: "修繕依頼の受付",
            detail: `${openMaintenance}件が未着手です。`,
            href: route("/maintenance/"),
            badge: String(openMaintenance),
            tone: openMaintenance ? "warning" : "success",
          },
          {
            title: "相談・苦情の受付",
            detail: `${openResidentRequests}件が受付中です。`,
            href: route("/requests/"),
            badge: String(openResidentRequests),
            tone: openResidentRequests ? "warning" : "success",
          },
          {
            title: "駐車・駐輪申請",
            detail: `${pendingParking}件が承認待ちです。`,
            href: route("/parking/"),
            badge: String(pendingParking),
            tone: pendingParking ? "warning" : "success",
          },
          {
            title: "鍵・備品貸出",
            detail: `${pendingLending}件が貸出承認待ちです。`,
            href: route("/lending/"),
            badge: String(pendingLending),
            tone: pendingLending ? "warning" : "success",
          },
        ]
      : []),
    {
      title: "回覧の確認",
      detail: `${unreadCirculars}件の未確認回覧があります。`,
      href: route("/circulars/"),
      badge: String(unreadCirculars),
      tone: unreadCirculars ? "warning" : "success",
    },
    {
      title: "粗大ごみ申請",
      detail: `${canHandleOperations ? submittedBulkyWaste : ownSubmittedBulkyWaste}件が受付待ちです。`,
      href: route("/waste/"),
      badge: String(canHandleOperations ? submittedBulkyWaste : ownSubmittedBulkyWaste),
      tone: (canHandleOperations ? submittedBulkyWaste : ownSubmittedBulkyWaste) ? "warning" : "success",
    },
  ];
  const riskItems: HomeWorkItem[] = [
    ...(canHandleOperations
      ? [
          {
            title: "資産点検期限",
            detail: `${assetDueItems.length}件が期限内または期限超過です。`,
            href: route("/assets/"),
            badge: String(assetDueItems.length),
            tone: assetDueItems.length ? "danger" : "success",
          },
          {
            title: "長期点検期限",
            detail: `${inspectionDueItems.length}件の点検計画が近づいています。`,
            href: route("/inspections/"),
            badge: String(inspectionDueItems.length),
            tone: inspectionDueItems.length ? "warning" : "success",
          },
        ]
      : []),
    {
      title: "当番・巡回期限",
      detail: `${dutyDueItems.length}件が本日以前の予定です。`,
      href: route("/duties/"),
      badge: String(dutyDueItems.length),
      tone: dutyDueItems.length ? "warning" : "success",
    },
    {
      title: "理事会タスク期限",
      detail: `${boardTaskDueItems.length}件が期限内または期限超過です。`,
      href: route("/tasks/"),
      badge: String(boardTaskDueItems.length),
      tone: boardTaskDueItems.length ? "warning" : "success",
    },
    ...(canHandleOperations
      ? [
          {
            title: "契約更新注意",
            detail: `${contractRiskItems.length}件の契約を確認できます。`,
            href: route("/vendors/"),
            badge: String(contractRiskItems.length),
            tone: contractRiskItems.length ? "warning" : "success",
          },
        ]
      : []),
  ];

  setText("[data-metric='pending-bookings']", String((canHandleOperations ? pendingBookings : 0) + (canHandleDocuments ? pendingDocuments : 0)));
  setText("[data-metric='unread-notices']", String(unread));
  setText("[data-metric='month-events']", String(monthEvents));
  setText("[data-metric='home-actions']", String(actionItems.reduce((sum, item) => sum + Number(item.badge ?? 0), 0)));
  setText("[data-metric='home-risks']", String(riskItems.reduce((sum, item) => sum + Number(item.badge ?? 0), 0)));
  renderHomeWorkItems("[data-home-actions]", actionItems);
  renderHomeWorkItems("[data-home-risk-list]", riskItems);
  renderBookingList("[data-home-bookings]", visibleBookings as Booking[]);
  renderNoticeList("[data-home-notices]", ((notices ?? []) as Notice[]).filter(isTargetedToCurrentRole).slice(0, 5), false);
  renderEventList("[data-home-events]", (events ?? []) as EventItem[]);
}

function renderHomeWorkItems(selector: string, items: HomeWorkItem[]) {
  const container = qs(selector);
  if (!container) return;
  container.innerHTML = items
    .map(
      (item) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(item.title)}</strong>
              <p class="meta">${escapeHtml(item.detail)}</p>
            </div>
            <span class="badge ${item.tone ?? ""}">${escapeHtml(item.badge ?? "")}</span>
          </div>
          <a class="text-link" href="${item.href}">確認する</a>
        </article>
      `,
    )
    .join("");
}

async function initRooms() {
  await loadRoomsIntoSelect();
  await initBookingCalendar();
  bindBookingModal();

  qs<HTMLFormElement>("[data-booking-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
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

    const purpose = String(form.get("purpose"));
    const { data: booking, error } = await supabase!.from("room_bookings").insert({
      room_id: roomId,
      user_id: currentProfile!.id,
      purpose,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      status: "pending",
    }).select("id").single();

    if (error) {
      setStatus("[data-booking-status]", error.message, true);
      return;
    }

    formElement.reset();
    setStatus("[data-booking-status]", "予約申請を送信しました。");
    await recordActivity("room_booking", booking?.id ?? purpose, "created", `会議室予約 ${purpose} を申請しました。`);
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
    displayEventTime: false,
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
      if (!booking) return;
      renderBookingDetail(booking);
      if (canEditBooking(booking)) {
        openBookingModal(booking);
      }
    },
    eventDidMount: (info) => {
      const booking = bookingsCache.find((item) => item.id === info.event.id);
      if (!booking) return;
      const show = () => showBookingHoverCard(booking, info.el as HTMLElement);
      const hide = () => hideBookingHoverCard();
      info.el.addEventListener("mouseenter", show);
      info.el.addEventListener("mouseleave", hide);
      info.el.addEventListener("focusin", show);
      info.el.addEventListener("focusout", hide);
    },
    eventWillUnmount: () => {
      hideBookingHoverCard();
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
  await loadBookings();
  bookingCalendar?.refetchEvents();
  qs("[data-booking-detail]")?.classList.add("hidden");
  renderPendingBookings(bookingsCache.filter((booking) => booking.status === "pending"));
}

async function loadBookings() {
  const { data, error } = await supabase!
    .from("room_bookings")
    .select("id, room_id, user_id, purpose, start_at, end_at, status, rooms(name), profiles:profiles!room_bookings_user_id_fkey(display_name)")
    .order("start_at");

  if (error) {
    setStatus("[data-booking-status]", `予約読み込みに失敗しました: ${error.message}`, true);
    bookingsCache = [];
    return bookingsCache;
  }

  bookingsCache = (data ?? []) as Booking[];
  return bookingsCache;
}

async function refreshPendingBookings(forceReload = false) {
  if (forceReload || !bookingsCache.length) await loadBookings();
  renderPendingBookings(bookingsCache.filter((booking) => booking.status === "pending"));
}

function toCalendarEvent(booking: Booking) {
  const colors = statusColors[booking.status];
  const roomColor = roomColorFor(booking.room_id);
  return {
    id: booking.id,
    title: booking.purpose,
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
      roomName: booking.rooms?.name ?? "会議室",
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
  const editToggle = qs("[data-booking-detail-edit-toggle]");
  if (!detail || !body || !actions || !editToggle) return;
  activeBookingId = booking.id;

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

  const editable = canEditBooking(booking);
  editToggle.classList.toggle("hidden", !editable);
  actions.classList.toggle("hidden", !canManage() || booking.status !== "pending");

  qs<HTMLButtonElement>("[data-detail-edit]")!.onclick = () => {
    openBookingModal(booking);
  };

  actions.classList.toggle("hidden", !canManage() || booking.status !== "pending");
  qs<HTMLButtonElement>("[data-detail-approve]")!.onclick = () => updateBookingStatus(booking.id, "approved");
  qs<HTMLButtonElement>("[data-detail-reject]")!.onclick = () => updateBookingStatus(booking.id, "rejected");
  detail.classList.remove("hidden");
  revealElement(detail);
}

function canEditBooking(booking: Booking) {
  return booking.status === "pending" && (booking.user_id === currentProfile?.id || canManage());
}

function openBookingModal(booking: Booking) {
  activeBookingId = booking.id;
  const modal = qs("[data-booking-modal]");
  const roomSelect = qs<HTMLSelectElement>("[data-modal-room-select]");
  const startInput = qs<HTMLInputElement>("#modal-start-at");
  const endInput = qs<HTMLInputElement>("#modal-end-at");
  const purposeInput = qs<HTMLTextAreaElement>("#modal-purpose");
  if (!modal || !roomSelect || !startInput || !endInput || !purposeInput) return;

  roomSelect.innerHTML = roomsCache.map((room) => `<option value="${room.id}">${escapeHtml(room.name)}</option>`).join("");
  roomSelect.value = booking.room_id;
  startInput.value = toDateTimeLocal(new Date(booking.start_at));
  endInput.value = toDateTimeLocal(new Date(booking.end_at));
  purposeInput.value = booking.purpose;
  setStatus("[data-booking-modal-status]", "");
  openModalWithMotion(modal);
}

function closeBookingModal() {
  closeModalWithMotion(qs("[data-booking-modal]"));
  setStatus("[data-booking-modal-status]", "");
}

function bindBookingModal() {
  qs("[data-booking-modal-close]")?.addEventListener("click", () => closeBookingModal());
  qs("[data-booking-modal]")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) closeBookingModal();
  });

  qs<HTMLFormElement>("[data-booking-modal-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement) || !activeBookingId) return;
    const original = bookingsCache.find((booking) => booking.id === activeBookingId);
    if (!original || !canEditBooking(original)) {
      setStatus("[data-booking-modal-status]", "この予約は編集できません。", true);
      return;
    }

    const form = new FormData(formElement);
    const roomId = String(form.get("room_id"));
    const startAt = new Date(String(form.get("start_at")));
    const endAt = new Date(String(form.get("end_at")));
    const purpose = String(form.get("purpose"));

    if (endAt <= startAt) {
      setStatus("[data-booking-modal-status]", "終了時間は開始時間より後にしてください。", true);
      return;
    }

    const hasOverlap = await checkBookingOverlap(roomId, startAt.toISOString(), endAt.toISOString(), original.id);
    if (hasOverlap) {
      setStatus("[data-booking-modal-status]", "同じ時間帯に承認済み予約があります。", true);
      return;
    }

    let error: { message: string } | null = null;
    if (canManage()) {
      const result = await supabase!
        .from("room_bookings")
        .update({
          room_id: roomId,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          purpose,
        })
        .eq("id", original.id);
      error = result.error ? { message: result.error.message } : null;
    } else {
      const result = await supabase!.rpc("update_own_pending_booking", {
        p_booking_id: original.id,
        p_room_id: roomId,
        p_start_at: startAt.toISOString(),
        p_end_at: endAt.toISOString(),
        p_purpose: purpose,
      });
      error = result.error ? { message: result.error.message } : null;
    }

    if (error) {
      setStatus("[data-booking-modal-status]", error.message, true);
      return;
    }

    setStatus("[data-booking-modal-status]", "予約を更新しました。");
    await refreshBookingCalendar();
    const updated = bookingsCache.find((booking) => booking.id === original.id);
    if (updated) renderBookingDetail(updated);
    closeBookingModal();
  });

  qs<HTMLButtonElement>("[data-booking-delete]")?.addEventListener("click", async () => {
    if (!activeBookingId) return;
    const original = bookingsCache.find((booking) => booking.id === activeBookingId);
    if (!original || !canEditBooking(original)) {
      setStatus("[data-booking-modal-status]", "この予約は削除できません。", true);
      return;
    }

    let error: { message: string } | null = null;
    if (canManage()) {
      const result = await supabase!
        .from("room_bookings")
        .update({ status: "cancelled" })
        .eq("id", original.id);
      error = result.error ? { message: result.error.message } : null;
    } else {
      const result = await supabase!.rpc("cancel_own_pending_booking", {
        p_booking_id: original.id,
      });
      error = result.error ? { message: result.error.message } : null;
    }
    if (error) {
      setStatus("[data-booking-modal-status]", error.message, true);
      return;
    }

    setStatus("[data-booking-modal-status]", "予約を取消しました。");
    await refreshBookingCalendar();
    qs("[data-booking-detail]")?.classList.add("hidden");
    closeBookingModal();
  });
}

function bookingHoverContent(booking: Booking) {
  return `
    <div><strong>${escapeHtml(booking.purpose)}</strong></div>
    <div>${escapeHtml(booking.rooms?.name ?? "会議室")} / ${statusLabels[booking.status]}</div>
    <div>${formatDateTime(booking.start_at)} - ${formatDateTime(booking.end_at)}</div>
    <div>申請者: ${escapeHtml(booking.profiles?.display_name ?? "申請者")}</div>
  `;
}

function showBookingHoverCard(booking: Booking, target: HTMLElement) {
  hideBookingHoverCard();
  const card = document.createElement("div");
  card.className = "booking-hover-card";
  card.innerHTML = bookingHoverContent(booking);
  document.body.append(card);
  const rect = target.getBoundingClientRect();
  const top = window.scrollY + rect.top - card.offsetHeight - 10;
  const left = window.scrollX + Math.min(rect.left, window.innerWidth - card.offsetWidth - 12);
  card.style.top = `${Math.max(window.scrollY + 8, top)}px`;
  card.style.left = `${Math.max(window.scrollX + 8, left)}px`;
  bookingHoverCard = card;
  revealElement(card);
}

function hideBookingHoverCard() {
  bookingHoverCard?.remove();
  bookingHoverCard = null;
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
  if (status === "approved" && !confirmAction("この会議室予約を承認しますか？")) return;
  if (status === "rejected" && !confirmAction("この会議室予約を却下しますか？")) return;

  if (status === "approved") {
    const booking = bookingsCache.find((item) => item.id === id);
    if (!booking) {
      showErrorToast("予約情報を読み込めませんでした。");
      return;
    }
    const hasOverlap = await checkBookingOverlap(booking.room_id, booking.start_at, booking.end_at, booking.id);
    if (hasOverlap) {
      showErrorToast("同じ時間帯に既に承認済みの予約があるため承認できません。");
      return;
    }
  }

  const { error } = await supabase!
    .from("room_bookings")
    .update({ status, approved_by: currentProfile!.id, approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("room_booking", id, status, status === "approved" ? "会議室予約を承認しました。" : "会議室予約を却下しました。");
  await refreshBookingCalendar();
}

async function checkBookingOverlap(roomId: string, startAt: string, endAt: string, excludeBookingId?: string) {
  let query = supabase!
    .from("room_bookings")
    .select("id")
    .eq("room_id", roomId)
    .eq("status", "approved")
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .limit(1);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data } = await query;
  return Boolean(data?.length);
}

async function initNotices() {
  qs("[data-notice-form]")?.classList.toggle("hidden", !canManage());
  await renderNoticesPage();

  qs<HTMLFormElement>("[data-notice-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: notice, error } = await supabase!.from("notices").insert({
      title,
      body: String(form.get("body")),
      kind: String(form.get("kind")),
      target_role: String(form.get("target_role")),
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-notice-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-notice-status]", "通知を発行しました。");
    await recordActivity("notice", notice?.id ?? title, "created", `通知 ${title} を発行しました。`);
    await renderNoticesPage();
  });
}

async function renderNoticesPage() {
  const { data } = await supabase!.from("notices").select("*").order("created_at", { ascending: false });
  renderNoticeList("[data-notice-list]", ((data ?? []) as Notice[]).filter(isTargetedToCurrentRole), true);
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
              <p class="meta">${noticeKindLabels[notice.kind]} / ${formatDateTime(notice.created_at)} / 対象 ${roleLabels[notice.target_role as Role] ?? "全員"}</p>
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
  const { data: notices } = await supabase!.from("notices").select("id, target_role");
  const { data: reads } = await supabase!.from("notice_reads").select("notice_id").eq("user_id", currentProfile!.id);
  const readIds = new Set((reads ?? []).map((read) => read.notice_id));
  return ((notices ?? []) as Pick<Notice, "id" | "target_role">[]).filter((notice) => isTargetedToCurrentRole(notice) && !readIds.has(notice.id)).length;
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
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: eventItem, error } = await supabase!.from("events").insert({
      title,
      description: String(form.get("description") || ""),
      location: String(form.get("location") || ""),
      start_at: new Date(String(form.get("start_at"))).toISOString(),
      end_at: form.get("end_at") ? new Date(String(form.get("end_at"))).toISOString() : null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-event-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-event-status]", "行事を保存しました。");
    await recordActivity("event", eventItem?.id ?? title, "created", `行事 ${title} を保存しました。`);
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
  qs("[data-document-form]")?.classList.toggle("hidden", !canManageDocuments());
  await renderDocumentsPage();

  qs<HTMLButtonElement>("[data-document-close]")?.addEventListener("click", () => closeDocumentWorkspace());
  qs<HTMLButtonElement>("[data-document-save-version]")?.addEventListener("click", () => saveActiveDocumentVersion());
  qs<HTMLButtonElement>("[data-document-show-diff]")?.addEventListener("click", () => renderActiveDocumentDiff());
  qs<HTMLButtonElement>("[data-document-print]")?.addEventListener("click", () => renderActiveDocumentPrintView());

  qsa<HTMLButtonElement>("[data-document-filter]").forEach((button) => {
    button.addEventListener("click", async () => {
      documentFilter = (button.dataset.documentFilter as DocumentStatus | "all") ?? "all";
      qsa<HTMLButtonElement>("[data-document-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      await renderDocumentsPage();
    });
  });

  qs<HTMLInputElement>("[data-document-search]")?.addEventListener("input", async (event) => {
    documentSearch = event.currentTarget.value;
    await renderDocumentsPage();
  });

  qs<HTMLFormElement>("[data-document-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const markdownBody = String(form.get("markdown_body") || "").trim();
    const { data: document, error } = await supabase!.from("management_documents").insert({
      title,
      kind: String(form.get("kind")),
      version: String(form.get("version") || "1.0"),
      summary: summarizeMarkdown(markdownBody, title),
      markdown_body: markdownBody,
      status: "board_review",
      created_by: currentProfile!.id,
      updated_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-document-status]", error.message, true);
      return;
    }
    formElement.reset();
    const version = qs<HTMLInputElement>("#document-version");
    if (version) version.value = "1.0";
    setStatus("[data-document-status]", "文書を審査へ回しました。");
    await recordActivity("management_document", document?.id ?? title, "created", `管理文書 ${title} を審査へ回しました。`);
    await renderDocumentsPage();
  });
}

async function renderDocumentsPage() {
  let query = supabase!
    .from("management_documents")
    .select("*")
    .order("updated_at", { ascending: false });

  if (documentFilter !== "all" && documentFilter !== "review") query = query.eq("status", documentFilter);

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

  const allDocuments = ((documents ?? []) as ManagementDocument[]).filter((document) => documentFilter !== "review" || isDocumentApprovalStatus(document.status));
  const visibleDocuments = allDocuments.filter((document) =>
    includesSearch(
      [
        document.title,
        document.version,
        document.summary,
        document.markdown_body,
        document.profiles?.display_name,
        documentKindLabels[document.kind],
        documentStatusLabels[document.status],
      ],
      documentSearch,
    ),
  );
  setText("[data-metric='review-documents']", String(allDocuments.filter((document) => isDocumentApprovalStatus(document.status)).length));
  setText("[data-metric='approved-documents']", String(allDocuments.filter((document) => document.status === "approved").length));
  setText("[data-metric='sealed-documents']", String((seals ?? []).length));
  renderDocumentList(visibleDocuments);
  renderDocumentApprovals((approvals ?? []) as DocumentApproval[]);
  renderDocumentSeals((seals ?? []) as DocumentSeal[]);
}

function isDocumentApprovalStatus(status: DocumentStatus) {
  return status === "review" || status === "board_review" || status === "chair_review" || status === "president_review";
}

function documentStageForStatus(status: DocumentStatus): DocumentApprovalStage | null {
  if (status === "review" || status === "board_review") return "board";
  if (status === "chair_review") return "chair";
  if (status === "president_review") return "president";
  return null;
}

function nextDocumentStatusForStage(stage: DocumentApprovalStage): DocumentStatus {
  if (stage === "board") return "chair_review";
  if (stage === "chair") return "president_review";
  return "approved";
}

function canApproveDocumentStage(stage: DocumentApprovalStage) {
  if (currentProfile?.role === "admin") return true;
  if (stage === "board") return currentProfile?.role === "board_member";
  if (stage === "chair") return currentProfile?.role === "chair";
  return currentProfile?.role === "president";
}

function renderDocumentList(documents: ManagementDocument[]) {
  const container = qs("[data-document-list]");
  if (!container) return;
  if (!documents.length) {
    container.innerHTML = `<p class="meta">${documentSearch ? "検索条件に一致する文書はありません。" : "文書はありません。"}</p>`;
    return;
  }

  container.innerHTML = documents
    .map(
      (document) => {
        const stage = documentStageForStatus(document.status);
        const canActOnStage = stage ? canApproveDocumentStage(stage) : false;
        return `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>${escapeHtml(document.title)}</strong>
              <p class="meta">${documentKindLabels[document.kind]} / v${escapeHtml(document.version)} / ${formatDateTime(document.updated_at)}</p>
            </div>
            ${documentStatusBadge(document.status)}
          </div>
          <p>${escapeHtml(documentListExcerpt(document))}</p>
          <p class="meta">登録者 ${escapeHtml(document.profiles?.display_name ?? "管理者")}</p>
          ${
            canManageDocuments()
              ? `<div class="toolbar">
                  <button class="button secondary" type="button" data-document-open="${document.id}">Markdown編集</button>
                  ${
                    stage
                      ? `${canActOnStage ? `<button class="button" type="button" data-document-approve="${document.id}">${documentStageLabels[stage]}承認</button>` : `<span class="badge warning">${documentStageLabels[stage]}承認待ち</span>`}
                         <button class="button danger" type="button" data-document-reject="${document.id}">差戻し</button>`
                      : ""
                  }
                  ${
                    document.status === "rejected"
                      ? `<button class="button" type="button" data-document-resubmit="${document.id}">再審査へ回す</button>`
                      : ""
                  }
                  <button class="button secondary" type="button" data-document-archive="${document.id}">保管</button>
                </div>`
              : ""
          }
        </article>
      `;
      },
    )
    .join("");

  qsa<HTMLButtonElement>("[data-document-approve]").forEach((button) => {
    button.addEventListener("click", () => approveDocumentStage(button.dataset.documentApprove!));
  });
  qsa<HTMLButtonElement>("[data-document-open]").forEach((button) => {
    button.addEventListener("click", () => openDocumentWorkspace(button.dataset.documentOpen!));
  });
  qsa<HTMLButtonElement>("[data-document-reject]").forEach((button) => {
    button.addEventListener("click", () => rejectDocument(button.dataset.documentReject!));
  });
  qsa<HTMLButtonElement>("[data-document-resubmit]").forEach((button) => {
    button.addEventListener("click", () => updateDocumentStatus(button.dataset.documentResubmit!, "board_review"));
  });
  qsa<HTMLButtonElement>("[data-document-archive]").forEach((button) => {
    button.addEventListener("click", () => updateDocumentStatus(button.dataset.documentArchive!, "archived"));
  });
}

async function openDocumentWorkspace(id: string) {
  const document = await loadDocumentForAction(id);
  if (!document) return;
  activeDocumentId = id;
  activeDocument = document;
  const workspace = qs("[data-document-workspace]");
  workspace?.classList.remove("hidden");
  revealElement(workspace);
  qs("[data-document-print-view]")?.classList.add("hidden");
  qs("[data-document-diff-panel]")?.classList.add("hidden");
  setText("[data-document-editor-title]", document.title);
  setText("[data-document-editor-meta]", `${documentKindLabels[document.kind]} / v${document.version} / ${documentStatusLabels[document.status]}`);
  setStatus("[data-document-editor-status]", "協作セッションを準備しています。");
  await loadDocumentVersions(id);
  await startDocumentCollabSession(document);
}

function closeDocumentWorkspace() {
  documentCollab?.destroy();
  documentCollab = null;
  activeDocumentId = null;
  activeDocument = null;
  activeDocumentVersions = [];
  hideElement(qs("[data-document-workspace]"));
  qs("[data-document-print-view]")?.classList.add("hidden");
}

async function loadDocumentVersions(documentId: string) {
  const { data } = await supabase!
    .from("document_versions")
    .select("*, profiles(display_name)")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });
  activeDocumentVersions = (data ?? []) as DocumentVersion[];
  if (activeDocument && !activeDocumentVersions.length) {
    activeDocumentVersions = [{
      id: "current",
      document_id: activeDocument.id,
      version_label: activeDocument.version,
      markdown_body: documentMarkdown(activeDocument),
      summary: "現在の文書本文",
      created_by: activeDocument.created_by,
      created_at: activeDocument.created_at,
      profiles: activeDocument.profiles,
    }];
  }
  renderDocumentVersions();
}

async function startDocumentCollabSession(document: ManagementDocument) {
  documentCollab?.destroy();
  const parent = qs<HTMLElement>("[data-document-editor]");
  if (!parent) return;
  parent.innerHTML = "";
  const runtime = await loadDocumentCollabRuntime();

  const ydoc = new runtime.Y.Doc();
  const ytext = ydoc.getText("markdown");
  const snapshot = await loadDocumentCrdtSnapshot(document.id);
  if (snapshot) {
    try {
      runtime.Y.applyUpdate(ydoc, decodeBytea(snapshot.yjs_update));
    } catch {
      ytext.insert(0, snapshot.markdown_body || documentMarkdown(document));
    }
  } else {
    ytext.insert(0, documentMarkdown(document));
  }

  const awareness = new runtime.Awareness(ydoc);
  const userColor = colorForUser(currentProfile?.id ?? "user");
  awareness.setLocalStateField("user", {
    name: currentProfile?.display_name ?? "担当者",
    color: userColor,
    colorLight: `${userColor}33`,
  });

  const channel = createDocumentRealtimeChannel(document.id, ydoc, awareness, runtime);
  const view = new runtime.EditorView({
    state: runtime.EditorState.create({
      doc: ytext.toString(),
      extensions: [
        runtime.basicSetup,
        runtime.markdown(),
        runtime.EditorView.lineWrapping,
        runtime.placeholder("Markdownで本文を編集します。"),
        runtime.yCollab(ytext, awareness),
        runtime.EditorView.updateListener.of((update) => {
          if (update.docChanged) renderMarkdownPreview(ytext.toString());
        }),
      ],
    }),
    parent,
  });

  const updatePreview = () => renderMarkdownPreview(ytext.toString());
  ytext.observe(updatePreview);
  updatePreview();
  documentCollab = {
    documentId: document.id,
    runtime,
    ydoc,
    ytext,
    awareness,
    editor: view,
    channel,
    destroy: () => {
      ytext.unobserve(updatePreview);
      channel?.untrack?.();
      if (channel && supabase) supabase.removeChannel(channel as never);
      view.destroy();
      awareness.destroy();
      ydoc.destroy();
    },
  };
  renderPresence(awareness);
  setStatus("[data-document-editor-status]", "CRDT協作セッションに接続しました。");
}

async function loadDocumentCrdtSnapshot(documentId: string) {
  const { data } = await supabase!
    .from("document_crdt_snapshots")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(1);
  return ((data ?? []) as DocumentCrdtSnapshot[])[0] ?? null;
}

function createDocumentRealtimeChannel(documentId: string, ydoc: any, awareness: any, runtime: DocumentCollabRuntime) {
  const topic = `document-crdt:${documentId}`;
  const channel = window.__MEJIRO_MOCK_REALTIME__?.channel(topic)
    ?? supabase!.channel(topic, { config: { broadcast: { self: false }, presence: { key: currentProfile?.id ?? "user" } } }) as unknown as DocumentRealtimeChannel;
  const remoteOrigin = { remote: true };

  channel
    .on("broadcast", { event: "y-update" }, ({ payload }) => {
      const update = (payload as { update?: string })?.update;
      if (update) runtime.Y.applyUpdate(ydoc, base64ToUint8Array(update), remoteOrigin);
    })
    .on("broadcast", { event: "awareness" }, ({ payload }) => {
      const update = (payload as { update?: string })?.update;
      if (update) runtime.applyAwarenessUpdate(awareness, base64ToUint8Array(update), remoteOrigin);
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track?.({ user: currentProfile?.display_name ?? "担当者" });
      }
    });

  ydoc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === remoteOrigin) return;
    void channel.send({ type: "broadcast", event: "y-update", payload: { update: uint8ArrayToBase64(update) } });
  });

  awareness.on("update", ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    renderPresence(awareness);
    if (origin === remoteOrigin) return;
    const clients = added.concat(updated, removed);
    if (clients.length) {
      const update = runtime.encodeAwarenessUpdate(awareness, clients);
      void channel.send({ type: "broadcast", event: "awareness", payload: { update: uint8ArrayToBase64(update) } });
    }
  });

  const update = runtime.encodeAwarenessUpdate(awareness, [ydoc.clientID]);
  void channel.send({ type: "broadcast", event: "awareness", payload: { update: uint8ArrayToBase64(update) } });
  return channel;
}

async function saveActiveDocumentVersion() {
  if (!activeDocument || !documentCollab) return;
  const markdown = documentCollab.ytext.toString();
  const versionLabel = nextDocumentVersionLabel(activeDocumentVersions);
  const { data: version, error } = await supabase!
    .from("document_versions")
    .insert({
      document_id: activeDocument.id,
      version_label: versionLabel,
      markdown_body: markdown,
      summary: `CRDT協作セッションから保存 (${versionLabel})`,
      created_by: currentProfile!.id,
    })
    .select("*, profiles(display_name)")
    .single();
  if (error) {
    setStatus("[data-document-editor-status]", error.message, true);
    return;
  }

  const snapshotUpdate = documentCollab.runtime.Y.encodeStateAsUpdate(documentCollab.ydoc);
  const { data: snapshot } = await supabase!
    .from("document_crdt_snapshots")
    .insert({
      document_id: activeDocument.id,
      yjs_update: encodeBytea(snapshotUpdate),
      markdown_body: markdown,
      created_by: currentProfile!.id,
    })
    .select("*")
    .single();

  const patch: Partial<ManagementDocument> = {
    markdown_body: markdown,
    current_version_id: (version as DocumentVersion).id,
    crdt_snapshot_id: (snapshot as DocumentCrdtSnapshot | null)?.id ?? activeDocument.crdt_snapshot_id,
    updated_by: currentProfile!.id,
  };
  await supabase!.from("management_documents").update(patch).eq("id", activeDocument.id);
  activeDocument = { ...activeDocument, ...patch } as ManagementDocument;
  activeDocumentVersions.push(version as DocumentVersion);
  renderDocumentVersions();
  renderMarkdownPreview(markdown);
  setStatus("[data-document-editor-status]", `${versionLabel} を保存しました。`);
  await renderDocumentsPage();
}

function renderDocumentVersions() {
  const container = qs("[data-document-versions]");
  if (!container) return;
  if (!activeDocumentVersions.length) {
    container.innerHTML = `<p class="meta">版履歴はありません。</p>`;
    animateList(container);
    return;
  }
  container.innerHTML = activeDocumentVersions
    .slice()
    .reverse()
    .map((version) => `
      <article class="list-item">
        <div class="list-row">
          <div>
            <strong>${escapeHtml(version.version_label)}</strong>
            <p class="meta">${formatDateTime(version.created_at)} / ${escapeHtml(version.profiles?.display_name ?? "担当者")}</p>
          </div>
        </div>
        ${version.summary ? `<p>${escapeHtml(version.summary)}</p>` : ""}
      </article>
    `)
    .join("");
  animateList(container);
}

function renderActiveDocumentDiff() {
  const panel = qs("[data-document-diff-panel]");
  panel?.classList.remove("hidden");
  revealElement(panel);
  const container = qs("[data-document-diff]");
  if (!container) return;
  if (activeDocumentVersions.length < 2) {
    container.innerHTML = `<p class="meta">比較できる版がまだありません。</p>`;
    return;
  }
  const before = activeDocumentVersions[activeDocumentVersions.length - 2];
  const after = activeDocumentVersions[activeDocumentVersions.length - 1];
  container.innerHTML = renderLineDiff(before.markdown_body, after.markdown_body);
}

function renderActiveDocumentPrintView() {
  const container = qs("[data-document-print-view]");
  if (!container || !activeDocument || !documentCollab) return;
  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="print-head">
      <p class="eyebrow">PDF / Print</p>
      <h1>${escapeHtml(activeDocument.title)}</h1>
      <p class="meta">${documentKindLabels[activeDocument.kind]} / v${escapeHtml(activeDocument.version)} / ${formatDateTime(activeDocument.updated_at)}</p>
    </div>
    <article class="markdown-preview">${renderMarkdown(documentCollab.ytext.toString())}</article>
  `;
  window.setTimeout(() => window.print(), 50);
}

function renderMarkdownPreview(markdown: string) {
  const preview = qs("[data-document-preview]");
  if (preview) preview.innerHTML = renderMarkdown(markdown);
}

function renderMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let inList = false;
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeLines: string[] = [];

  const closeList = () => {
    if (inList) html.push("</ul>");
    inList = false;
  };
  const closeCodeBlock = () => {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : "";
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
    inCodeBlock = false;
    codeLanguage = "";
    codeLines = [];
  };

  for (const line of lines) {
    const fence = line.match(/^```\s*([A-Za-z0-9_-]+)?\s*$/);
    if (fence) {
      if (inCodeBlock) {
        closeCodeBlock();
      } else {
        closeList();
        inCodeBlock = true;
        codeLanguage = fence[1] ?? "";
        codeLines = [];
      }
    } else if (inCodeBlock) {
      codeLines.push(line);
    } else if (/^###\s+/.test(line)) {
      closeList();
      html.push(`<h3>${escapeHtml(line.replace(/^###\s+/, ""))}</h3>`);
    } else if (/^##\s+/.test(line)) {
      closeList();
      html.push(`<h2>${escapeHtml(line.replace(/^##\s+/, ""))}</h2>`);
    } else if (/^#\s+/.test(line)) {
      closeList();
      html.push(`<h1>${escapeHtml(line.replace(/^#\s+/, ""))}</h1>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) html.push("<ul>");
      inList = true;
      html.push(`<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`);
    } else if (line.trim()) {
      closeList();
      html.push(`<p>${escapeHtml(line)}</p>`);
    } else if (inList) {
      closeList();
    }
  }
  if (inCodeBlock) closeCodeBlock();
  closeList();
  return html.join("");
}

function renderLineDiff(beforeMarkdown: string, afterMarkdown: string) {
  const before = beforeMarkdown.split(/\r?\n/);
  const after = afterMarkdown.split(/\r?\n/);
  const rows: string[] = [];
  const max = Math.max(before.length, after.length);
  for (let index = 0; index < max; index += 1) {
    const left = before[index] ?? "";
    const right = after[index] ?? "";
    if (left === right) {
      rows.push(`<div class="diff-line same"> ${escapeHtml(right)}</div>`);
    } else {
      if (left) rows.push(`<div class="diff-line removed">- ${escapeHtml(left)}</div>`);
      if (right) rows.push(`<div class="diff-line added">+ ${escapeHtml(right)}</div>`);
    }
  }
  return rows.join("");
}

function renderPresence(awareness: any) {
  const container = qs("[data-document-presence]");
  if (!container) return;
  const states = Array.from(awareness.getStates().values()) as Array<{ user?: { name?: string; color?: string } }>;
  container.innerHTML = states
    .map((state) => {
      const user = state.user;
      if (!user) return "";
      return `<span class="presence-pill" style="--presence-color:${escapeHtml(user.color ?? "#176b5b")}">${escapeHtml(user.name ?? "担当者")}</span>`;
    })
    .join("");
  if (!shouldReduceMotion()) {
    animate(container.querySelectorAll(".presence-pill"), {
      opacity: [0, 1],
      translateY: [4, 0],
      delay: stagger(20),
      duration: 180,
      ease: "out(2)",
    });
  }
}

function nextDocumentVersionLabel(versions: DocumentVersion[]) {
  return `v${versions.length + 1}`;
}

function documentMarkdown(document: ManagementDocument) {
  return document.markdown_body || `# ${document.title}\n\n${document.summary}`;
}

function summarizeMarkdown(markdown: string, fallback: string) {
  const summary = markdown
    .split(/\r?\n/)
    .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" / ");
  return summary.slice(0, 180) || fallback;
}

function documentListExcerpt(document: ManagementDocument) {
  return summarizeMarkdown(document.markdown_body || document.summary, document.summary || document.title);
}

function colorForUser(id: string) {
  const colors = ["#176b5b", "#b75d29", "#285f8f", "#7a4f9a", "#9a3f52", "#4d7c2f"];
  const total = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}

function uint8ArrayToBase64(update: Uint8Array) {
  let binary = "";
  update.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToUint8Array(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function encodeBytea(update: Uint8Array) {
  return `\\x${Array.from(update).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function decodeBytea(value: string | number[]) {
  if (Array.isArray(value)) return Uint8Array.from(value);
  const hex = value.startsWith("\\x") ? value.slice(2) : value;
  const bytes = hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [];
  return Uint8Array.from(bytes);
}

async function updateDocumentStatus(id: string, status: DocumentStatus) {
  if (!confirmDocumentAction(status)) return;
  const approvedAt = status === "approved" ? new Date().toISOString() : null;
  const { error } = await supabase!
    .from("management_documents")
    .update({ status, updated_by: currentProfile!.id, approved_at: approvedAt })
    .eq("id", id);
  if (error) {
    showErrorToast(error.message);
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

  await recordActivity("management_document", id, status, `管理文書を${documentStatusLabels[status]}にしました。`);
  await renderDocumentsPage();
}

async function approveDocumentStage(id: string) {
  const document = await loadDocumentForAction(id);
  if (!document) return;
  const stage = documentStageForStatus(document.status);
  if (!stage) return;
  if (!canApproveDocumentStage(stage)) {
    showErrorToast(`${documentStageLabels[stage]}承認の権限がありません。`);
    return;
  }

  if (!confirmDocumentAction("approved")) return;

  const nextStatus = nextDocumentStatusForStage(stage);
  const approvedAt = nextStatus === "approved" ? new Date().toISOString() : null;
  const { error } = await supabase!
    .from("management_documents")
    .update({ status: nextStatus, updated_by: currentProfile!.id, approved_at: approvedAt })
    .eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }

  await supabase!.from("document_approvals").insert({
    document_id: id,
    actor_id: currentProfile!.id,
    stage,
    action: "approved",
    comment: `${documentStageLabels[stage]}承認しました。`,
  });

  await sealDocument(id, stage);
  await recordActivity("management_document", id, "approved", `${documentStageLabels[stage]}承認しました。`);
  await renderDocumentsPage();
}

async function rejectDocument(id: string) {
  const document = await loadDocumentForAction(id);
  if (!document) return;
  const stage = documentStageForStatus(document.status) ?? "board";
  if (!confirmDocumentAction("rejected")) return;
  const { error } = await supabase!
    .from("management_documents")
    .update({ status: "rejected", updated_by: currentProfile!.id, approved_at: null })
    .eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }

  await supabase!.from("document_approvals").insert({
    document_id: id,
    actor_id: currentProfile!.id,
    stage,
    action: "rejected",
    comment: `${documentStageLabels[stage]}段階で差戻しました。`,
  });

  await recordActivity("management_document", id, "rejected", `${documentStageLabels[stage]}段階で差戻しました。`);
  await renderDocumentsPage();
}

async function loadDocumentForAction(id: string) {
  const { data, error } = await supabase!.from("management_documents").select("*").eq("id", id).single();
  if (error) {
    showErrorToast(error.message);
    return null;
  }
  return data as ManagementDocument;
}

async function sealDocument(id: string, stage: DocumentApprovalStage) {
  const sealName = documentStageSealNames[stage];
  const note = currentProfile?.role === "admin"
    ? `管理者が${documentStageLabels[stage]}承認を代行し、電子印影を付与しました。`
    : `${documentStageLabels[stage]}承認により電子印影を付与しました。`;
  const { error } = await supabase!.from("document_seals").insert({
    document_id: id,
    sealed_by: currentProfile!.id,
    stage,
    seal_name: sealName,
    note,
  });
  if (error) {
    showErrorToast(error.message);
    return;
  }
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
              <p class="meta">${documentStageLabels[approval.stage]} / v${escapeHtml(approval.management_documents?.version ?? "-")} / ${formatDateTime(approval.created_at)} / ${escapeHtml(approval.profiles?.display_name ?? "担当者")}</p>
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
              <p class="meta">${documentStageLabels[seal.stage]} / v${escapeHtml(seal.management_documents?.version ?? "-")} / ${formatDateTime(seal.sealed_at)} / ${escapeHtml(seal.profiles?.display_name ?? "担当者")}</p>
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

  qs<HTMLInputElement>("[data-maintenance-search]")?.addEventListener("input", async (event) => {
    maintenanceSearch = event.currentTarget.value;
    await renderMaintenancePage();
  });

  qs<HTMLFormElement>("[data-maintenance-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: request, error } = await supabase!.from("maintenance_requests").insert({
      title,
      category: String(form.get("category")),
      priority: String(form.get("priority")),
      location: String(form.get("location")),
      description: String(form.get("description")),
      requester_id: currentProfile!.id,
      status: "open",
    }).select("id").single();
    if (error) {
      setStatus("[data-maintenance-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-maintenance-status]", "修繕依頼を受け付けました。");
    await recordActivity("maintenance_request", request?.id ?? title, "created", `修繕依頼 ${title} を受け付けました。`);
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
  const allRequests = (data ?? []) as MaintenanceRequest[];
  const requests = canManage() ? allRequests : allRequests.filter((request) => request.requester_id === currentProfile?.id);
  const visibleRequests = requests.filter((request) =>
    includesSearch(
      [
        request.title,
        request.location,
        request.description,
        request.handler_note,
        maintenanceCategoryLabels[request.category],
        maintenancePriorityLabels[request.priority],
        maintenanceStatusLabels[request.status],
      ],
      maintenanceSearch,
    ),
  );
  setText("[data-metric='maintenance-open']", String(requests.filter((item) => item.status === "open").length));
  setText("[data-metric='maintenance-progress']", String(requests.filter((item) => item.status === "in_progress").length));
  setText("[data-metric='maintenance-done']", String(requests.filter((item) => item.status === "resolved" || item.status === "closed").length));
  renderMaintenanceList(visibleRequests);
}

function renderMaintenanceList(requests: MaintenanceRequest[]) {
  const container = qs("[data-maintenance-list]");
  if (!container) return;
  if (!requests.length) {
    container.innerHTML = `<p class="meta">${maintenanceSearch ? "検索条件に一致する修繕依頼はありません。" : "修繕依頼はありません。"}</p>`;
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
  if (!confirmMaintenanceAction(status)) return;
  const patch: Record<string, string | null> = { status };
  if (canManage()) {
    patch.handled_by = currentProfile!.id;
    patch.handler_note =
      status === "in_progress" ? "対応を開始しました。" : status === "resolved" ? "対応を完了しました。" : "受付を終了しました。";
  }
  if (status === "resolved") patch.resolved_at = new Date().toISOString();

  const { error } = await supabase!.from("maintenance_requests").update(patch).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("maintenance_request", id, status, `修繕依頼を${maintenanceStatusLabels[status]}にしました。`);
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

  qs<HTMLInputElement>("[data-finance-search]")?.addEventListener("input", async (event) => {
    financeSearch = event.currentTarget.value;
    await renderFinancePage();
  });

  qs<HTMLFormElement>("[data-finance-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const entryType = String(form.get("entry_type")) as FinanceEntryType;
    const amount = Number(form.get("amount") || 0);
    const { data: entry, error } = await supabase!.from("finance_entries").insert({
      title,
      entry_type: entryType,
      category: String(form.get("category")),
      amount,
      entry_date: String(form.get("entry_date")),
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-finance-status]", error.message, true);
      return;
    }
    formElement.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    setStatus("[data-finance-status]", "台帳に記録しました。");
    await recordActivity("finance_entry", entry?.id ?? title, "created", `収支台帳に${title} (${financeTypeLabels[entryType]} ${formatCurrency(amount)}) を記録しました。`);
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
  const visibleEntries = entries.filter((entry) =>
    includesSearch(
      [
        entry.title,
        entry.category,
        entry.note,
        entry.entry_date,
        entry.amount,
        entry.profiles?.display_name,
        financeTypeLabels[entry.entry_type],
      ],
      financeSearch,
    ),
  );
  const income = entries.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + entry.amount, 0);
  setText("[data-metric='finance-income']", formatCurrency(income));
  setText("[data-metric='finance-expense']", formatCurrency(expense));
  setText("[data-metric='finance-balance']", formatCurrency(income - expense));
  renderFinanceList(visibleEntries);
}

function renderFinanceList(entries: FinanceEntry[]) {
  const container = qs("[data-finance-list]");
  if (!container) return;
  if (!entries.length) {
    container.innerHTML = `<p class="meta">${financeSearch ? "検索条件に一致する台帳記録はありません。" : "台帳記録はありません。"}</p>`;
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

  qs<HTMLInputElement>("[data-asset-search]")?.addEventListener("input", async (event) => {
    assetSearch = event.currentTarget.value;
    await renderAssetsPage();
  });

  qs<HTMLFormElement>("[data-asset-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const name = String(form.get("name"));
    const { data: asset, error } = await supabase!.from("asset_items").insert({
      name,
      category: String(form.get("category")),
      status: String(form.get("status")),
      location: String(form.get("location")),
      inspection_due_at: String(form.get("inspection_due_at") || "") || null,
      note: String(form.get("note") || "") || null,
      managed_by: currentProfile!.id,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-asset-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-asset-status]", "資産を登録しました。");
    await recordActivity("asset_item", asset?.id ?? name, "created", `資産 ${name} を登録しました。`);
    await renderAssetsPage();
  });
}

async function renderAssetsPage() {
  let query = supabase!.from("asset_items").select("*").order("updated_at", { ascending: false });
  if (assetFilter !== "all") query = query.eq("status", assetFilter);
  const { data } = await query;
  const assets = (data ?? []) as AssetItem[];
  const visibleAssets = assets.filter((asset) =>
    includesSearch(
      [
        asset.name,
        asset.location,
        asset.note,
        asset.inspection_due_at,
        assetCategoryLabels[asset.category],
        assetStatusLabels[asset.status],
      ],
      assetSearch,
    ),
  );
  const today = new Date().toISOString().slice(0, 10);

  setText("[data-metric='asset-total']", String(assets.length));
  setText("[data-metric='asset-due']", String(assets.filter((asset) => asset.inspection_due_at && asset.inspection_due_at <= today).length));
  setText("[data-metric='asset-attention']", String(assets.filter((asset) => asset.status === "repair_needed").length));
  renderAssetList(visibleAssets);
}

function renderAssetList(assets: AssetItem[]) {
  const container = qs("[data-asset-list]");
  if (!container) return;
  if (!assets.length) {
    container.innerHTML = `<p class="meta">${assetSearch ? "検索条件に一致する資産はありません。" : "資産はありません。"}</p>`;
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
    showErrorToast(error.message);
    return;
  }
  await recordActivity("asset_item", id, status, `資産状態を${assetStatusLabels[status]}にしました。`);
  await renderAssetsPage();
}

async function initVendors() {
  qs("[data-vendor-form]")?.classList.toggle("hidden", !canManage());
  qs("[data-contract-form]")?.classList.toggle("hidden", !canManage());
  await renderVendorsPage();

  qs<HTMLInputElement>("[data-vendor-search]")?.addEventListener("input", (event) => {
    vendorSearch = event.currentTarget.value;
    renderVendorList(vendorsCache);
  });

  qs<HTMLInputElement>("[data-contract-search]")?.addEventListener("input", (event) => {
    contractSearch = event.currentTarget.value;
    renderContractList(vendorContractsCache);
  });

  qs<HTMLFormElement>("[data-vendor-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const name = String(form.get("name"));
    const { data: vendor, error } = await supabase!.from("vendors").insert({
      name,
      category: String(form.get("category")),
      contact_name: String(form.get("contact_name") || "") || null,
      phone: String(form.get("phone") || "") || null,
      email: String(form.get("email") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-vendor-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-vendor-status]", "業者を登録しました。");
    await recordActivity("vendor", vendor?.id ?? name, "created", `業者 ${name} を登録しました。`);
    await renderVendorsPage();
  });

  qs<HTMLFormElement>("[data-contract-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const endDate = String(form.get("end_date"));
    const title = String(form.get("title"));
    const status = contractStatusFromEndDate(endDate);
    const { data: contract, error } = await supabase!.from("vendor_contracts").insert({
      vendor_id: String(form.get("vendor_id")),
      title,
      start_date: String(form.get("start_date")),
      end_date: endDate,
      amount: form.get("amount") ? Number(form.get("amount")) : null,
      status,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-contract-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-contract-status]", "契約を保存しました。");
    await recordActivity("vendor_contract", contract?.id ?? title, "created", `契約 ${title} を保存しました。状態: ${contractStatusLabels[status]}`);
    await renderVendorsPage();
  });
}

async function renderVendorsPage() {
  const [{ data: vendors }, { data: contracts }] = await Promise.all([
    supabase!.from("vendors").select("*").order("name"),
    supabase!.from("vendor_contracts").select("*, vendors(name)").order("end_date", { ascending: true }),
  ]);
  vendorsCache = (vendors ?? []) as Vendor[];
  vendorContractsCache = (contracts ?? []) as VendorContract[];
  setText("[data-metric='vendor-total']", String(vendorsCache.length));
  setText("[data-metric='contract-active']", String(vendorContractsCache.filter((contract) => contract.status === "active").length));
  setText("[data-metric='contract-renewal']", String(vendorContractsCache.filter((contract) => contract.status === "renewal_due").length));
  renderVendorSelect();
  renderVendorList(vendorsCache);
  renderContractList(vendorContractsCache);
}

function renderVendorSelect() {
  const select = qs<HTMLSelectElement>("[data-contract-vendor-select]");
  if (!select) return;
  select.innerHTML = vendorsCache.map((vendor) => `<option value="${vendor.id}">${escapeHtml(vendor.name)}</option>`).join("");
}

function renderVendorList(vendors: Vendor[]) {
  const container = qs("[data-vendor-list]");
  if (!container) return;
  const visibleVendors = vendors.filter((vendor) =>
    includesSearch(
      [vendor.name, vendor.category, vendor.contact_name, vendor.phone, vendor.email, vendor.note, vendor.is_active ? "有効" : "停止"],
      vendorSearch,
    ),
  );
  if (!visibleVendors.length) {
    container.innerHTML = `<p class="meta">${vendorSearch ? "検索条件に一致する業者はありません。" : "業者はありません。"}</p>`;
    return;
  }
  container.innerHTML = visibleVendors
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
  const visibleContracts = contracts.filter((contract) =>
    includesSearch(
      [
        contract.title,
        contract.vendors?.name,
        contractStatusLabels[contract.status],
        contract.start_date,
        contract.end_date,
        contract.amount,
      ],
      contractSearch,
    ),
  );
  if (!visibleContracts.length) {
    container.innerHTML = `<p class="meta">${contractSearch ? "検索条件に一致する契約はありません。" : "契約はありません。"}</p>`;
    return;
  }
  container.innerHTML = visibleContracts
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
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
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
    await recordActivity("profile", currentProfile.id, "updated", "住民名簿の連絡先を更新しました。");
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
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const options = String(form.get("options"))
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);

    if (options.length < 2) {
      setStatus("[data-survey-status]", "選択肢は2つ以上入力してください。", true);
      return;
    }

    const closesAt = String(form.get("closes_at") || "");
    const title = String(form.get("title"));
    const { data: survey, error } = await supabase!.from("surveys").insert({
      title,
      question: String(form.get("question")),
      options,
      closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-survey-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-survey-status]", "意見募集を作成しました。");
    await recordActivity("survey", survey?.id ?? title, "created", `意見募集 ${title} を作成しました。`);
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
    showErrorToast(error.message);
    return;
  }
  await renderSurveysPage();
}

async function closeSurvey(id: string) {
  if (!confirmSurveyAction()) return;
  const { error } = await supabase!.from("surveys").update({ is_open: false }).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("survey", id, "closed", "意見募集を締切りました。");
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
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: safetyEvent, error } = await supabase!.from("safety_events").insert({
      title,
      kind: String(form.get("kind")),
      status: String(form.get("status")),
      scheduled_at: new Date(String(form.get("scheduled_at"))).toISOString(),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-safety-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-safety-status]", "防災・安否イベントを登録しました。");
    await recordActivity("safety_event", safetyEvent?.id ?? title, "created", `防災・安否イベント ${title} を登録しました。`);
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
    showErrorToast(error.message);
    return;
  }
  await renderSafetyPage();
}

async function updateSafetyEventStatus(id: string, status: SafetyEventStatus) {
  if (!confirmSafetyAction(status)) return;
  const { error } = await supabase!.from("safety_events").update({ status }).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("safety_event", id, status, `防災・安否イベントを${safetyEventStatusLabels[status]}にしました。`);
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
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const assignee = String(form.get("assignee_id") || "").trim();
    const title = String(form.get("title"));
    const { data: task, error } = await supabase!.from("board_tasks").insert({
      title,
      description: String(form.get("description")),
      priority: String(form.get("priority")),
      due_date: String(form.get("due_date") || "") || null,
      assignee_id: assignee || currentProfile!.id,
      created_by: currentProfile!.id,
      status: "open",
    }).select("id").single();
    if (error) {
      setStatus("[data-task-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-task-status]", "タスクを作成しました。");
    await recordActivity("board_task", task?.id ?? title, "created", `理事会タスク ${title} を作成しました。`);
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
  if (!confirmTaskAction(status)) return;
  const patch: Record<string, string | null> = { status, completed_at: status === "done" ? new Date().toISOString() : null };
  const { error } = await supabase!.from("board_tasks").update(patch).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("board_task", id, status, `理事会タスクを${boardTaskStatusLabels[status]}にしました。`);
  await renderTasksPage();
}

async function initParking() {
  qs("[data-parking-space-form]")?.classList.toggle("hidden", !canManage());
  await renderParkingPage();

  qs<HTMLInputElement>("[data-parking-space-search]")?.addEventListener("input", (event) => {
    parkingSpaceSearch = event.currentTarget.value;
    renderParkingSpaces(parkingSpacesCache);
  });

  qs<HTMLInputElement>("[data-parking-permit-search]")?.addEventListener("input", async (event) => {
    parkingPermitSearch = event.currentTarget.value;
    await renderParkingPage();
  });

  qs<HTMLFormElement>("[data-parking-space-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const code = String(form.get("code"));
    const { data: space, error } = await supabase!.from("parking_spaces").insert({
      code,
      kind: String(form.get("kind")),
      location: String(form.get("location") || "") || null,
      monthly_fee: form.get("monthly_fee") ? Number(form.get("monthly_fee")) : null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-parking-space-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-parking-space-status]", "区画を登録しました。");
    await recordActivity("parking_space", space?.id ?? code, "created", `駐車・駐輪区画 ${code} を登録しました。`);
    await renderParkingPage();
  });

  qs<HTMLFormElement>("[data-parking-permit-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const vehicleLabel = String(form.get("vehicle_label"));
    const { data: permit, error } = await supabase!.from("parking_permits").insert({
      space_id: String(form.get("space_id")),
      user_id: currentProfile!.id,
      vehicle_label: vehicleLabel,
      start_date: String(form.get("start_date")),
      end_date: String(form.get("end_date") || "") || null,
      status: "pending",
    }).select("id").single();
    if (error) {
      setStatus("[data-parking-permit-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-parking-permit-status]", "利用申請を送信しました。");
    await recordActivity("parking_permit", permit?.id ?? vehicleLabel, "created", `駐車・駐輪利用 ${vehicleLabel} を申請しました。`);
    await renderParkingPage();
  });
}

async function renderParkingPage() {
  const [{ data: spaces }, { data: permits }] = await Promise.all([
    supabase!.from("parking_spaces").select("*").order("kind").order("code"),
    supabase!.from("parking_permits").select("*, parking_spaces(code, kind, location)").order("created_at", { ascending: false }),
  ]);
  parkingSpacesCache = (spaces ?? []) as ParkingSpace[];
  const allParkingPermits = (permits ?? []) as ParkingPermit[];
  const parkingPermits = canManage() ? allParkingPermits : allParkingPermits.filter((permit) => permit.user_id === currentProfile?.id);
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
  const visibleSpaces = spaces.filter((space) =>
    includesSearch([space.code, space.location, parkingKindLabels[space.kind], space.monthly_fee], parkingSpaceSearch),
  );
  if (!visibleSpaces.length) {
    container.innerHTML = `<p class="meta">${parkingSpaceSearch ? "検索条件に一致する区画はありません。" : "区画はありません。"}</p>`;
    return;
  }
  container.innerHTML = visibleSpaces
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
  const visiblePermits = permits.filter((permit) =>
    includesSearch(
      [
        permit.vehicle_label,
        permit.parking_spaces?.code,
        permit.parking_spaces?.location,
        parkingKindLabels[permit.parking_spaces?.kind ?? "car"],
        parkingPermitStatusLabels[permit.status],
        permit.start_date,
        permit.end_date,
      ],
      parkingPermitSearch,
    ),
  );
  if (!visiblePermits.length) {
    container.innerHTML = `<p class="meta">${parkingPermitSearch ? "検索条件に一致する利用申請はありません。" : "利用申請はありません。"}</p>`;
    return;
  }
  container.innerHTML = visiblePermits
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
  if (!confirmParkingAction(status)) return;
  const { data: permit, error: permitError } = await supabase!.from("parking_permits").select("space_id").eq("id", id).single();
  if (permitError || !permit) {
    showErrorToast(permitError?.message ?? "申請を確認できませんでした。");
    return;
  }
  const patch: Record<string, string | null> = { status };
  if (status === "active") {
    patch.approved_by = currentProfile!.id;
    patch.approved_at = new Date().toISOString();
  }
  const { error } = await supabase!.from("parking_permits").update(patch).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("parking_permit", id, status, `駐車・駐輪申請を${parkingPermitStatusLabels[status]}にしました。`);
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

  qs<HTMLInputElement>("[data-request-search]")?.addEventListener("input", async (event) => {
    residentRequestSearch = event.currentTarget.value;
    await renderResidentRequestsPage();
  });

  qs<HTMLFormElement>("[data-resident-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: request, error } = await supabase!.from("resident_requests").insert({
      title,
      category: String(form.get("category")),
      visibility: String(form.get("visibility")),
      body: String(form.get("body")),
      requester_id: currentProfile!.id,
      status: "open",
    }).select("id").single();
    if (error) {
      setStatus("[data-resident-request-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-resident-request-status]", "相談を送信しました。");
    await recordActivity("resident_request", request?.id ?? title, "created", `住民相談 ${title} を送信しました。`);
    await renderResidentRequestsPage();
  });
}

async function renderResidentRequestsPage() {
  let query = supabase!.from("resident_requests").select("*").order("updated_at", { ascending: false });
  if (residentRequestFilter !== "all") query = query.eq("status", residentRequestFilter);
  const { data } = await query;
  const allRequests = (data ?? []) as ResidentRequest[];
  const requests = canManage()
    ? allRequests
    : allRequests.filter((request) => request.requester_id === currentProfile?.id || request.visibility === "public");
  const visibleRequests = requests.filter((request) =>
    includesSearch(
      [
        request.title,
        request.body,
        request.response,
        residentRequestCategoryLabels[request.category],
        residentRequestStatusLabels[request.status],
        residentRequestVisibilityLabels[request.visibility],
      ],
      residentRequestSearch,
    ),
  );
  setText("[data-metric='request-open']", String(requests.filter((request) => request.status === "open").length));
  setText("[data-metric='request-progress']", String(requests.filter((request) => request.status === "in_progress").length));
  setText("[data-metric='request-done']", String(requests.filter((request) => request.status === "resolved" || request.status === "closed").length));
  renderResidentRequestList(visibleRequests);
}

function renderResidentRequestList(requests: ResidentRequest[]) {
  const container = qs("[data-resident-request-list]");
  if (!container) return;
  if (!requests.length) {
    container.innerHTML = `<p class="meta">${residentRequestSearch ? "検索条件に一致する相談・苦情はありません。" : "相談・苦情はありません。"}</p>`;
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
  if (!confirmResidentRequestAction(status)) return;
  const patch: Record<string, string | null> = { status };
  if (canManage()) {
    patch.handled_by = currentProfile!.id;
    patch.response = status === "in_progress" ? "対応を開始しました。" : status === "resolved" ? "対応を完了しました。" : "受付を終了しました。";
  }
  if (status === "resolved") patch.resolved_at = new Date().toISOString();
  const { error } = await supabase!.from("resident_requests").update(patch).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("resident_request", id, status, `住民相談を${residentRequestStatusLabels[status]}にしました。`);
  await renderResidentRequestsPage();
}

async function initCirculars() {
  qs("[data-circular-form]")?.classList.toggle("hidden", !canManage());
  await renderCircularsPage();

  qs<HTMLInputElement>("[data-circular-search]")?.addEventListener("input", async (event) => {
    circularSearch = event.currentTarget.value;
    await renderCircularsPage();
  });

  qs<HTMLInputElement>("[data-circular-ack-search]")?.addEventListener("input", async (event) => {
    circularAckSearch = event.currentTarget.value;
    await renderCircularsPage();
  });

  qs<HTMLFormElement>("[data-circular-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: circular, error } = await supabase!.from("circulars").insert({
      title,
      kind: String(form.get("kind")),
      target_role: String(form.get("target_role")),
      due_date: String(form.get("due_date") || "") || null,
      body: String(form.get("body")),
      status: "published",
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-circular-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-circular-status]", "回覧を公開しました。");
    await recordActivity("circular", circular?.id ?? title, "created", `回覧 ${title} を公開しました。`);
    await renderCircularsPage();
  });
}

async function renderCircularsPage() {
  const [{ data: circulars }, { data: acknowledgements }] = await Promise.all([
    supabase!.from("circulars").select("*").order("updated_at", { ascending: false }),
    supabase!.from("circular_acknowledgements").select("*, circulars(title, kind, target_role)").order("created_at", { ascending: false }),
  ]);
  const circularItems = ((circulars ?? []) as Circular[]).filter(isTargetedToCurrentRole);
  const ackItems = (acknowledgements ?? []) as CircularAcknowledgement[];
  const acknowledgedIds = new Set(ackItems.filter((ack) => ack.user_id === currentProfile?.id).map((ack) => ack.circular_id));
  const today = new Date().toISOString().slice(0, 10);
  const dueLimit = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const visibleCirculars = circularItems.filter((item) =>
    includesSearch(
      [
        item.title,
        item.body,
        item.due_date,
        circularKindLabels[item.kind],
        item.target_role === "all" ? "全員" : roleLabels[item.target_role as Role],
        circularStatusLabels[item.status],
      ],
      circularSearch,
    ),
  );
  const visibleAcks = ackItems.filter((ack) =>
    includesSearch(
      [
        ack.circulars?.title,
        ack.circulars?.kind ? circularKindLabels[ack.circulars.kind] : null,
        ack.circulars?.target_role === "all" ? "全員" : ack.circulars?.target_role ? roleLabels[ack.circulars.target_role as Role] : null,
        ack.note,
      ],
      circularAckSearch,
    ),
  );
  setText("[data-metric='circular-published']", String(circularItems.filter((item) => item.status === "published").length));
  setText("[data-metric='circular-unread']", String(circularItems.filter((item) => item.status === "published" && !acknowledgedIds.has(item.id)).length));
  setText("[data-metric='circular-due']", String(circularItems.filter((item) => item.status === "published" && item.due_date && item.due_date >= today && item.due_date <= dueLimit).length));
  renderCircularList(visibleCirculars, acknowledgedIds);
  renderCircularAckList(visibleAcks);
}

function renderCircularList(circulars: Circular[], acknowledgedIds: Set<string>) {
  const container = qs("[data-circular-list]");
  if (!container) return;
  if (!circulars.length) {
    container.innerHTML = `<p class="meta">${circularSearch ? "検索条件に一致する回覧はありません。" : "回覧はありません。"}</p>`;
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
  const ownAcks = acknowledgements.filter((ack) => ack.user_id === currentProfile?.id && (!ack.circulars || isTargetedToCurrentRole(ack.circulars as Pick<Circular, "target_role">)));
  if (!ownAcks.length) {
    container.innerHTML = `<p class="meta">${circularAckSearch ? "検索条件に一致する確認履歴はありません。" : "確認履歴はありません。"}</p>`;
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
    showErrorToast(error.message);
    return;
  }
  await renderCircularsPage();
}

async function updateCircularStatus(id: string, status: CircularStatus) {
  if (!confirmCircularAction(status)) return;
  const { error } = await supabase!.from("circulars").update({ status }).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("circular", id, status, `回覧を${circularStatusLabels[status]}にしました。`);
  await renderCircularsPage();
}

async function initLending() {
  qs("[data-lending-item-form]")?.classList.toggle("hidden", !canManage());
  await renderLendingPage();

  qs<HTMLInputElement>("[data-lending-item-search]")?.addEventListener("input", async (event) => {
    lendingItemSearch = event.currentTarget.value;
    await renderLendingPage();
  });

  qs<HTMLInputElement>("[data-lending-request-search]")?.addEventListener("input", async (event) => {
    lendingRequestSearch = event.currentTarget.value;
    await renderLendingPage();
  });

  qs<HTMLFormElement>("[data-lending-item-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const name = String(form.get("name"));
    const { data: item, error } = await supabase!.from("lending_items").insert({
      name,
      kind: String(form.get("kind")),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-lending-item-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-lending-item-status]", "貸出品を登録しました。");
    await recordActivity("lending_item", item?.id ?? name, "created", `貸出品 ${name} を登録しました。`);
    await renderLendingPage();
  });

  qs<HTMLFormElement>("[data-lending-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const purpose = String(form.get("purpose"));
    const { data: request, error } = await supabase!.from("lending_requests").insert({
      item_id: String(form.get("item_id")),
      user_id: currentProfile!.id,
      purpose,
      due_at: form.get("due_at") ? new Date(String(form.get("due_at"))).toISOString() : null,
      status: "pending",
    }).select("id").single();
    if (error) {
      setStatus("[data-lending-request-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-lending-request-status]", "貸出申請を送信しました。");
    await recordActivity("lending_request", request?.id ?? purpose, "created", `貸出申請 ${purpose} を送信しました。`);
    await renderLendingPage();
  });
}

async function renderLendingPage() {
  const [{ data: items }, { data: requests }] = await Promise.all([
    supabase!.from("lending_items").select("*").order("kind").order("name"),
    supabase!.from("lending_requests").select("*, lending_items(name, kind, location)").order("created_at", { ascending: false }),
  ]);
  lendingItemsCache = (items ?? []) as LendingItem[];
  const allLendingRequests = (requests ?? []) as LendingRequest[];
  const lendingRequests = canManage() ? allLendingRequests : allLendingRequests.filter((request) => request.user_id === currentProfile?.id);
  const availableItems = lendingItemsCache.filter((item) => item.is_active && item.is_available);
  const visibleItems = lendingItemsCache.filter((item) =>
    includesSearch(
      [item.name, item.location, item.note, lendingKindLabels[item.kind], item.is_available ? "貸出可" : "貸出中"],
      lendingItemSearch,
    ),
  );
  const visibleRequests = lendingRequests.filter((request) =>
    includesSearch(
      [
        request.purpose,
        request.lending_items?.name,
        request.lending_items?.location,
        request.due_at,
        request.checkout_at,
        lendingRequestStatusLabels[request.status],
        request.lending_items?.kind ? lendingKindLabels[request.lending_items.kind] : null,
      ],
      lendingRequestSearch,
    ),
  );
  setText("[data-metric='lending-available']", String(availableItems.length));
  setText("[data-metric='lending-pending']", String(lendingRequests.filter((request) => request.status === "pending").length));
  setText("[data-metric='lending-checked-out']", String(lendingRequests.filter((request) => request.status === "checked_out").length));
  renderLendingItemSelect(availableItems);
  renderLendingItems(visibleItems);
  renderLendingRequests(visibleRequests);
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
    container.innerHTML = `<p class="meta">${lendingItemSearch ? "検索条件に一致する貸出品はありません。" : "貸出品はありません。"}</p>`;
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
    container.innerHTML = `<p class="meta">${lendingRequestSearch ? "検索条件に一致する貸出申請はありません。" : "貸出申請はありません。"}</p>`;
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
  if (!confirmLendingAction(status)) return;
  const { data: request, error: requestError } = await supabase!.from("lending_requests").select("item_id").eq("id", id).single();
  if (requestError || !request) {
    showErrorToast(requestError?.message ?? "貸出申請を確認できませんでした。");
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
    showErrorToast(error.message);
    return;
  }
  if (status === "checked_out" || status === "returned") {
    await supabase!.from("lending_items").update({ is_available: status === "returned" }).eq("id", request.item_id);
  }
  await recordActivity("lending_request", id, status, `貸出申請を${lendingRequestStatusLabels[status]}にしました。`);
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

  qs<HTMLInputElement>("[data-duty-search]")?.addEventListener("input", async (event) => {
    dutySearch = event.currentTarget.value;
    await renderDutiesPage();
  });

  qs<HTMLInputElement>("[data-duty-own-search]")?.addEventListener("input", async (event) => {
    ownDutySearch = event.currentTarget.value;
    await renderDutiesPage();
  });

  qs<HTMLFormElement>("[data-duty-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const assignee = String(form.get("assignee_id") || "").trim();
    const title = String(form.get("title"));
    const { data: duty, error } = await supabase!.from("duty_assignments").insert({
      title,
      kind: String(form.get("kind")),
      assignee_id: assignee || currentProfile!.id,
      scheduled_date: String(form.get("scheduled_date")),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      status: "planned",
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-duty-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-duty-status]", "当番を作成しました。");
    await recordActivity("duty_assignment", duty?.id ?? title, "created", `当番 ${title} を作成しました。`);
    await renderDutiesPage();
  });
}

async function renderDutiesPage() {
  const { data } = await supabase!.from("duty_assignments").select("*").order("scheduled_date", { ascending: true }).order("created_at", { ascending: false });
  const allDuties = (data ?? []) as DutyAssignment[];
  const duties = canManage() ? allDuties : allDuties.filter((duty) => duty.assignee_id === currentProfile?.id);
  const today = new Date().toISOString().slice(0, 10);
  const shownDuties = dutyFilter === "all" ? duties : duties.filter((duty) => duty.status === dutyFilter);
  const visibleDuties = shownDuties.filter((duty) =>
    includesSearch(
      [
        duty.title,
        dutyKindLabels[duty.kind],
        duty.scheduled_date,
        duty.location,
        duty.note,
        dutyStatusLabels[duty.status],
      ],
      dutySearch,
    ),
  );
  const visibleOwnDuties = duties
    .filter((duty) => duty.assignee_id === currentProfile?.id)
    .filter((duty) =>
      includesSearch(
        [
          duty.title,
          dutyKindLabels[duty.kind],
          duty.scheduled_date,
          duty.location,
          duty.note,
          dutyStatusLabels[duty.status],
        ],
        ownDutySearch,
      ),
    );
  setText("[data-metric='duty-planned']", String(duties.filter((duty) => duty.status === "planned").length));
  setText("[data-metric='duty-today']", String(duties.filter((duty) => duty.status === "planned" && duty.scheduled_date === today).length));
  setText("[data-metric='duty-done']", String(duties.filter((duty) => duty.status === "done").length));
  renderDutyList(visibleDuties);
  renderOwnDutyList(visibleOwnDuties);
  bindDutyActions();
}

function renderDutyList(duties: DutyAssignment[]) {
  const container = qs("[data-duty-list]");
  if (!container) return;
  if (!duties.length) {
    container.innerHTML = `<p class="meta">${dutySearch ? "検索条件に一致する当番はありません。" : "当番はありません。"}</p>`;
    return;
  }
  container.innerHTML = duties.map(renderDutyItem).join("");
}

function renderOwnDutyList(duties: DutyAssignment[]) {
  const container = qs("[data-duty-own-list]");
  if (!container) return;
  if (!duties.length) {
    container.innerHTML = `<p class="meta">${ownDutySearch ? "検索条件に一致する当番はありません。" : "自分の当番はありません。"}</p>`;
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
  if (!confirmDutyAction(status)) return;
  const patch: Record<string, string | null> = { status, completed_at: status === "done" ? new Date().toISOString() : null };
  const { error } = await supabase!.from("duty_assignments").update(patch).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("duty_assignment", id, status, `当番を${dutyStatusLabels[status]}にしました。`);
  await renderDutiesPage();
}

async function initWaste() {
  qs("[data-waste-schedule-form]")?.classList.toggle("hidden", !canManage());
  await renderWastePage();

  qs<HTMLInputElement>("[data-waste-schedule-search]")?.addEventListener("input", async (event) => {
    wasteScheduleSearch = event.currentTarget.value;
    await renderWastePage();
  });

  qs<HTMLInputElement>("[data-bulky-request-search]")?.addEventListener("input", async (event) => {
    bulkyRequestSearch = event.currentTarget.value;
    await renderWastePage();
  });

  qs<HTMLFormElement>("[data-waste-schedule-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: schedule, error } = await supabase!.from("waste_schedules").insert({
      title,
      category: String(form.get("category")),
      collection_day: String(form.get("collection_day")),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-waste-schedule-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-waste-schedule-status]", "収集ルールを登録しました。");
    await recordActivity("waste_schedule", schedule?.id ?? title, "created", `ごみ収集ルール ${title} を登録しました。`);
    await renderWastePage();
  });

  qs<HTMLFormElement>("[data-bulky-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const itemName = String(form.get("item_name"));
    const { data: request, error } = await supabase!.from("bulky_waste_requests").insert({
      user_id: currentProfile!.id,
      item_name: itemName,
      preferred_date: String(form.get("preferred_date") || "") || null,
      pickup_location: String(form.get("pickup_location") || "") || null,
      note: String(form.get("note") || "") || null,
      status: "submitted",
    }).select("id").single();
    if (error) {
      setStatus("[data-bulky-request-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-bulky-request-status]", "粗大ごみ申請を送信しました。");
    await recordActivity("bulky_waste_request", request?.id ?? itemName, "created", `粗大ごみ申請 ${itemName} を送信しました。`);
    await renderWastePage();
  });
}

async function renderWastePage() {
  const [{ data: schedules }, { data: requests }] = await Promise.all([
    supabase!.from("waste_schedules").select("*").order("category").order("collection_day"),
    supabase!.from("bulky_waste_requests").select("*").order("created_at", { ascending: false }),
  ]);
  const wasteSchedules = (schedules ?? []) as WasteSchedule[];
  const allBulkyRequests = (requests ?? []) as BulkyWasteRequest[];
  const bulkyRequests = canManage() ? allBulkyRequests : allBulkyRequests.filter((request) => request.user_id === currentProfile?.id);
  const visibleSchedules = wasteSchedules.filter((schedule) =>
    includesSearch(
      [
        schedule.title,
        schedule.collection_day,
        schedule.location,
        schedule.note,
        wasteCategoryLabels[schedule.category],
        schedule.is_active ? "有効" : "停止",
      ],
      wasteScheduleSearch,
    ),
  );
  const visibleBulkyRequests = bulkyRequests.filter((request) =>
    includesSearch(
      [
        request.item_name,
        request.preferred_date,
        request.pickup_location,
        request.note,
        bulkyWasteStatusLabels[request.status],
      ],
      bulkyRequestSearch,
    ),
  );
  setText("[data-metric='waste-schedules']", String(wasteSchedules.filter((schedule) => schedule.is_active).length));
  setText("[data-metric='bulky-submitted']", String(bulkyRequests.filter((request) => request.status === "submitted").length));
  setText("[data-metric='bulky-scheduled']", String(bulkyRequests.filter((request) => request.status === "scheduled").length));
  renderWasteSchedules(visibleSchedules);
  renderBulkyWasteRequests(visibleBulkyRequests);
}

function renderWasteSchedules(schedules: WasteSchedule[]) {
  const container = qs("[data-waste-schedule-list]");
  if (!container) return;
  if (!schedules.length) {
    container.innerHTML = `<p class="meta">${wasteScheduleSearch ? "検索条件に一致する収集ルールはありません。" : "収集ルールはありません。"}</p>`;
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
    container.innerHTML = `<p class="meta">${bulkyRequestSearch ? "検索条件に一致する粗大ごみ申請はありません。" : "粗大ごみ申請はありません。"}</p>`;
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
  if (!confirmBulkyWasteAction(status)) return;
  const patch: Record<string, string | null> = { status };
  if (canManage()) patch.handled_by = currentProfile!.id;
  if (status === "scheduled") patch.scheduled_date = new Date().toISOString().slice(0, 10);
  if (status === "completed") patch.completed_at = new Date().toISOString();
  const { error } = await supabase!.from("bulky_waste_requests").update(patch).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("bulky_waste_request", id, status, `粗大ごみ申請を${bulkyWasteStatusLabels[status]}にしました。`);
  await renderWastePage();
}

async function initMeetings() {
  qs("[data-meeting-form]")?.classList.toggle("hidden", !canManage());
  qs("[data-agenda-form]")?.classList.toggle("hidden", !canManage());
  await renderMeetingsPage();

  qs<HTMLInputElement>("[data-meeting-search]")?.addEventListener("input", async (event) => {
    meetingSearch = event.currentTarget.value;
    await renderMeetingsPage();
  });

  qs<HTMLInputElement>("[data-agenda-search]")?.addEventListener("input", async (event) => {
    agendaSearch = event.currentTarget.value;
    await renderMeetingsPage();
  });

  qs<HTMLFormElement>("[data-meeting-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: meeting, error } = await supabase!.from("meeting_sessions").insert({
      title,
      kind: String(form.get("kind")),
      scheduled_at: new Date(String(form.get("scheduled_at"))).toISOString(),
      location: String(form.get("location") || "") || null,
      note: String(form.get("note") || "") || null,
      status: "open",
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-meeting-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-meeting-status]", "会議を公開しました。");
    await recordActivity("meeting_session", meeting?.id ?? title, "created", `会議 ${title} を公開しました。`);
    await renderMeetingsPage();
  });

  qs<HTMLFormElement>("[data-agenda-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: agenda, error } = await supabase!.from("meeting_agenda_items").insert({
      meeting_id: String(form.get("meeting_id")),
      title,
      description: String(form.get("description")),
      sort_order: Number(form.get("sort_order") || 0),
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-agenda-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-agenda-status]", "議案を追加しました。");
    await recordActivity("meeting_agenda_item", agenda?.id ?? title, "created", `議案 ${title} を追加しました。`);
    await renderMeetingsPage();
  });

  qs<HTMLFormElement>("[data-attendance-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
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
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
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
  const visibleSessions = sessions.filter((session) =>
    includesSearch(
      [
        session.title,
        session.location,
        session.note,
        session.scheduled_at,
        meetingKindLabels[session.kind],
        meetingStatusLabels[session.status],
      ],
      meetingSearch,
    ),
  );
  if (!visibleSessions.length) {
    container.innerHTML = `<p class="meta">${meetingSearch ? "検索条件に一致する会議はありません。" : "会議はありません。"}</p>`;
    return;
  }
  container.innerHTML = visibleSessions
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
  const visibleAgendaItems = agendaItems.filter((item) =>
    includesSearch(
      [
        item.title,
        item.description,
        item.sort_order,
        item.meeting_sessions?.title,
        item.meeting_sessions?.status ? meetingStatusLabels[item.meeting_sessions.status] : null,
      ],
      agendaSearch,
    ),
  );
  if (!visibleAgendaItems.length) {
    container.innerHTML = `<p class="meta">${agendaSearch ? "検索条件に一致する議案はありません。" : "議案はありません。"}</p>`;
    return;
  }
  container.innerHTML = visibleAgendaItems
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
  if (!confirmMeetingAction(status)) return;
  const patch: Record<string, string | null> = { status, closed_at: status === "closed" ? new Date().toISOString() : null };
  const { error } = await supabase!.from("meeting_sessions").update(patch).eq("id", id);
  if (error) {
    showErrorToast(error.message);
    return;
  }
  await recordActivity("meeting_session", id, status, `会議を${meetingStatusLabels[status]}にしました。`);
  await renderMeetingsPage();
}

async function initInspections() {
  qs("[data-inspection-plan-form]")?.classList.toggle("hidden", !canManage());
  qs("[data-inspection-record-form]")?.classList.toggle("hidden", !canManage());
  await renderInspectionsPage();

  qs<HTMLInputElement>("[data-inspection-plan-search]")?.addEventListener("input", async (event) => {
    inspectionPlanSearch = event.currentTarget.value;
    await renderInspectionsPage();
  });

  qs<HTMLInputElement>("[data-inspection-record-search]")?.addEventListener("input", async (event) => {
    inspectionRecordSearch = event.currentTarget.value;
    await renderInspectionsPage();
  });

  qs<HTMLFormElement>("[data-inspection-plan-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const title = String(form.get("title"));
    const { data: plan, error } = await supabase!.from("inspection_plans").insert({
      asset_id: String(form.get("asset_id")),
      title,
      frequency: String(form.get("frequency")),
      next_due_date: String(form.get("next_due_date")),
      note: String(form.get("note") || "") || null,
      created_by: currentProfile!.id,
    }).select("id").single();
    if (error) {
      setStatus("[data-inspection-plan-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-inspection-plan-status]", "点検計画を作成しました。");
    await recordActivity("inspection_plan", plan?.id ?? title, "created", `点検計画 ${title} を作成しました。`);
    await renderInspectionsPage();
  });

  qs<HTMLFormElement>("[data-inspection-record-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
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

    const { data: inspectionRecord, error } = await supabase!.from("inspection_records").insert({
      plan_id: plan.id,
      asset_id: plan.asset_id,
      inspected_by: currentProfile!.id,
      result,
      inspected_at: String(form.get("inspected_at")),
      note,
      maintenance_request_id: maintenanceRequestId,
    }).select("id").single();
    if (error) {
      setStatus("[data-inspection-record-status]", error.message, true);
      return;
    }
    if (result === "repair_needed") {
      await supabase!.from("asset_items").update({ status: "repair_needed", managed_by: currentProfile!.id }).eq("id", plan.asset_id);
      await recordActivity("inspection_record", inspectionRecord?.id ?? plan.id, "repair_needed", `点検異常を記録しました: ${plan.title}`);
      if (maintenanceRequestId) {
        await recordActivity("maintenance_request", maintenanceRequestId, "created_from_inspection", `点検異常から修繕依頼を作成しました: ${plan.title}`);
      }
    } else {
      await recordActivity("inspection_record", inspectionRecord?.id ?? plan.id, result, `点検記録を登録しました: ${plan.title}`);
    }
    formElement.reset();
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
  const visiblePlans = plans.filter((plan) =>
    includesSearch(
      [
        plan.title,
        plan.note,
        plan.next_due_date,
        plan.asset_items?.name,
        plan.asset_items?.location,
        plan.asset_items?.status ? assetStatusLabels[plan.asset_items.status] : null,
        inspectionFrequencyLabels[plan.frequency],
        plan.is_active ? "有効" : "停止",
      ],
      inspectionPlanSearch,
    ),
  );
  if (!visiblePlans.length) {
    container.innerHTML = `<p class="meta">${inspectionPlanSearch ? "検索条件に一致する点検計画はありません。" : "点検計画はありません。"}</p>`;
    return;
  }
  container.innerHTML = visiblePlans
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
  const visibleRecords = records.filter((record) =>
    includesSearch(
      [
        record.inspection_plans?.title,
        record.asset_items?.name,
        record.inspected_at,
        record.note,
        inspectionResultLabels[record.result],
        record.maintenance_request_id ? "修繕依頼へ連携済み" : null,
      ],
      inspectionRecordSearch,
    ),
  );
  if (!visibleRecords.length) {
    container.innerHTML = `<p class="meta">${inspectionRecordSearch ? "検索条件に一致する点検記録はありません。" : "点検記録はありません。"}</p>`;
    return;
  }
  container.innerHTML = visibleRecords
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

  await Promise.all([renderAdminRooms(), renderProfiles(), renderActivityLogs()]);
  qs<HTMLInputElement>("[data-activity-log-search]")?.addEventListener("input", renderActivityLogList);
  qs<HTMLSelectElement>("[data-activity-log-action]")?.addEventListener("change", renderActivityLogList);

  qs<HTMLFormElement>("[data-room-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!(formElement instanceof HTMLFormElement)) return;
    const form = new FormData(formElement);
    const roomName = String(form.get("name"));
    const { data: createdRoom, error } = await supabase!.from("rooms").insert({
      name: roomName,
      capacity: Number(form.get("capacity") || 0),
      notes: String(form.get("notes") || ""),
      is_active: true,
    }).select("id").single();
    if (error) {
      setStatus("[data-room-status]", error.message, true);
      return;
    }
    formElement.reset();
    setStatus("[data-room-status]", "会議室を追加しました。");
    await recordActivity("room", createdRoom?.id ?? roomName, "created", `会議室 ${roomName} を追加しました。`);
    await renderAdminRooms();
    await renderActivityLogs();
  });
}

async function renderActivityLogs() {
  const { data } = await supabase!
    .from("activity_logs")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false })
    .limit(80);
  activityLogsCache = (data ?? []) as ActivityLog[];
  renderActivityLogList();
}

const activityEntityLabels: Record<string, string> = {
  activity_log: "操作履歴",
  asset_item: "資産",
  board_task: "理事会タスク",
  bulky_waste_request: "粗大ごみ申請",
  circular: "回覧",
  duty_assignment: "当番",
  event: "行事",
  finance_entry: "収支台帳",
  inspection_plan: "点検計画",
  inspection_record: "点検記録",
  lending_item: "貸出品",
  lending_request: "貸出申請",
  maintenance_request: "修繕依頼",
  management_document: "管理文書",
  meeting_agenda_item: "議案",
  meeting_session: "会議",
  notice: "通知",
  parking_permit: "駐車・駐輪申請",
  parking_space: "駐車・駐輪区画",
  profile: "ユーザー",
  resident_request: "住民相談",
  room: "会議室",
  room_booking: "会議室予約",
  safety_event: "防災・安否",
  survey: "意見募集",
  vendor: "業者",
  vendor_contract: "契約",
  waste_schedule: "ごみ収集ルール",
};

const activityActionLabels: Record<string, string> = {
  active: "承認",
  approved: "承認",
  archived: "保管",
  cancelled: "中止",
  checked_out: "貸出承認",
  closed: "終了",
  completed: "完了",
  created: "作成",
  created_from_inspection: "点検連携",
  done: "完了",
  ended: "終了",
  in_progress: "対応中",
  inspection_due: "点検予定",
  lost: "紛失",
  missed: "未実施",
  rejected: "却下・差戻し",
  repair_needed: "修理必要",
  resolved: "完了",
  returned: "返却済み",
  role_changed: "権限変更",
  updated: "更新",
};

const activityActionGroups: Record<string, string[]> = {
  approval: ["active", "approved", "checked_out"],
  archived: ["archived"],
  closure: ["cancelled", "closed", "ended", "lost", "missed"],
  completion: ["completed", "done", "resolved", "returned"],
  created: ["created", "created_from_inspection"],
  rejection: ["rejected"],
};

function activityEntityLabel(entityType: string) {
  return activityEntityLabels[entityType] ?? entityType;
}

function activityActionLabel(action: string) {
  return activityActionLabels[action] ?? action;
}

function matchesActivityActionFilter(log: ActivityLog, filter: string) {
  if (filter === "all") return true;
  return (activityActionGroups[filter] ?? [filter]).includes(log.action);
}

function renderActivityLogList() {
  const container = qs("[data-activity-log-list]");
  if (!container) return;
  const search = qs<HTMLInputElement>("[data-activity-log-search]")?.value.trim().toLowerCase() ?? "";
  const action = qs<HTMLSelectElement>("[data-activity-log-action]")?.value ?? "all";
  const logs = activityLogsCache.filter((log) => {
    const matchesAction = matchesActivityActionFilter(log, action);
    const text = [
      log.detail,
      log.action,
      activityActionLabel(log.action),
      log.entity_type,
      activityEntityLabel(log.entity_type),
      log.entity_id,
      log.profiles?.display_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesAction && (!search || text.includes(search));
  });
  setText("[data-activity-log-summary]", `${logs.length} / ${activityLogsCache.length} 件`);
  if (!logs.length) {
    container.innerHTML = `<p class="meta">条件に合う操作履歴はありません。</p>`;
    return;
  }
  container.innerHTML = logs
    .map(
      (log) => `
        <article class="list-item">
          <div class="list-row">
            <div>
              <strong>操作履歴: ${escapeHtml(log.detail ?? log.action)}</strong>
              <p class="meta">${escapeHtml(activityEntityLabel(log.entity_type))} / ${formatDateTime(log.created_at)} / ${escapeHtml(log.profiles?.display_name ?? "担当者")}</p>
            </div>
            <span class="badge">${escapeHtml(activityActionLabel(log.action))}</span>
          </div>
        </article>
      `,
    )
    .join("");
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
            <select class="select" data-role-select="${profile.id}" data-current-role="${profile.role}" data-profile-name="${escapeHtml(profile.display_name ?? profile.id)}">
              ${assignableRoles
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
      const profileId = select.dataset.roleSelect;
      const previousRole = (select.dataset.currentRole ?? "resident") as Role;
      const nextRole = select.value as Role;
      const profileName = select.dataset.profileName ?? "ユーザー";
      if (!profileId || previousRole === nextRole) return;
      if (!confirmAction(`${profileName} の権限を ${roleLabels[nextRole]} に変更しますか？`)) {
        select.value = previousRole;
        return;
      }

      const { error } = await supabase!.from("profiles").update({ role: nextRole }).eq("id", profileId);
      if (error) {
        select.value = previousRole;
        showErrorToast(error.message);
        return;
      }

      select.dataset.currentRole = nextRole;
      await recordActivity("profile", profileId, "role_changed", `${profileName}: ${roleLabels[previousRole]} -> ${roleLabels[nextRole]}`);
      await renderActivityLogs();
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
  const className = status === "approved" ? "success" : isDocumentApprovalStatus(status) ? "warning" : "danger";
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
