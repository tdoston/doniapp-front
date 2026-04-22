import { digitsOnly } from "@/lib/api";
import { normalizePassportSeries } from "@/lib/guestIdentity";

/** Saqlangan izohdan telefon/hujjat qatorlarini o‘qish (maydonlarni to‘ldirish uchun). */
export function parseEmbeddedContactFromNotes(notes: string): { phone: string; passportSeries: string } {
  let phone = "";
  let passportSeries = "";
  for (const line of (notes || "").split("\n")) {
    const t = line.trim();
    const mt = /^Telefon:\s*(.+)$/i.exec(t);
    if (mt) phone = digitsOnly(mt[1]);
    const md = /^Pasport\/guvohnoma:\s*(.+)$/i.exec(t);
    if (md) passportSeries = normalizePassportSeries(md[1]);
    const mh = /^Hujjat:\s*(.+)$/i.exec(t);
    if (mh && !passportSeries) passportSeries = normalizePassportSeries(mh[1]);
  }
  return { phone, passportSeries };
}

/** Eski avtomatik qatorlarni yangilashda takrorlanishni oldini olish uchun. */
export function stripEmbeddedContactLines(notes: string): string {
  return (notes || "")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      return !/^\s*(Telefon|Pasport\/guvohnoma|Hujjat):\s/i.test(t);
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Telefon va hujjat seriyasini izoh oxiriga qo'shadi (bazaga `notes` sifatida). */
export function formatNotesWithContactDetails(notes: string, phone: string, passportSeries: string): string {
  const base = stripEmbeddedContactLines(notes);
  const d = digitsOnly(phone);
  const doc = normalizePassportSeries(passportSeries);
  const tail: string[] = [];
  if (d.length > 0) tail.push(`Telefon: ${d}`);
  if (doc.length > 0) tail.push(`Pasport/guvohnoma: ${doc}`);
  if (!tail.length) return base;
  if (!base) return tail.join("\n");
  return `${base}\n${tail.join("\n")}`;
}
