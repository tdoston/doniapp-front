import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CalendarBar from "@/components/rooms/CalendarBar";
import StatCards from "@/components/rooms/StatCards";
import RoomCard, { RoomData } from "@/components/rooms/RoomCard";
import BottomNav from "@/components/rooms/BottomNav";

const HOSTELS = ["Vodnik", "Zargarlik", "Tabarruk"];

const MOCK_ROOMS: Record<string, RoomData[]> = {
  Vodnik: [
    {
      id: "v1",
      name: "1-qavat Zal",
      totalBeds: 4,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
        { id: 3, status: "empty" },
        { id: 4, status: "empty" },
      ],
    },
    {
      id: "v2",
      name: "1-qavat Lux",
      totalBeds: 2,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
      ],
    },
    {
      id: "v3",
      name: "2-qavat Zal",
      totalBeds: 8,
      beds: [
        { id: 1, status: "booked", guestName: "Jasur" },
        { id: 2, status: "empty" },
        { id: 3, status: "booked", guestName: "Alisher" },
        { id: 4, status: "empty" },
        { id: 5, status: "empty" },
        { id: 6, status: "booked", guestName: "Bobur" },
        { id: 7, status: "empty" },
        { id: 8, status: "empty" },
      ],
    },
    {
      id: "v4",
      name: "2-qavat Lux",
      totalBeds: 2,
      beds: [
        { id: 1, status: "booked", guestName: "Sardor" },
        { id: 2, status: "empty" },
      ],
    },
  ],
  Zargarlik: [
    {
      id: "z1",
      name: "1-qavat Zal",
      totalBeds: 6,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "booked" },
        { id: 3, status: "empty" },
        { id: 4, status: "empty" },
        { id: 5, status: "booked" },
        { id: 6, status: "empty" },
      ],
    },
  ],
  Tabarruk: [
    {
      id: "t1",
      name: "1-qavat",
      totalBeds: 4,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
        { id: 3, status: "booked" },
        { id: 4, status: "empty" },
      ],
    },
  ],
};

const RoomsPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeHostel, setActiveHostel] = useState("Vodnik");
  const [rooms, setRooms] = useState<Record<string, RoomData[]>>(MOCK_ROOMS);
  const navigate = useNavigate();

  const currentRooms = rooms[activeHostel] || [];

  const stats = {
    empty: currentRooms.reduce((sum, r) => sum + r.beds.filter((b) => b.status === "empty").length, 0),
    guests: currentRooms.reduce((sum, r) => sum + r.beds.filter((b) => b.status === "booked").length, 0),
    debt: 0,
    revenue: 0,
  };

  const handleBedTap = (roomId: string, bedId: number) => {
    setRooms((prev) => {
      const updated = { ...prev };
      updated[activeHostel] = updated[activeHostel].map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          beds: room.beds.map((bed) => {
            if (bed.id !== bedId) return bed;
            if (bed.status === "empty") return { ...bed, status: "selected" as const };
            if (bed.status === "selected") return { ...bed, status: "empty" as const };
            return bed;
          }),
        };
      });
      return updated;
    });
  };

  const handleBedLongPress = (_roomId: string, bedId: number) => {
    toast.info(`Karavot ${bedId} uchun band qilish formasi`);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <h1 className="text-xl font-extrabold text-primary">DoniHostel</h1>
      </div>

      {/* Calendar */}
      <CalendarBar selectedDate={selectedDate} onSelect={setSelectedDate} />

      {/* Stats */}
      <StatCards stats={stats} />

      {/* Rooms */}
      <div className="pt-2">
        {currentRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onBedTap={handleBedTap}
            onBedLongPress={handleBedLongPress}
          />
        ))}
      </div>

      {/* Bottom Nav */}
      <BottomNav hostels={HOSTELS} active={activeHostel} onSelect={setActiveHostel} />
    </div>
  );
};

export default RoomsPage;
