import type { BedData, RoomData } from "@/components/rooms/RoomCard";
import type { BoardBookingRow } from "@/lib/api";

/**
 * Statik filial xonalari + GET /board (DB) bronlari va tozalash holati.
 */
export function mergeStaticRoomsWithBoard(
  staticRooms: RoomData[],
  bookings: BoardBookingRow[],
  cleaningByRoomCode: Record<string, "clean" | "dirty">
): RoomData[] {
  const byKey = new Map<string, BoardBookingRow>();
  for (const b of bookings) {
    byKey.set(`${b.roomCode}:${b.bedIndex}`, b);
  }

  return staticRooms.map((room) => {
    const cleaningStatus = cleaningByRoomCode[room.id] ?? "dirty";
    const beds: BedData[] = room.beds.map((template) => {
      const i = template.id;
      const b = byKey.get(`${room.id}:${i}`);
      if (!b) {
        return { id: i, status: "empty" as const };
      }
      return {
        id: i,
        status: "booked" as const,
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
      photos: room.photos ?? [],
    };
  });
}
