import type { BedData, RoomData } from "@/components/rooms/RoomCard";

/** Filial (hostel) tablari — statik ro'yxat. */
export const STATIC_HOSTELS = ["Vodnik", "Zargarlik", "Tabarruk"] as const;

function emptyBeds(count: number): BedData[] {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, status: "empty" as const }));
}

function room(id: string, name: string, totalBeds: number, opts?: { inactive?: boolean }): RoomData {
  return { id, name, totalBeds, beds: emptyBeds(totalBeds), photos: [], ...opts };
}

/**
 * Filial bo'yicha xona katalogi (id, nom, karavotlar soni) — statik, DB bilan kodlar mos kelishi kerak.
 * Mehmonlar, statistika, tozalash: GET /board (Django + SQLite).
 */
export const STATIC_ROOMS: Record<string, RoomData[]> = {
  Vodnik: [
    room("v1", "1-qavat Zal", 4),
    room("v2", "1-qavat Lux", 2),
    room("v3", "1-qavat Koridor", 2),
    room("v4", "2-qavat Zal", 4),
    room("v5", "2-qavat Dvuxspalniy", 2),
    room("v6", "2-qavat 2 Kishilik", 2),
    room("v7", "2-qavat Koridor", 1),
  ],
  Zargarlik: [
    room("z1", "1-xona 7 TA krovat", 7),
    room("z2", "2-xona 3 TA krovat", 3),
    /** Nofaol xonalar — boshqa kodlarni yozing yoki `inactive` ni olib tashlang */
    room("z3", "3-xona 3 TA krovat", 3, { inactive: true }),
    room("z4", "4-xona 3 TA krovat", 3, { inactive: true }),
  ],
  Tabarruk: [
    room("t1", "1-xona Dushli", 2),
    room("t2", "2-xona Dushli", 2),
    room("t3", "3-xona", 2),
    room("t4", "4-xona", 2),
    room("t5", "5-xona", 2),
    room("t6", "6-xona", 2),
    room("t7", "7-xona", 2),
    room("t8", "8-xona", 2),
  ],
};

export function getStaticRoomsForHostel(hostel: string): RoomData[] {
  const list = STATIC_ROOMS[hostel];
  if (!list) return [];
  return list.map((r) => ({ ...r, beds: r.beds.map((b) => ({ ...b })) }));
}
