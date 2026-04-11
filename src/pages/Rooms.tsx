import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RECENT_GUESTS } from "@/components/booking/RecentGuests";
import DateSelector from "@/components/rooms/DateSelector";
import StatCards from "@/components/rooms/StatCards";
import RoomCard, { RoomData } from "@/components/rooms/RoomCard";
import BottomNav from "@/components/rooms/BottomNav";
import CleaningPage from "@/pages/Cleaning";
import GuestsPage from "@/pages/Guests";
import PaymentsPage from "@/pages/Payments";

const HOSTELS = ["Vodnik", "Zargarlik", "Tabarruk"];

const MOCK_ROOMS: Record<string, RoomData[]> = {
  Vodnik: [
    {
      id: "v1", name: "1-qavat Zal", totalBeds: 4,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "empty" },
        { id: 3, status: "booked", guestName: "Miroj", guestPhone: "+998901234567", checkedInBy: "Doston" },
        { id: 4, status: "booked", guestName: "Akbar", guestPhone: "+998911234567", checkedInBy: "Doston" },
      ],
    },
    {
      id: "v2", name: "1-qavat Lux", totalBeds: 2,
      beds: [
        { id: 1, status: "booked", guestName: "Fatima", guestPhone: "+998921234567", checkedInBy: "Sardor" },
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
        { id: 1, status: "booked", guestName: "Sherzod", guestPhone: "+998931234567", checkedInBy: "Doston" },
        { id: 2, status: "booked", guestName: "Gulnora", guestPhone: "+998941234567", checkedInBy: "Doston" },
        { id: 3, status: "empty" },
        { id: 4, status: "empty" },
      ],
    },
    {
      id: "v5", name: "2-qavat Dvuxspalniy", totalBeds: 2,
      beds: [
        { id: 1, status: "booked", guestName: "Alisher", guestPhone: "+998951234567", checkedInBy: "Sardor" },
        { id: 2, status: "booked", guestName: "Nodira", guestPhone: "+998961234567", checkedInBy: "Sardor" },
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
        { id: 1, status: "booked", guestName: "Rustam", guestPhone: "+998971234567", checkedInBy: "Doston" },
      ],
    },
  ],
  Zargarlik: [
    {
      id: "z1", name: "Xona 1", totalBeds: 3,
      beds: [
        { id: 1, status: "booked", guestName: "Javohir", guestPhone: "+998981234567", checkedInBy: "Sardor" },
        { id: 2, status: "booked", guestName: "Sevara", guestPhone: "+998991234567", checkedInBy: "Sardor" },
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
        { id: 1, status: "booked", guestName: "Hamid", guestPhone: "+998901111111", checkedInBy: "Doston" },
        { id: 2, status: "booked", guestName: "Zainab", guestPhone: "+998902222222", checkedInBy: "Doston" },
        { id: 3, status: "empty" },
        { id: 4, status: "empty" },
        { id: 5, status: "empty" },
        { id: 6, status: "empty" },
        { id: 7, status: "booked", guestName: "Karim", guestPhone: "+998903333333", checkedInBy: "Sardor" },
        { id: 8, status: "booked", guestName: "Leila", guestPhone: "+998904444444", checkedInBy: "Sardor" },
      ],
    },
    {
      id: "z4", name: "Xona 4", totalBeds: 2,
      beds: [
        { id: 1, status: "empty" },
        { id: 2, status: "booked", guestName: "Timur", guestPhone: "+998905555555", checkedInBy: "Doston" },
      ],
    },
  ],
  Tabarruk: [
    {
      id: "t1", name: "Xona 1", totalBeds: 1,
      beds: [
        { id: 1, status: "booked", guestName: "Aziz", guestPhone: "+998906666666", checkedInBy: "Sardor" },
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
        { id: 1, status: "booked", guestName: "Bahor", guestPhone: "+998907777777", checkedInBy: "Doston" },
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
        { id: 1, status: "booked", guestName: "Daler", guestPhone: "+998908888888", checkedInBy: "Sardor" },
        { id: 2, status: "booked", guestName: "Elina", guestPhone: "+998909999999", checkedInBy: "Sardor" },
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
        { id: 2, status: "booked", guestName: "Farkhod", guestPhone: "+998910101010", checkedInBy: "Doston" },
        { id: 3, status: "empty" },
      ],
    },
    {
      id: "t8", name: "Xona 8", totalBeds: 3,
      beds: [
        { id: 1, status: "booked", guestName: "Gulzira", guestPhone: "+998911111111", checkedInBy: "Sardor" },
        { id: 2, status: "empty" },
        { id: 3, status: "empty" },
      ],
    },
  ],
};

const RoomsPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeHostel, setActiveHostel] = useState("Vodnik");
  const [activeTab, setActiveTab] = useState("rooms");
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
      const phoneClean = (bed.guestPhone || "").replace(/\D/g, "");
      const guestData = RECENT_GUESTS.find(g => g.phone === phoneClean);
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
          price: guestData ? String(guestData.price) : "",
          notes: guestData?.notes || "",
          checkedInBy: bed.checkedInBy,
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
      const phoneClean = (bed.guestPhone || "").replace(/\D/g, "");
      const guestData = RECENT_GUESTS.find(g => g.phone === phoneClean);
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
          price: guestData ? String(guestData.price) : "",
          notes: guestData?.notes || "",
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

  const renderContent = () => {
    switch (activeTab) {
      case "rooms":
        return (
          <>
            <StatCards stats={stats} />
            <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} />
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
          </>
        );
      case "guests":
        return <GuestsPage />;
      case "payments":
        return <PaymentsPage />;
      case "cleaning":
        return <CleaningPage />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-background pb-20"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-extrabold text-primary">DoniHostel</h1>
        </div>
        {activeTab === "rooms" && (
          <div className="flex">
            {HOSTELS.map((h) => (
              <button
                key={h}
                onClick={() => setActiveHostel(h)}
                className={`flex-1 py-2.5 text-sm font-bold transition-all border-b-2 ${
                  activeHostel === h
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        )}
      </div>

      {renderContent()}

      <BottomNav active={activeTab} onSelect={setActiveTab} />
    </div>
  );
};

export default RoomsPage;
