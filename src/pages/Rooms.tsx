import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import DateSelector from "@/components/rooms/DateSelector";
import StatCards from "@/components/rooms/StatCards";
import RoomCard, { type RoomData } from "@/components/rooms/RoomCard";
import BottomNav from "@/components/rooms/BottomNav";
import CleaningPage from "@/pages/Cleaning";
import GuestsPage from "@/pages/Guests";
import PaymentsPage from "@/pages/Payments";
import StaffUsersPage from "@/pages/StaffUsers";
import { fetchBoard } from "@/lib/api";
import type { BookingPrefillState } from "@/types/bookingPrefill";
import { splitContactForPrefill } from "@/lib/guestIdentity";
import { Button } from "@/components/ui/button";
import { STATIC_HOSTELS, getStaticRoomsForHostel } from "@/data/staticRooms";
import { mergeStaticRoomsWithBoard } from "@/lib/mergeBoard";

const RoomsPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeHostel, setActiveHostel] = useState<string>(STATIC_HOSTELS[0]);
  const [activeTab, setActiveTab] = useState("rooms");
  const navigate = useNavigate();

  const stayDateIso = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  const boardQuery = useQuery({
    queryKey: ["board", activeHostel, stayDateIso],
    queryFn: () => fetchBoard(activeHostel, stayDateIso),
  });

  const roomTemplates = useMemo(() => getStaticRoomsForHostel(activeHostel), [activeHostel]);

  const currentRooms = useMemo(
    () =>
      mergeStaticRoomsWithBoard(
        roomTemplates,
        boardQuery.data?.bookings ?? [],
        boardQuery.data?.cleaningByRoomCode ?? {}
      ),
    [roomTemplates, boardQuery.data?.bookings, boardQuery.data?.cleaningByRoomCode]
  );

  const stats = boardQuery.data?.stats ?? { empty: 0, guests: 0, debt: 0, revenue: 0 };
  const statsPending = !boardQuery.isSuccess;

  const roomOptions = currentRooms.map((r) => ({ id: r.id, name: r.name, totalBeds: r.totalBeds }));

  const buildEditState = (room: RoomData | undefined, bed: RoomData["beds"][number]): BookingPrefillState => {
    if (bed.status !== "booked") {
      return { mode: "create", hostel: activeHostel, roomOptions, stayDate: stayDateIso };
    }
    const { phone: editPhone, passportSeries: editPass } = splitContactForPrefill(bed.guestPhone || "");
    return {
      mode: "edit",
      hostel: activeHostel,
      roomOptions,
      stayDate: stayDateIso,
      roomId: room?.id,
      roomName: room?.name,
      bedId: bed.id,
      guestName: bed.guestName,
      guestPhone: editPhone,
      guestPassportSeries: editPass || undefined,
      price: bed.price ?? "",
      paid: bed.paid ?? "",
      notes: bed.notes ?? "",
      checkedInBy: bed.checkedInBy,
      bookingId: bed.bookingId,
      nights: bed.nights ?? 1,
      checkInDate: bed.checkInDate ?? stayDateIso,
      checkedInAt: bed.checkedInAt,
      bookingPhotos: bed.photos ?? [],
    };
  };

  const handleBedTap = (roomId: string, bedId: number) => {
    const room = currentRooms.find((r) => r.id === roomId);
    const bed = room?.beds.find((b) => b.id === bedId);
    if (!bed) return;

    if (bed.status === "booked") {
      navigate("/booking", { state: buildEditState(room, bed) });
      return;
    }

    navigate("/booking", {
      state: {
        mode: "create",
        hostel: activeHostel,
        roomOptions,
        stayDate: stayDateIso,
        roomId: room?.id,
        roomName: room?.name,
        bedId: bed.id,
      } satisfies BookingPrefillState,
    });
  };

  const handleBedLongPress = (roomId: string, bedId: number) => {
    const room = currentRooms.find((r) => r.id === roomId);
    const bed = room?.beds.find((b) => b.id === bedId);
    if (!bed) return;

    if (bed.status === "booked") {
      navigate("/booking", { state: buildEditState(room, bed) });
    } else {
      navigate("/booking", {
        state: {
          mode: "create",
          hostel: activeHostel,
          roomOptions,
          stayDate: stayDateIso,
          roomId: room?.id,
          roomName: room?.name,
          bedId,
        } satisfies BookingPrefillState,
      });
    }
  };

  const handleBookRoom = (roomId: string) => {
    const room = currentRooms.find((r) => r.id === roomId);
    if (!room) return;

    const emptyBedIds = room.beds.filter((b) => b.status === "empty").map((b) => b.id);

    navigate("/booking", {
      state: {
        mode: "create",
        bookingScope: "full-room",
        hostel: activeHostel,
        roomOptions,
        stayDate: stayDateIso,
        roomId: room.id,
        roomName: room.name,
        emptyBedIds,
      } satisfies BookingPrefillState,
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "rooms":
        return (
          <>
            <StatCards stats={stats} pending={statsPending} />
            <DateSelector selectedDate={selectedDate} onSelect={setSelectedDate} />
            {boardQuery.isLoading && (
              <p className="text-center text-sm text-muted-foreground py-10">Yuklanmoqda…</p>
            )}
            {boardQuery.isError && (
              <div className="px-4 py-8 text-center space-y-3">
                <p className="text-sm text-destructive font-medium">Ma&apos;lumotlar bazasiga ulanib bo&apos;lmadi.</p>
                <p className="text-xs text-muted-foreground">Django API va SQLite ni tekshiring.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => boardQuery.refetch()}>
                  Qayta urinish
                </Button>
              </div>
            )}
            {!boardQuery.isError && (
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
            )}
          </>
        );
      case "guests":
        return <GuestsPage />;
      case "payments":
        return <PaymentsPage />;
      case "cleaning":
        return <CleaningPage activeHostel={activeHostel} stayDateIso={stayDateIso} />;
      case "staff":
        return <StaffUsersPage />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-background pb-20"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-extrabold text-primary">DoniHostel</h1>
        </div>
        {(activeTab === "rooms" || activeTab === "cleaning") && (
          <div className="flex">
            {STATIC_HOSTELS.map((h) => (
              <button
                key={h}
                type="button"
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
