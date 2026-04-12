/** Backend `guest_identity` bilan mos: telefon (>=9 raqam) yoki pasport seriyasi (>=4 belgi). */

export function normalizePassportSeries(raw: string): string {
  return (raw || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 64);
}

export function computeGuestLookupKey(phone: string, passportSeries: string): string {
  const p = (phone || "").replace(/\D/g, "");
  if (p.length >= 9) return `phone:${p}`;
  const s = normalizePassportSeries(passportSeries);
  if (s.length >= 4) return `passport:${s}`;
  return "";
}

export function lineHasValidGuestIdentity(phone: string, passportSeries: string): boolean {
  return computeGuestLookupKey(phone, passportSeries) !== "";
}

/** Taxtadan kelgan `guestPhone` — raqamli yoki seriya (tahrir form uchun ajratish). */
export function splitContactForPrefill(display: string): { phone: string; passportSeries: string } {
  const raw = display || "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9) return { phone: digits, passportSeries: "" };
  const p = normalizePassportSeries(raw);
  if (p.length >= 4) return { phone: "", passportSeries: p };
  return { phone: digits, passportSeries: p };
}
