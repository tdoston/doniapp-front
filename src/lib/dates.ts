import { differenceInCalendarDays, isToday, isYesterday, parse, parseISO } from "date-fns";

/** Bron qayd etilgan vaqt (`created_at`): SQLite `yyyy-MM-dd HH:mm:ss` yoki ISO — Toshkent vaqti. */
export function formatCheckInDateTime(raw: string | undefined | null): string {
  if (!raw?.trim()) return "";
  const s = raw.trim();
  let d: Date;
  try {
    if (s.includes("T")) {
      d = parseISO(s);
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
      d = parse(s, "yyyy-MM-dd HH:mm:ss", new Date());
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      d = parseISO(`${s}T00:00:00`);
    } else {
      d = new Date(s);
    }
  } catch {
    return "";
  }
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("uz-UZ", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function checkInLabel(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return "Bugun";
    if (isYesterday(d)) return "Kecha";
    const days = differenceInCalendarDays(new Date(), d);
    if (days === 2) return "2 kun oldin";
    if (days === 3) return "3 kun oldin";
    if (days > 0 && days <= 7) return `${days} kun oldin`;
    return iso;
  } catch {
    return iso;
  }
}
