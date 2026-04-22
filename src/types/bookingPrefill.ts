export interface BookingPrefillState {
  mode?: "create" | "edit";
  bookingScope?: "bed" | "full-room";
  hostel?: string;
  roomId?: string;
  roomName?: string;
  bedId?: number;
  guestName?: string;
  guestPhone?: string;
  /** Pasport seriyasi (telefon bo‘lmasa identifikator sifatida) */
  guestPassportSeries?: string;
  price?: string;
  paid?: string;
  notes?: string;
  checkedInBy?: string;
  roomOptions?: Array<{ id: string; name: string; totalBeds: number }>;
  /** ISO date yyyy-MM-dd — bron taxtasi sanasi */
  stayDate?: string;
  bookingId?: string;
  nights?: number;
  checkInDate?: string;
  /** Bron yozuvi yaratilgan vaqt (taxtadan) */
  checkedInAt?: string;
  /** API: `bron` yoki `check_in` (standart check-in) */
  bookingKind?: "bron" | "check_in";
  /** Bron: taxminiy kelish vaqti */
  expectedArrival?: string;
  bookingPhotos?: string[];
  /** To'liq xona: bo'sh karavot indekslari (tartibda) */
  emptyBedIds?: number[];
  /** CRM ro‘yxatidan / «Avval kelgan» oqimi — forma allaqachon to‘ldirilgan, banner «tanlandi» ko‘rinishi */
  fromRecentGuestList?: boolean;
}
