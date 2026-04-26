/**
 * Check-in vaqt qoidasi (faqat UI eslatma — hisob emas).
 *
 * Standart check-in: 14:00.
 * - 00:00–05:59 → "Tungi narx" (full kecha)
 * - 06:00–11:59 → "Yarim kun" (50%)
 * - 12:00–13:59 → "Yaqin check-in" (neytral)
 * - 14:00+      → eslatma yo'q
 */
export type CheckInHintTone = "full" | "half" | "soon" | null;

export interface CheckInHint {
  tone: CheckInHintTone;
  label: string;
  detail: string;
}

export function getCheckInHint(now: Date = new Date()): CheckInHint {
  const h = now.getHours();
  if (h < 6) {
    return {
      tone: "full",
      label: "Tungi check-in (00:00–06:00)",
      detail: "Tavsiya: to'liq kecha narxi",
    };
  }
  if (h < 12) {
    return {
      tone: "half",
      label: "Erta check-in (06:00–12:00)",
      detail: "Tavsiya: 50% narx",
    };
  }
  if (h < 14) {
    return {
      tone: "soon",
      label: "Standart check-in 14:00 ga yaqin",
      detail: "Odatdagi narx",
    };
  }
  return { tone: null, label: "", detail: "" };
}