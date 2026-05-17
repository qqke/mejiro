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

const page = document.body.dataset.page ?? "home";
const base = import.meta.env.BASE_URL || "/";
let currentProfile: Profile | null = null;
let eventMonth = new Date();
let bookingCalendar: CalendarInstance | null = null;
let roomsCache: Room[] = [];
let bookingsCache: Booking[] = [];

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
    .select("id, display_name, role, building, unit_number")
    .eq("id", userId)
    .single();

  if (!error && data) return data as Profile;

  const fallbackName = email.split("@")[0] || "ユーザー";
  const { data: inserted } = await supabase!
    .from("profiles")
    .insert({ id: userId, display_name: fallbackName, role: "resident" })
    .select("id, display_name, role, building, unit_number")
    .single();

  return (inserted as Profile | null) ?? {
    id: userId,
    display_name: fallbackName,
    role: "resident",
    building: null,
    unit_number: null,
  };
}

async function initHome() {
  const [{ data: bookings }, { data: notices }, { data: events }, unread] = await Promise.all([
    supabase!
      .from("room_bookings")
      .select("id, purpose, start_at, end_at, status, rooms(name)")
      .order("start_at", { ascending: true })
      .limit(5),
    supabase!.from("notices").select("*").order("created_at", { ascending: false }).limit(5),
    supabase!.from("events").select("*").order("start_at", { ascending: true }).limit(5),
    countUnreadNotices(),
  ]);

  const pending = (bookings ?? []).filter((booking) => booking.status === "pending").length;
  const now = new Date();
  const monthEvents = (events ?? []).filter((event) => {
    const date = new Date(event.start_at);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }).length;

  setText("[data-metric='pending-bookings']", String(pending));
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

void init();
