/** Eslatma matnida `Mijoz: ...` birinchi qatorini ism bilan yangilash / qo‘shish. */
export function applyMijozNameToNotes(prevNotes: string, name: string): string {
  const t = name.trim();
  if (!t) return prevNotes;
  const raw = prevNotes ?? "";
  const lines = raw.split("\n");
  if (lines.length > 0 && /^Mijoz:\s*/i.test(lines[0] ?? "")) {
    lines[0] = `Mijoz: ${t}`;
    return lines.join("\n").trimEnd();
  }
  const rest = raw.trim();
  if (!rest) return `Mijoz: ${t}`;
  return `Mijoz: ${t}\n${rest}`;
}
