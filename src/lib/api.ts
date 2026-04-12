/**
 * Django REST `/api` (SQLite). Filial bo'yicha xona katalogi frontendda statik;
 * taxta / mehmonlar / tozalash: GET /board, /guests/recent, /cleaning; yozuvlar: /bookings.
 */
/** Dev: `/api` (Vite → backend). Prod: masalan `https://api.example.com/api` */
const API_BASE = (import.meta.env.VITE_API_BASE ?? "/api").replace(/\/$/, "");

/** React Query: `invalidateQueries({ queryKey: ["recentGuests"] })` barcha limitlarni yangilaydi */
export const recentGuestsQueryKey = (limit: number) => ["recentGuests", limit] as const;

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

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
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
  paid: number;
  notes?: string;
  hostel?: string;
  room?: string;
};

export type BoardStats = {
  empty: number;
  guests: number;
  debt: number;
  revenue: number;
};

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
};

export type BoardResponse = {
  hostel: string;
  date: string;
  stats: BoardStats;
  bookings: BoardBookingRow[];
  cleaningByRoomCode: Record<string, "clean" | "dirty">;
};

export async function fetchBoard(hostel: string, dateIso: string): Promise<BoardResponse> {
  const q = new URLSearchParams({ hostel, date: dateIso });
  return fetchJson(`/board?${q.toString()}`);
}

export type StaffUserDto = {
  id: number;
  login: string;
  display_name: string;
  role: string;
  active: boolean;
  created_at: string;
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
  body: Partial<{ display_name: string; password: string; role: "admin" | "staff"; active: boolean }>
): Promise<{ ok: boolean; updated: boolean }> {
  return fetchJson(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deactivateUser(id: number): Promise<{ ok: boolean }> {
  return fetchJson(`/users/${id}`, { method: "DELETE" });
}

export async function fetchRecentGuests(limit = 80): Promise<{ guests: RecentGuestDto[] }> {
  return fetchJson(`/guests/recent?limit=${limit}`);
}

/** Passport/ID (data URL) — backend Tesseract OCR (tashqi AI yo‘q). */
export type ExtractIdFromImageResponse = {
  full_name: string;
  document_number?: string;
  date_of_birth?: string;
  expiry_date?: string;
  mrz_detected?: boolean;
  raw_text_preview?: string;
  /** passporteye | tesseract_heuristic */
  mrz_source?: string;
  mrz_type?: string;
  mrz_valid_score?: number;
  mrz_valid?: boolean;
  country?: string;
  nationality?: string;
  sex?: string;
  document_type?: string;
  name_fallback?: string;
};

export async function extractGuestNameFromIdImage(imageDataUrl: string): Promise<ExtractIdFromImageResponse> {
  return fetchJson(`/guests/extract-name-from-id`, {
    method: "POST",
    body: JSON.stringify({ image: imageDataUrl }),
  });
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
  photosBefore: string[];
  photosAfter: string[];
};

export async function fetchCleaning(hostel: string, dateIso: string): Promise<{ hostel: string; date: string; rooms: CleaningRoomDto[] }> {
  const q = new URLSearchParams({ hostel, date: dateIso });
  return fetchJson(`/cleaning?${q.toString()}`);
}

export async function patchCleaning(
  roomCode: string,
  body: { hostel: string; status?: "dirty" | "cleaned"; photosBefore?: string[]; photosAfter?: string[] }
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
};

export async function createBooking(body: {
  hostel: string;
  roomCode: string;
  checkInDate: string;
  nights: number;
  checkedInBy: string;
  lines: BookingLineInput[];
}): Promise<{ ids: string[] }> {
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
  }>
): Promise<{ ok: boolean; updated: boolean }> {
  return fetchJson(`/bookings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Bekor: `cancelReason` — qisqa matn (jurnal uchun notes ga qo‘shiladi). */
export async function deleteBooking(id: string, cancelReason: string): Promise<{ ok: boolean }> {
  return fetchJson(`/bookings/${encodeURIComponent(id)}`, {
    method: "DELETE",
    body: JSON.stringify({ cancelReason }),
  });
}
