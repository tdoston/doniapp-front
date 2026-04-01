import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarBar from "@/components/rooms/CalendarBar";
import StatCards from "@/components/rooms/StatCards";
import RoomCard, { RoomData } from "@/components/rooms/RoomCard";
import BottomNav from "@/components/rooms/BottomNav";

const HOSTELS = ["Vodnik", "Zargarlik", "Tabarruk"];

const MOCK_ROOMS: Record<string, RoomData[]> = {
  Vodnik: [
    {
      id: "v1", name: "1-qavat Zal", totalBeds: 4,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
        { id: 3, status: "booked", guestName: "Miroj", guestPhone: "+998901234567" },
        { id: 4, status: "booked", guestName: "Akbar", guestPhone: "+998911234567" },
      ],
    },
    {
      id: "v2", name: "1-qavat Lux", totalBeds: 2,
      beds: [
        { id: 1, status: "booked", guestName: "Fatima", guestPhone: "+998921234567" },
        { id: 2, status: "empty" },
      ],
    },
    {
      id: "v3", name: "1-qavat Koridor", totalBeds: 2,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
      ],
    },
    {
      id: "v4", name: "2-qavat Zal", totalBeds: 4,
      beds: [
        { id: 1, status: "booked", guestName: "Sherzod", guestPhone: "+998931234567" },
        { id: 2, status: "booked", guestName: "Gulnora", guestPhone: "+998941234567" },
        { id: 3, status: "empty" },
        { id: 4, status: "empty" },
      ],
    },
    {
      id: "v5", name: "2-qavat Dvuxspalniy", totalBeds: 2,
      beds: [
        { id: 1, status: "booked", guestName: "Alisher", guestPhone: "+998951234567" },
        { id: 2, status: "booked", guestName: "Nodira", guestPhone: "+998961234567" },
      ],
    },
    {
      id: "v6", name: "2-qavat 2 Kishilik", totalBeds: 2,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
      ],
    },
    {
      id: "v7", name: "2-qavat Koridor", totalBeds: 1,
      beds: [
        { id: 1, status: "booked", guestName: "Rustam", guestPhone: "+998971234567" },
      ],
    },
  ],
  Zargarlik: [
    {
      id: "z1", name: "Xona 1", totalBeds: 3,
      beds: [
        { id: 1, status: "booked", guestName: "Javohir", guestPhone: "+998981234567" },
        { id: 2, status: "booked", guestName: "Sevara", guestPhone: "+998991234567" },
        { id: 3, status: "empty" },
      ],
    },
    {
      id: "z2", name: "Xona 2", totalBeds: 3,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
        { id: 3, status: "empty" },
      ],
    },
    {
      id: "z3", name: "Xona 3", totalBeds: 8,
      beds: [
        { id: 1, status: "booked", guestName: "Hamid", guestPhone: "+998901111111" },
        { id: 2, status: "booked", guestName: "Zainab", guestPhone: "+998902222222" },
        { id: 3, status: "empty" },
        { id: 4, status: "empty" },
        { id: 5, status: "empty" },
        { id: 6, status: "empty" },
        { id: 7, status: "booked", guestName: "Karim", guestPhone: "+998903333333" },
        { id: 8, status: "booked", guestName: "Leila", guestPhone: "+998904444444" },
      ],
    },
    {
      id: "z4", name: "Xona 4", totalBeds: 2,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "booked", guestName: "Timur", guestPhone: "+998905555555" },
      ],
    },
  ],
  Tabarruk: [
    {
      id: "t1", name: "Xona 1", totalBeds: 1,
      beds: [
        { id: 1, status: "booked", guestName: "Aziz", guestPhone: "+998906666666" },
      ],
    },
    {
      id: "t2", name: "Xona 2", totalBeds: 1,
      beds: [
        { id: 1, status: "empty" },
      ],
    },
    {
      id: "t3", name: "Xona 3", totalBeds: 2,
      beds: [
        { id: 1, status: "booked", guestName: "Bahor", guestPhone: "+998907777777" },
        { id: 2, status: "empty" },
      ],
    },
    {
      id: "t4", name: "Xona 4", totalBeds: 2,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
      ],
    },
    {
      id: "t5", name: "Xona 5", totalBeds: 2,
      beds: [
        { id: 1, status: "booked", guestName: "Daler", guestPhone: "+998908888888" },
        { id: 2, status: "booked", guestName: "Elina", guestPhone: "+998909999999" },
      ],
    },
    {
      id: "t6", name: "Xona 6", totalBeds: 2,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
      ],
    },
    {
      id: "t7", name: "Xona 7", totalBeds: 3,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "booked", guestName: "Farkhod", guestPhone: "+998910101010" },
        { id: 3, status: "empty" },
      ],
    },
    {
      id: "t8", name: "Xona 8", totalBeds: 3,
      beds: [
        { id: 1, status: "booked", guestName: "Gulzira", guestPhone: "+998911111111" },
        { id: 2, status: "empty" },
        { id: 3, status: "empty" },
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
    const room = currentRooms.find((r) => r.id === roomId);
    const bed = room?.beds.find((b) => b.id === bedId);
    if (!bed) return;

    if (bed.status === "booked") {
      navigate("/booking", {
        state: {
          mode: "edit",
          hostel: activeHostel,
          roomOptions: currentRooms.map((r) => ({ id: r.id, name: r.name, totalBeds: r.totalBeds })),
          roomId: room?.id,
          roomName: room?.name,
          bedId: bed.id,
          guestName: bed.guestName,
          guestPhone: bed.guestPhone,
        },
      });
      return;
    }

    navigate("/booking", {
      state: {
        mode: "create",
        hostel: activeHostel,
        roomOptions: currentRooms.map((r) => ({ id: r.id, name: r.name, totalBeds: r.totalBeds })),
        roomId: room?.id,
        roomName: room?.name,
        bedId: bed.id,
      },
    });
  };

  const handleBedLongPress = (roomId: string, bedId: number) => {
    const room = currentRooms.find((r) => r.id === roomId);
    const bed = room?.beds.find((b) => b.id === bedId);
    if (bed?.status === "booked") {
      navigate("/booking", {
        state: {
          mode: "edit",
          hostel: activeHostel,
          roomOptions: currentRooms.map((r) => ({ id: r.id, name: r.name, totalBeds: r.totalBeds })),
          roomId: room?.id,
          roomName: room?.name,
          bedId: bed.id,
          guestName: bed.guestName,
          guestPhone: bed.guestPhone,
        },
      });
    } else {
      navigate("/booking", {
        state: {
          mode: "create",
          hostel: activeHostel,
          roomOptions: currentRooms.map((r) => ({ id: r.id, name: r.name, totalBeds: r.totalBeds })),
          roomId: room?.id,
          roomName: room?.name,
          bedId,
        },
      });
    }
  };

  const handleBookRoom = (roomId: string) => {
    const room = currentRooms.find((r) => r.id === roomId);
    if (!room) return;

    navigate("/booking", {
      state: {
        mode: "create",
        bookingScope: "full-room",
        hostel: activeHostel,
        roomOptions: currentRooms.map((r) => ({ id: r.id, name: r.name, totalBeds: r.totalBeds })),
        roomId: room.id,
        roomName: room.name,
      },
    });
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(76px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <h1 className="text-xl font-extrabold text-primary">DoniHostel</h1>
      </div>

      <StatCards stats={stats} />
      <div className="pt-2">
        <CalendarBar selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      <div className="pt-3">
        {currentRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onBedTap={handleBedTap}
            onBedLongPress={handleBedLongPress}
            onBookRoom={handleBookRoom}
          />
        ))}
      </div>

      <BottomNav hostels={HOSTELS} active={activeHostel} onSelect={setActiveHostel} />
    </div>
  );
};

export default RoomsPage;
