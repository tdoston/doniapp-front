import type { IdentityOverlapWarning } from "@/lib/api";

/** Taxtaga qaytishda ogohlantirishni ko‘rsatish uchun */
export const LAST_BOOKING_IDENTITY_OVERLAP_KEY = "lastBookingIdentityOverlapWarning";

function normalizeRoomLabel(label: string): string {
  const s = (label || "").trim();
  if (!s) return s;
  return s.replace(/\b(\d+)\s*TA\s*krovat\b/gi, (_, n: string) => `${n} ta krovat`);
}

export function formatIdentityOverlapWarningsUz(items: IdentityOverlapWarning[]): string {
  if (!items.length) return "";
  const parts = items.map((w) => {
    const label = normalizeRoomLabel((w.roomName || "").trim()) || w.roomCode || "xona";
    return `${label} · K${w.bedIndex}`;
  });
  return `Diqqat: bu telefon yoki pasport bo‘yicha boshqa yozuv mavjud — ${parts.join("; ")}. Yangi check-in saqlandi.`;
}
