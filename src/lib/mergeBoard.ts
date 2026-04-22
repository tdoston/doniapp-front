import type { BedData, RoomData } from "@/components/rooms/RoomCard";
import type { BoardBookingRow } from "@/lib/api";

function expectedArrivalFromNotes(notes: string | undefined): string {
  const n = (notes || "").trim();
  const m = n.match(/Kelish kutilmoqda:\s*(.+)/i);
  return m ? m[1].trim() : "";
}

/**
 * Statik filial xonalari + GET /board (DB) bronlari va tozalash holati.
 * @param _boardDateIso Taxta sanasi (caller bilan API mosligi).
 */
export function mergeStaticRoomsWithBoard(
  staticRooms: RoomData[],
  bookings: BoardBookingRow[],
  cleaningByRoomCode: Record<string, "clean" | "dirty">,
  fullTakenByRoomCode: Record<string, boolean>,
  fullTakenModeByRoomCode: Record<string, "" | "check_in" | "bron">,
  _boardDateIso: string
): RoomData[] {
  const byKey = new Map<string, BoardBookingRow>();
  for (const b of bookings) {
    byKey.set(`${b.roomCode}:${b.bedIndex}`, b);
  }

  return staticRooms.map((room) => {
    const cleaningStatus = cleaningByRoomCode[room.id] ?? "dirty";
    const fullTaken = Boolean(fullTakenByRoomCode[room.id]);
    const mode = fullTakenModeByRoomCode[room.id];
    const fullTakenMode: "" | "check_in" | "bron" = mode === "check_in" || mode === "bron" ? mode : "";
    const beds: BedData[] = room.beds.map((template) => {
      const i = template.id;
      const b = byKey.get(`${room.id}:${i}`);
      if (!b) {
        return { id: i, status: "empty" as const };
      }
      const bookingKind = b.bookingKind === "bron" ? ("bron" as const) : ("check_in" as const);
      const expectedArrival =
        (b.expectedArrival || "").trim() || (bookingKind === "bron" ? expectedArrivalFromNotes(b.notes) : "");
      return {
        id: i,
        status: "booked" as const,
        bookingKind,
        expectedArrival: expectedArrival || undefined,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        checkedInBy: b.checkedInBy,
        bookingId: b.bookingId,
        price: b.price,
        paid: b.paid,
        notes: b.notes,
        nights: b.nights,
        checkInDate: b.checkInDate,
        checkedInAt: b.checkedInAt,
        photos: Array.isArray(b.photos) ? b.photos : [],
      };
    });

    return {
      ...room,
      beds,
      cleaningStatus,
      fullTaken,
      fullTakenMode,
      photos: room.photos ?? [],
    };
  });
}
