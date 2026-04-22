const LOCAL_DT = /^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})/;

/** Taxta sanasi bilan lokal `yyyy-MM-ddTHH:mm` (server / input). */
export function normalizeExpectedLocal(raw: string | undefined, boardDateIso: string): string {
  const s = (raw || "").trim();
  const m = s.match(LOCAL_DT);
  if (m) {
    const d = m[1];
    const hh = Math.min(23, Math.max(0, parseInt(m[2], 10)));
    const mm = Math.min(59, Math.max(0, parseInt(m[3], 10)));
    return `${d}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  }
  return `${boardDateIso}T14:00`;
}

export function parseLocalDateTime(iso: string): { date: string; hour24: number; minute: number } | null {
  const m = (iso || "").trim().match(LOCAL_DT);
  if (!m) return null;
  return { date: m[1], hour24: Math.min(23, Math.max(0, parseInt(m[2], 10))), minute: Math.min(59, Math.max(0, parseInt(m[3], 10))) };
}

export function toLocalDateTimeIso(date: string, hour24: number, minute: number): string {
  return `${date}T${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Ekran: `18.04.2026 · 14:30` (24 soat) */
export function formatBronArrivalHuman(iso: string): string {
  const p = parseLocalDateTime(iso);
  if (!p) return (iso || "").trim() || "—";
  const [y, mo, d] = p.date.split("-");
  const hh = String(p.hour24).padStart(2, "0");
  const mm = String(p.minute).padStart(2, "0");
  return `${d}.${mo}.${y} · ${hh}:${mm}`;
}
