import type { BookingPrefillState } from "@/types/bookingPrefill";
import type { RecentGuestDto } from "@/lib/api";

/** CRM mehmon kartochkasi → `/booking` `state` qismi (xona/karavot tashqari). */
export function recentGuestToBookingPrefillFields(guest: RecentGuestDto): Partial<BookingPrefillState> {
  const priceNum = Math.round(Number(guest.price)) || 0;
  const paidNum = Math.round(Number(guest.paid ?? 0)) || 0;
  const lastNights =
    typeof guest.nights === "number" && guest.nights >= 1 ? Math.min(365, guest.nights) : 1;
  const snapPhotos = (guest.photos ?? []).filter((u) => typeof u === "string" && u.trim()).slice(0, 3);
  return {
    guestName: guest.name,
    guestPhone: guest.phone || "",
    guestPassportSeries: guest.passportSeries || "",
    ...(priceNum > 0 ? { price: String(priceNum) } : {}),
    paid: paidNum > 0 ? String(paidNum) : "0",
    nights: lastNights,
    ...(snapPhotos.length ? { bookingPhotos: snapPhotos } : {}),
  };
}

export const PENDING_CHECKIN_GUEST_KEY = "pendingCheckInGuest";
