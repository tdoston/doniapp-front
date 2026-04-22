/** Bekor qilishda tanlanadigan sabablar (API `cancelReason` matni sifatida ketadi). */
export const BOOKING_CANCEL_REASONS = [
  { value: "no_show", label: "Mehmon kelmadi" },
  { value: "wrong_booking", label: "Bron xato / ma'lumot noto'g'ri" },
  { value: "early_leave", label: "Muddatidan oldin ketdi" },
  { value: "same_day_out", label: "O'sha kuni ketdi (check-out)" },
  { value: "other", label: "Boshqa sabab" },
] as const;

export type BookingCancelReasonValue = (typeof BOOKING_CANCEL_REASONS)[number]["value"];

/** Taxtadan bron (check-in emas) bekor qilish — muddat / check-out sabablari bu yerda yo‘q. */
export const BRON_BOARD_CANCEL_REASONS = [
  { value: "bron_wrong", label: "Bron xato / ma'lumot noto'g'ri" },
  { value: "bron_guest_cancelled", label: "Mehmon bronni bekor qildi" },
  { value: "bron_no_show", label: "Mehmon kelmadi yoki kelmaydi" },
  { value: "bron_plans_changed", label: "Reja o'zgardi (boshqa joy / muddat)" },
  { value: "other", label: "Boshqa sabab" },
] as const;

export type BronBoardCancelReasonValue = (typeof BRON_BOARD_CANCEL_REASONS)[number]["value"];
