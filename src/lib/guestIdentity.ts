/**
 * Backend `guest_identity` bilan mos:
 * Birlamchi unique — HUJJAT seriyasi (pasport yoki haydovchilik guvohnomasi, >=4 belgi).
 * Telefon — ixtiyoriy qo‘shimcha. Eski yozuvlar uchun: agar seriya bo‘lmasa,
 * telefon (>=9 raqam) `phone:` kalit sifatida ishlatiladi.
 */

export function normalizePassportSeries(raw: string): string {
  return (raw || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 64);
}

export function computeGuestLookupKey(phone: string, passportSeries: string): string {
  const s = normalizePassportSeries(passportSeries);
  if (s.length >= 4) return `doc:${s}`;
  const p = (phone || "").replace(/\D/g, "");
  if (p.length >= 9) return `phone:${p}`;
  return "";
}

export function lineHasValidGuestIdentity(phone: string, passportSeries: string): boolean {
  return computeGuestLookupKey(phone, passportSeries) !== "";
}

/** Taxtadan kelgan `guestPhone` — raqamli (telefon) yoki seriya (hujjat) bo‘lishi mumkin. */
export function splitContactForPrefill(display: string): { phone: string; passportSeries: string } {
  const raw = display || "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9 && /^\+?\d+$/.test(raw.trim())) {
    return { phone: digits, passportSeries: "" };
  }
  const p = normalizePassportSeries(raw);
  if (p.length >= 4) return { phone: "", passportSeries: p };
  return { phone: digits, passportSeries: p };
}
