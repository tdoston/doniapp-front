/** API dan kelgan xatoni foydalanuvchiga oddiy o‘zbekcha qilib beradi (eski inglizcha server uchun ham). */
export function bookingSaveErrorUz(raw: string): string {
  let t = (raw || "").trim().replace(/\s+/g, " ");
  if (!t) return "Saqlab bo‘lmadi. Internet yoki serverni tekshiring.";

  // Eski inglizcha backend (va boshqa variantlar)
  const bedNum = t.match(/bed\s*(\d+)/i)?.[1];
  if (bedNum && /already\s+booked|these\s+dates/i.test(t)) {
    return `${bedNum}-karavot bu kunlar uchun allaqachon band. Boshqa bo‘sh karavotni bosing yoki taxtada boshqa kunni tanlang.`;
  }

  // Eski server: uzun inglizcha-o‘zbekcha aralash matn
  if (t.includes("aktiv bron mavjud")) {
    return "Shu sanada boshqa karavot yoki xonada bu telefon yoki pasport bo‘yicha mehmon allaqachon check-in qilingan. Avval check-out qiling yoki boshqa sana tanlang.";
  }

  // Eski API matni
  if (t.includes("Bu telefon yoki pasport bo‘yicha shu sanalarda boshqa yozuv bor")) {
    return "Shu sanada boshqa karavot yoki xonada bu telefon yoki pasport bo‘yicha mehmon allaqachon check-in qilingan. Avval check-out qiling yoki boshqa sana tanlang.";
  }

  if (/dates overlap another active booking/i.test(t)) {
    return "Bu sanalar boshqa yozuv bilan ustma-ust. Kun yoki tunlar sonini o‘zgartiring.";
  }

  if (/room not found/i.test(t)) {
    return "Xona topilmadi. Taxtaga qaytib, yana tanlang.";
  }

  if (/invalid bed index for room \(max (\d+)\)/i.test(t)) {
    const m = t.match(/max (\d+)/i);
    return m ? `Bu xonada karavot raqami 1 dan ${m[1]} gacha. Kichikroq raqam tanlang.` : "Karavot raqami noto‘g‘ri.";
  }

  if (/invalid bedindex/i.test(t)) {
    return "Karavot raqami noto‘g‘ri.";
  }

  if (/invalid line/i.test(t)) {
    return "Yuborilgan qator noto‘g‘ri. Taxtadan qayta oching.";
  }

  if (/invalid body|invalid lines/i.test(t)) {
    return "Maʼlumotlar yetishmayapti. Taxtadan xonani va karavotni qayta tanlang.";
  }

  if (/booking not found/i.test(t)) {
    return "Yozuv topilmadi yoki u allaqachon yopilgan.";
  }

  if (/invalid checkindate/i.test(t)) {
    return "Kirish sanasi yyyy-mm-dd ko‘rinishida bo‘lishi kerak.";
  }

  if (/active booking not found/i.test(t)) {
    return "Faol yozuv topilmadi.";
  }

  if (/invalid json/i.test(t)) {
    return "Maʼlumot formati buzilgan (JSON).";
  }

  // Yangi backend allaqachon o‘zbekcha qaytaradi — o‘zgartirmaymiz
  return t;
}
