import { resolveApiBase } from "./apiBase";

/** Django `/api` — taxta, mehmonlar, katalog */
const API_BASE = resolveApiBase();

/** React Query: `invalidateQueries({ queryKey: ["recentGuests"] })` barcha limitlarni yangilaydi */
export const recentGuestsQueryKey = (limit: number) => ["recentGuests", limit] as const;

export const catalogHostelsQueryKey = ["catalog", "hostels"] as const;
export const catalogRoomsQueryKey = (hostel: string) => ["catalog", "rooms", hostel] as const;
export const catalogCancelReasonsQueryKey = (scope: string) => ["catalog", "cancel-reasons", scope] as const;

export const CANCEL_SCOPE_BOOKING_CHECKIN = "booking_checkin";
export const CANCEL_SCOPE_BRON_BOARD = "bron_board";

export type HostelDto = { id: number; name: string };
export type RoomCatalogRow = { code: string; name: string; bed_count: number; inactive: boolean; room_kind: string };
export type CancelReasonDto = { value: string; label: string; sort_order: number };

export async function fetchHostels(): Promise<HostelDto[]> {
  const raw = await fetchJson<unknown>("/catalog/hostels");
  if (Array.isArray(raw)) return raw as HostelDto[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidates = [obj.results, obj.hostels, obj.data];
    for (const c of candidates) if (Array.isArray(c)) return c as HostelDto[];
  }
  return [];
}

export async function fetchRoomCatalog(hostel: string): Promise<RoomCatalogRow[]> {
  const q = new URLSearchParams({ hostel });
  const raw = await fetchJson<unknown>(`/catalog/rooms?${q.toString()}`);
  if (Array.isArray(raw)) return raw as RoomCatalogRow[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const c of [obj.results, obj.rooms, obj.data]) if (Array.isArray(c)) return c as RoomCatalogRow[];
  }
  return [];
}

export async function fetchCancelReasons(scope: string): Promise<CancelReasonDto[]> {
  const q = new URLSearchParams({ scope });
  const raw = await fetchJson<unknown>(`/catalog/cancel-reasons?${q.toString()}`);
  if (Array.isArray(raw)) return raw as CancelReasonDto[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const c of [obj.results, obj.reasons, obj.data]) if (Array.isArray(c)) return c as CancelReasonDto[];
  }
  return [];
}

function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (API_BASE.startsWith("http://") || API_BASE.startsWith("https://")) {
    return `${API_BASE.replace(/\/$/, "")}${p}`;
  }
  return `${API_BASE}${p}`;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const AUTH_TOKEN_KEY = "auth:bearerToken";

export type AuthUserDto = {
  id: number;
  telegram_user_id: number;
  display_name: string;
  role: "super_admin" | "admin" | "staff";
  avatar_url?: string;
};

export type TelegramLoginPayload = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

export function getAuthToken(): string {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setAuthToken(token: string): void {
  try {
    if (!token) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    void 0;
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    void 0;
  }
}

export async function authTelegram(initData: string): Promise<{ token: string; user: AuthUserDto }> {
  return fetchJson("/auth/telegram", { method: "POST", body: JSON.stringify({ initData }) });
}

export async function authTelegramLogin(payload: TelegramLoginPayload): Promise<{ token: string; user: AuthUserDto }> {
  return fetchJson("/auth/telegram-login", { method: "POST", body: JSON.stringify(payload) });
}

export async function authPasswordLogin(params: { login: string; password: string }): Promise<{ token: string; user: AuthUserDto }> {
  return fetchJson("/auth/password-login", { method: "POST", body: JSON.stringify(params) });
}

export async function fetchMe(): Promise<{ user: AuthUserDto }> {
  return fetchJson("/auth/me");
}

export async function patchMe(body: Partial<{ avatar_url: string; display_name: string }>): Promise<{ user: AuthUserDto }> {
  return fetchJson("/auth/me", { method: "PATCH", body: JSON.stringify(body) });
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  const token = getAuthToken();
  if (token && !("Authorization" in headers)) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers,
    });
  } catch (e) {
    const raw = e instanceof TypeError ? e.message : "Tarmoq xatosi";
    const msg =
      raw === "Failed to fetch"
        ? "Serverga ulanib bo‘lmadi (tarmoq yoki CORS). Backend ishlayaptimi va VITE_API_BASE to‘g‘rimi?"
        : raw;
    throw new ApiError(msg, 0, { network: true });
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    let msg = res.statusText;
    if (typeof data === "object" && data && "error" in data) {
      const raw = (data as { error: unknown }).error;
      msg = typeof raw === "string" ? raw : JSON.stringify(raw);
    } else if (res.status === 404) {
      msg =
        "API topilmadi (404). Backend eski versiyada bo'lishi mumkin — Railway da `swift-bookings` / `django_backend` deploy qiling.";
    }
    throw new ApiError(msg || "So'rov xatosi", res.status, data);
  }
  return data as T;
}

export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export type RecentGuestDto = {
  /** API: `phone:…` / `passport:…` — takroriy mehmon kartochkasi */
  lookupKey?: string;
  name: string;
  phone: string;
  passportSeries?: string;
  lastVisit: string;
  price: number;
  paid?: number;
  /** Oxirgi faol yozuvdagi kechalar (qarz / narx hisobi bilan mos) */
  nights?: number;
  notes?: string;
  hostel?: string;
  room?: string;
  /** Oxirgi yozuvdagi hujjat suratlari (URL yoki base64, max 3) */
  photos?: string[];
};

export type BoardStats = {
  empty: number;
  guests: number;
  debt: number;
  revenue: number;
};

/** `bron` — mehmon kelmagan band; `check_in` — haqiqiy yashash. */
export type BoardBookingKind = "bron" | "check_in";

/** API: faol bronlar (static xonalar bilan merge qilinadi). */
export type BoardBookingRow = {
  roomCode: string;
  bedIndex: number;
  guestName: string;
  guestPhone: string;
  checkedInBy: string;
  bookingId: string;
  price: string;
  paid: string;
  notes: string;
  nights: number;
  checkInDate: string;
  /** SQLite / Django: bron yozuvi yaratilgan vaqt (check-in vaqti) */
  checkedInAt?: string;
  photos: string[];
  bookingKind?: BoardBookingKind;
  /** Bron: taxminiy kelish vaqti (matn) */
  expectedArrival?: string;
};

export type BoardResponse = {
  hostel: string;
  date: string;
  stats: BoardStats;
  bookings: BoardBookingRow[];
  cleaningByRoomCode: Record<string, "clean" | "dirty">;
  fullTakenByRoomCode?: Record<string, boolean>;
  fullTakenModeByRoomCode?: Record<string, "" | "check_in" | "bron">;
};

export async function fetchBoard(hostel: string, dateIso: string): Promise<BoardResponse> {
  const q = new URLSearchParams({ hostel, date: dateIso });
  return fetchJson(`/board?${q.toString()}`);
}

export type StaffUserDto = {
  id: number;
  login: string;
  display_name: string;
  role: "super_admin" | "admin" | "staff";
  active: boolean;
  created_at: string;
  auth_provider?: "telegram" | "password";
  telegram_user_id?: number | null;
  avatar_url?: string;
};

export async function fetchUsers(): Promise<{ users: StaffUserDto[] }> {
  return fetchJson("/users");
}

export async function createUser(body: {
  login: string;
  display_name: string;
  password: string;
  role: "admin" | "staff";
}): Promise<{ id: number; login: string }> {
  return fetchJson("/users", { method: "POST", body: JSON.stringify(body) });
}

export async function patchUser(
  id: number,
  body: Partial<{
    login: string;
    display_name: string;
    password: string;
    role: "super_admin" | "admin" | "staff";
    active: boolean;
    avatar_url: string;
  }>
): Promise<{ ok: boolean; updated: boolean }> {
  return fetchJson(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deactivateUser(id: number): Promise<{ ok: boolean }> {
  return fetchJson(`/users/${id}`, { method: "DELETE" });
}

export async function fetchRecentGuests(limit = 80): Promise<{ guests: RecentGuestDto[] }> {
  return fetchJson(`/guests/recent?limit=${limit}`);
}

export type GuestHistoryRow = {
  bookingId: string;
  roomName: string;
  hostel: string;
  bedIndex: number;
  checkInDate: string;
  nights: number;
  bookingKind: "bron" | "check_in";
  status: "active" | "cancelled";
  eventType: "check_in" | "check_out" | "bron" | "bron_cancel";
  notes: string;
  cancelReasonBron: string;
  cancelReasonCheckin: string;
  price: string;
  paid: string;
  guestName: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchGuestHistory(lookupKey: string): Promise<{ history: GuestHistoryRow[] }> {
  const q = new URLSearchParams({ lookupKey });
  return fetchJson(`/guests/history?${q.toString()}`);
}

export type CleaningRoomDto = {
  id: string;
  name: string;
  hostel: string;
  guestName: string;
  status: "dirty" | "cleaned";
  type: "room" | "bathroom";
  totalBeds: number;
  occupiedBeds: number;
  fullTaken?: boolean;
  fullTakenMode?: "" | "check_in" | "bron";
  photosBefore: string[];
  photosAfter: string[];
};

export async function fetchCleaning(hostel: string, dateIso: string): Promise<{ hostel: string; date: string; rooms: CleaningRoomDto[] }> {
  const q = new URLSearchParams({ hostel, date: dateIso });
  return fetchJson(`/cleaning?${q.toString()}`);
}

export async function patchCleaning(
  roomCode: string,
  body: {
    hostel: string;
    status?: "dirty" | "cleaned";
    photosBefore?: string[];
    photosAfter?: string[];
    fullTaken?: boolean;
    fullTakenMode?: "" | "check_in" | "bron";
  }
): Promise<{ ok: boolean; updated: boolean }> {
  return fetchJson(`/cleaning/${encodeURIComponent(roomCode)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export type BookingLineInput = {
  bedIndex: number;
  guestName: string;
  guestPhone: string;
  guestPassportSeries?: string;
  price: string;
  paid: string;
  notes: string;
  photos: string[];
  nights?: number;
  bookingKind?: BoardBookingKind;
  expectedArrival?: string;
};

/** Telefon/pasport boshqa aktiv yozuvda ham bo‘lsa — qaysi xona/karavot ekanligi (ogohlantirish). */
export type IdentityOverlapWarning = {
  roomName: string;
  roomCode: string;
  bedIndex: number;
};

export async function createBooking(body: {
  hostel: string;
  roomCode: string;
  checkInDate: string;
  nights: number;
  checkedInBy: string;
  lines: BookingLineInput[];
}): Promise<{ ids: string[]; identityOverlapWarnings: IdentityOverlapWarning[] }> {
  return fetchJson("/bookings", { method: "POST", body: JSON.stringify(body) });
}

export async function patchBooking(
  id: string,
  body: Partial<{
    guestName: string;
    guestPhone: string;
    guestPassportSeries: string;
    price: string;
    paid: string;
    notes: string;
    nights: number;
    checkInDate: string;
    photos: string[];
    checkedInBy: string;
    bookingKind: BoardBookingKind;
  }>
): Promise<{ ok: boolean; updated: boolean; identityOverlapWarning?: IdentityOverlapWarning }> {
  return fetchJson(`/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Bekor: `cancelReason` — qisqa matn (backendda bron/check-in uchun alohida log maydoniga yoziladi). */
export async function deleteBooking(id: string, cancelReason: string): Promise<{ ok: boolean }> {
  return fetchJson(`/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: JSON.stringify({ cancelReason }),
  });
}

export type ParsedDocumentDto = {
  ok: boolean;
  parsed: boolean;
  fullName?: string;
  birthDate?: string;
  expiryDate?: string;
  citizenship?: string;
  documentNumber?: string;
  documentType?: string;
  rawExtractedText?: string;
};

/** Birinchi hujjat rasmidan AI orqali maydonlarni ajratib oladi. */
export async function parseDocumentPhoto(photo: string): Promise<ParsedDocumentDto> {
  return fetchJson("/doc-parse", {
    method: "POST",
    body: JSON.stringify({ photo }),
  });
}
