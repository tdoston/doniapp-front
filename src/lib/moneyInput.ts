/** Raqam + formatlash: API `75000.0` → 75000 ko‘rinadi; `75.000` (minglik nuqta) → 75000. */
export function formatSoumDisplay(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const m = /^(\d+)\.(\d+)$/.exec(t);
  if (m && /^0+$/.test(m[2])) {
    const intPart = m[1];
    const frac = m[2];
    const digits = t.replace(/\D/g, "");
    if (frac.length <= 2) {
      return Number(intPart).toLocaleString("uz-UZ");
    }
    return Number(digits).toLocaleString("uz-UZ");
  }
  const num = t.replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("uz-UZ");
}

export function digitsFromSoumInput(raw: string): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  const m = /^(\d+)\.(\d+)$/.exec(t);
  if (m && /^0+$/.test(m[2])) {
    const intPart = m[1];
    const frac = m[2];
    if (frac.length <= 2) return intPart;
    return t.replace(/\D/g, "");
  }
  return t.replace(/\D/g, "");
}
