import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import DateSelector from "@/components/rooms/DateSelector";
import StatCards from "@/components/rooms/StatCards";
import RoomCard, { type RoomData } from "@/components/rooms/RoomCard";
import EmptyBedStartDialog, { type EmptyBedTarget } from "@/components/rooms/EmptyBedStartDialog";
import RecentGuests from "@/components/booking/RecentGuests";
import BottomNav from "@/components/rooms/BottomNav";
import CleaningPage from "@/pages/Cleaning";
import GuestsPage from "@/pages/Guests";
import PaymentsPage from "@/pages/Payments";
import StaffUsersPage from "@/pages/StaffUsers";
import { ApiError, createBooking, deleteBooking, fetchBoard, patchBooking, patchCleaning, type IdentityOverlapWarning } from "@/lib/api";
import type { BookingPrefillState } from "@/types/bookingPrefill";
import type { RecentGuestDto } from "@/lib/api";
import { PENDING_CHECKIN_GUEST_KEY, recentGuestToBookingPrefillFields } from "@/lib/recentGuestPrefill";
import { splitContactForPrefill } from "@/lib/guestIdentity";
import { Button } from "@/components/ui/button";
import { STATIC_HOSTELS, getStaticRoomsForHostel } from "@/data/staticRooms";
import { mergeStaticRoomsWithBoard } from "@/lib/mergeBoard";
import { formatIdentityOverlapWarningsUz, LAST_BOOKING_IDENTITY_OVERLAP_KEY } from "@/lib/identityOverlapWarning";
import { normalizeExpectedLocal } from "@/lib/bronTime";

const LAST_ACTIVE_HOSTEL_KEY = "rooms:lastActiveHostel";

const RoomsPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeHostel, setActiveHostel] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem(LAST_ACTIVE_HOSTEL_KEY);
      if (saved && STATIC_HOSTELS.includes(saved as (typeof STATIC_HOSTELS)[number])) return saved;
    } catch {
      void 0;
    }
    return STATIC_HOSTELS[0];
  });
  const [activeTab, setActiveTab] = useState("rooms");
  const [emptyBedCtx, setEmptyBedCtx] = useState<EmptyBedTarget | null>(null);
  const [recentFromBedCtx, setRecentFromBedCtx] = useState<EmptyBedTarget | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [identityOverlapBanner, setIdentityOverlapBanner] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_BOOKING_IDENTITY_OVERLAP_KEY);
      if (!raw) return;
      sessionStorage.removeItem(LAST_BOOKING_IDENTITY_OVERLAP_KEY);
      const items = JSON.parse(raw) as IdentityOverlapWarning[];
      if (Array.isArray(items) && items.length > 0) {
        setIdentityOverlapBanner(formatIdentityOverlapWarningsUz(items));
      }
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(LAST_ACTIVE_HOSTEL_KEY, activeHostel);
    } catch {
      void 0;
    }
  }, [activeHostel]);

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
        boardQuery.data?.cleaningByRoomCode ?? {},
        boardQuery.data?.fullTakenByRoomCode ?? {},
        boardQuery.data?.fullTakenModeByRoomCode ?? {},
        stayDateIso
      ),
    [
      roomTemplates,
      boardQuery.data?.bookings,
      boardQuery.data?.cleaningByRoomCode,
      boardQuery.data?.fullTakenByRoomCode,
      boardQuery.data?.fullTakenModeByRoomCode,
      stayDateIso,
    ]
  );

  const openEmptyBeds = useMemo(
    () =>
      currentRooms.reduce((sum, room) => {
        if (room.inactive || room.fullTaken) return sum;
        return sum + room.beds.filter((b) => b.status === "empty").length;
      }, 0),
    [currentRooms]
  );

  const stats = useMemo(() => {
    const base = boardQuery.data?.stats ?? { empty: 0, guests: 0, debt: 0, revenue: 0 };
    return { ...base, empty: openEmptyBeds };
  }, [boardQuery.data?.stats, openEmptyBeds]);
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
      bookingKind: bed.bookingKind,
      expectedArrival: bed.expectedArrival,
      bookingPhotos: bed.photos ?? [],
    };
  };

  const openEmptyBedDialog = (roomId: string, bedId: number) => {
    const room = currentRooms.find((r) => r.id === roomId);
    if (!room) return;
    setEmptyBedCtx({ roomId: room.id, roomName: room.name, bedId });
  };

  const goNewGuestBooking = useCallback(
    (ctx: EmptyBedTarget) => {
      let fromList: Partial<BookingPrefillState> = {};
      try {
        const raw = sessionStorage.getItem(PENDING_CHECKIN_GUEST_KEY);
        if (raw) {
          const g = JSON.parse(raw) as RecentGuestDto;
          fromList = recentGuestToBookingPrefillFields(g);
          sessionStorage.removeItem(PENDING_CHECKIN_GUEST_KEY);
        }
      } catch {
        void 0;
      }
      navigate("/booking", {
        state: {
          mode: "create",
          hostel: activeHostel,
          roomOptions,
          stayDate: stayDateIso,
          roomId: ctx.roomId,
          roomName: ctx.roomName,
          bedId: ctx.bedId,
          ...(Object.keys(fromList).length > 0 ? { fromRecentGuestList: true as const } : {}),
          ...fromList,
        } satisfies BookingPrefillState,
      });
    },
    [navigate, activeHostel, roomOptions, stayDateIso]
  );

  const cancelExistingBron = useCallback(
    async (bookingId: string, cancelReason: string) => {
      try {
        await deleteBooking(bookingId, cancelReason);
        await queryClient.invalidateQueries({ queryKey: ["board"] });
        await queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
      } catch (e) {
        if (e instanceof ApiError) throw new Error(e.message);
        throw e;
      }
    },
    [queryClient]
  );

  const confirmBronReserve = useCallback(
    async (ctx: EmptyBedTarget, expectedArrivalLocal: string, bronNotes = ""): Promise<string> => {
      const doc = `BRON${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      try {
        const res = await createBooking({
          hostel: activeHostel,
          roomCode: ctx.roomId,
          checkInDate: stayDateIso,
          nights: 1,
          checkedInBy: "",
          lines: [
            {
              bedIndex: ctx.bedId,
              guestName: "Bron",
              guestPhone: "",
              guestPassportSeries: doc,
              price: "0",
              paid: "0",
              notes: bronNotes.slice(0, 2000),
              photos: [],
              bookingKind: "bron",
              expectedArrival: expectedArrivalLocal,
            },
          ],
        });
        await queryClient.invalidateQueries({ queryKey: ["board"] });
        await queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
        return res.ids[0] || "";
      } catch (e) {
        if (e instanceof ApiError) throw new Error(e.message);
        throw e;
      }
    },
    [activeHostel, stayDateIso, queryClient]
  );

  const updateBronDraftNote = useCallback(
    async (bookingId: string, notes: string) => {
      if (!bookingId) return;
      try {
        await patchBooking(bookingId, { notes: notes.slice(0, 2000) });
        await queryClient.invalidateQueries({ queryKey: ["board"] });
        await queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
      } catch (e) {
        if (e instanceof ApiError) throw new Error(e.message);
        throw e;
      }
    },
    [queryClient]
  );

  const confirmFullRoomBronReserve = useCallback(
    async (roomId: string) => {
      const room = currentRooms.find((r) => r.id === roomId);
      if (!room) return;
      if (room.inactive) {
        window.alert("Nofaol xonaga yangi bron qilib bo‘lmaydi.");
        return;
      }
      const emptyBeds = room.beds.filter((b) => b.status === "empty").map((b) => b.id);
      if (emptyBeds.length === 0 || emptyBeds.length !== room.totalBeds) {
        window.alert("To‘liq bron qilish uchun xona to‘liq bo‘sh bo‘lishi kerak.");
        return;
      }
      try {
        await createBooking({
          hostel: activeHostel,
          roomCode: room.id,
          checkInDate: stayDateIso,
          nights: 1,
          checkedInBy: "",
          lines: emptyBeds.map((bedIndex) => ({
            bedIndex,
            guestName: "Bron",
            guestPhone: "",
            guestPassportSeries: `BRON${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`,
            price: "0",
            paid: "0",
            notes: "",
            photos: [],
            bookingKind: "bron" as const,
            expectedArrival: normalizeExpectedLocal(undefined, stayDateIso),
          })),
        });
        await queryClient.invalidateQueries({ queryKey: ["board"] });
        await queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "To‘liq bron qilib bo‘lmadi";
        window.alert(msg);
      }
    },
    [activeHostel, currentRooms, stayDateIso, queryClient]
  );

  const handleToggleFullTaken = useCallback(
    async (roomId: string, next: boolean, mode: "" | "check_in" | "bron") => {
      try {
        await patchCleaning(roomId, { hostel: activeHostel, fullTaken: next, fullTakenMode: next ? mode : "" });
        await queryClient.invalidateQueries({ queryKey: ["board"] });
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Xonani to‘liq olish holatini saqlab bo‘lmadi";
        window.alert(msg);
      }
    },
    [activeHostel, queryClient]
  );

  const handleCancelFullRoomBron = useCallback(
    async (roomId: string): Promise<boolean> => {
      const room = currentRooms.find((r) => r.id === roomId);
      if (!room) return false;
      const bronBookingIds = room.beds
        .filter((b) => b.status === "booked" && b.bookingKind === "bron" && !!b.bookingId)
        .map((b) => b.bookingId as string);
      if (bronBookingIds.length === 0) return false;
      try {
        for (const id of bronBookingIds) {
          await deleteBooking(id, "Xona bo‘yicha to‘liq bron bekor qilindi");
        }
        await patchCleaning(roomId, { hostel: activeHostel, fullTaken: false, fullTakenMode: "" });
        await queryClient.invalidateQueries({ queryKey: ["board"] });
        await queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
        return true;
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "To‘liq bronni bekor qilib bo‘lmadi";
        window.alert(msg);
        return false;
      }
    },
    [activeHostel, currentRooms, queryClient]
  );

  const handleBedTap = (roomId: string, bedId: number) => {
    const room = currentRooms.find((r) => r.id === roomId);
    const bed = room?.beds.find((b) => b.id === bedId);
    if (!bed) return;

    if (bed.status === "booked") {
      if (!room) return;
      if (bed.bookingKind === "bron" && bed.bookingId) {
        setEmptyBedCtx({
          roomId: room.id,
          roomName: room.name,
          bedId: bed.id,
          existingBron: {
            bookingId: bed.bookingId,
            expectedArrival: bed.expectedArrival || "",
            notes: bed.notes || "",
          },
        });
        return;
      }
      navigate("/booking", { state: buildEditState(room, bed) });
      return;
    }

    openEmptyBedDialog(roomId, bedId);
  };

  const handleBedLongPress = (roomId: string, bedId: number) => {
    const room = currentRooms.find((r) => r.id === roomId);
    const bed = room?.beds.find((b) => b.id === bedId);
    if (!bed) return;

    if (bed.status === "booked") {
      if (!room) return;
      if (bed.bookingKind === "bron" && bed.bookingId) {
        setEmptyBedCtx({
          roomId: room.id,
          roomName: room.name,
          bedId: bed.id,
          existingBron: {
            bookingId: bed.bookingId,
            expectedArrival: bed.expectedArrival || "",
            notes: bed.notes || "",
          },
        });
        return;
      }
      navigate("/booking", { state: buildEditState(room, bed) });
    } else {
      openEmptyBedDialog(roomId, bedId);
    }
  };

  const refreshAll = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["board"] });
      await queryClient.invalidateQueries({ queryKey: ["recentGuests"] });
      await queryClient.invalidateQueries({ queryKey: ["cleaning"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      if (activeTab === "rooms") await boardQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, boardQuery, queryClient, refreshing]);

  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullEligible, setPullEligible] = useState(false);

  const handleRootTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartY(e.touches[0].clientY);
    setPullEligible(window.scrollY <= 0);
  };

  const handleRootTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!pullEligible || touchStartY === null || refreshing) return;
    const dy = e.touches[0].clientY - touchStartY;
    if (dy <= 0) {
      setPullDistance(0);
      return;
    }
    setPullDistance(Math.min(72, dy * 0.35));
  };

  const handleRootTouchEnd = () => {
    const shouldRefresh = pullDistance >= 44;
    setTouchStartY(null);
    setPullEligible(false);
    setPullDistance(0);
    if (shouldRefresh) {
      void refreshAll();
    }
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
                <p className="text-xs text-muted-foreground">Internetni tekshirib, qayta urinib ko&apos;ring.</p>
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
                    onFullRoomBron={confirmFullRoomBronReserve}
                    onToggleFullTaken={handleToggleFullTaken}
                    onCancelFullRoomBron={handleCancelFullRoomBron}
                  />
                ))}
              </div>
            )}
          </>
        );
      case "guests":
        return (
          <GuestsPage
            onGuestPickForCheckIn={(guest) => {
              sessionStorage.setItem(PENDING_CHECKIN_GUEST_KEY, JSON.stringify(guest));
              setActiveTab("rooms");
            }}
          />
        );
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
      onTouchStart={handleRootTouchStart}
      onTouchMove={handleRootTouchMove}
      onTouchEnd={handleRootTouchEnd}
      onTouchCancel={handleRootTouchEnd}
    >
      <div className="sticky top-0 z-10 bg-card border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-primary min-w-0">
            <img src="/logo-mehmon-uyi.png" alt="Mehmon Uyi" className="h-10 w-10 shrink-0 object-contain" />
            <span className="truncate">DoniHostel</span>
          </h1>
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={refreshing}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground/80 active:scale-[0.98] disabled:opacity-50"
            title="Yangilash"
            aria-label="Yangilash"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin [animation-duration:1.4s]" : ""}`} />
          </button>
        </div>
        {(pullDistance > 0 || refreshing) && (
          <div className="px-4 pb-2">
            <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <span>{refreshing ? "Yangilanmoqda..." : "Yangilash uchun torting"}</span>
              <span className="tabular-nums">
                {`${Math.min(100, Math.round((pullDistance / 44) * 100))}%`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full transition-all ${refreshing ? "bg-gradient-to-r from-primary/60 via-primary to-primary/60 animate-pulse" : "bg-primary"}`}
                style={{ width: `${refreshing ? 100 : Math.min(100, (pullDistance / 44) * 100)}%` }}
              />
            </div>
          </div>
        )}
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

      {identityOverlapBanner ? (
        <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-600/25 text-amber-950 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-50">
          <div className="flex items-start gap-3 max-w-lg mx-auto">
            <p className="text-sm font-semibold leading-snug flex-1 min-w-0">{identityOverlapBanner}</p>
            <button
              type="button"
              onClick={() => setIdentityOverlapBanner(null)}
              className="shrink-0 text-xs font-bold px-2 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 active:scale-[0.98] transition-colors"
            >
              Yopish
            </button>
          </div>
        </div>
      ) : null}

      {renderContent()}

      <EmptyBedStartDialog
        context={emptyBedCtx}
        stayDateIso={stayDateIso}
        onClose={() => setEmptyBedCtx(null)}
        onYangiMehmon={goNewGuestBooking}
        onAvvalKelgan={(ctx) => {
          setEmptyBedCtx(null);
          setRecentFromBedCtx(ctx);
        }}
        onConfirmBron={confirmBronReserve}
        onUpdateBronDraftNote={updateBronDraftNote}
        onCancelExistingBron={cancelExistingBron}
      />

      <RecentGuests
        open={recentFromBedCtx !== null}
        onClose={() => setRecentFromBedCtx(null)}
        onSelect={(guest) => {
          const ctx = recentFromBedCtx;
          if (!ctx) return;
          setRecentFromBedCtx(null);
          navigate("/booking", {
            state: {
              mode: "create",
              hostel: activeHostel,
              roomOptions,
              stayDate: stayDateIso,
              roomId: ctx.roomId,
              roomName: ctx.roomName,
              bedId: ctx.bedId,
              fromRecentGuestList: true,
              ...recentGuestToBookingPrefillFields(guest),
            } satisfies BookingPrefillState,
          });
        }}
      />

      <BottomNav active={activeTab} onSelect={setActiveTab} />
    </div>
  );
};

export default RoomsPage;
