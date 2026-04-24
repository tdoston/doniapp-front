import type { RoomData } from "@/components/rooms/RoomCard";
import type { RoomCatalogRow } from "@/lib/api";

/** GET /api/catalog/rooms javobini taxta `RoomData[]` ga aylantiradi. */
export function roomCatalogToRoomData(rows: RoomCatalogRow[]): RoomData[] {
  return rows.map((r) => ({
    id: r.code,
    name: r.name,
    totalBeds: r.bed_count,
    inactive: Boolean(r.inactive),
    beds: Array.from({ length: r.bed_count }, (_, i) => ({ id: i + 1, status: "empty" as const })),
    photos: [],
  }));
}
