import React, { useState, useRef, useCallback, useEffect } from "react";
import { BedDouble, ImageIcon, Sparkles, Lock } from "lucide-react";
import { digitsFromSoumInput } from "@/lib/moneyInput";
import RoomPhotoGallery from "./RoomPhotoGallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type BedStatus = "empty" | "booked" | "selected" | "processing";

export interface BedData {
  id: number;
  status: BedStatus;
  /** `bron` — band; `check_in` — mehmon (band) */
  bookingKind?: "bron" | "check_in";
  /** Bron: taxminiy kelish vaqti */
  expectedArrival?: string;
  guestName?: string;
  guestPhone?: string;
  checkedInBy?: string;
  bookingId?: string;
  price?: string;
  paid?: string;
  notes?: string;
  nights?: number;
  checkInDate?: string;
  /** Bron qayd etilgan vaqt (server `created_at`) */
  checkedInAt?: string;
  photos?: string[];
}

export interface RoomData {
  id: string;
  name: string;
  totalBeds: number;
  beds: BedData[];
  photos?: string[];
  cleaningStatus?: "clean" | "dirty";
  /** true: xonani to'liq olish (bo'sh karavotlarga boshqa mehmon qo'yilmaydi) */
  fullTaken?: boolean;
  fullTakenMode?: "" | "check_in" | "bron";
  /** true: bo'sh karavotlarga yangi bron yo'q; band karavot tahrirlash mumkin */
  inactive?: boolean;
}

interface RoomCardProps {
  room: RoomData;
  onBedTap: (roomId: string, bedId: number) => void;
  onBedLongPress: (roomId: string, bedId: number) => void;
  onFullRoomBron?: (roomId: string) => void;
  onToggleFullTaken?: (roomId: string, next: boolean, mode: "" | "check_in" | "bron") => void;
  onCancelFullRoomBron?: (roomId: string) => Promise<boolean>;
}

/** Faqat check-in: jami narx > 0 va to‘langanidan kam bo‘lsa — taxtada qarz belgisi. */
function checkInHasDebt(bed: BedData): boolean {
  if (bed.status !== "booked" || bed.bookingKind !== "check_in") return false;
  const price = Number(digitsFromSoumInput(bed.price ?? "")) || 0;
  const paid = Number(digitsFromSoumInput(bed.paid ?? "")) || 0;
  const nights = bed.nights ?? 1;
  const total = price * nights;
  if (total <= 0) return false;
  return paid < total;
}

function bedSurfaceClass(bed: BedData): string {
  if (bed.status === "empty") return "bg-emerald-600 text-white";
  if (bed.status === "booked") {
    if (bed.bookingKind === "bron") return "bg-amber-400 text-amber-950";
    return "bg-red-600 text-white";
  }
  const fallback: Record<Exclude<BedStatus, "empty" | "booked">, string> = {
    selected: "bg-accent ring-2 ring-amber-400 text-accent-foreground",
    processing: "bg-primary/40 text-primary-foreground animate-pulse",
  };
  return fallback[bed.status];
}

const RoomCard = ({
  room,
  onBedTap,
  onBedLongPress,
  onFullRoomBron,
  onToggleFullTaken,
  onCancelFullRoomBron,
}: RoomCardProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMovedRef = useRef(false);
  const [pressedBed, setPressedBed] = useState<number | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showRoomActions, setShowRoomActions] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmCancelBron, setConfirmCancelBron] = useState(false);
  const [cancellingBron, setCancellingBron] = useState(false);
  /** Faqat UI: xona suratlari taxtadan keladi (GET /board). */
  const [photos, setPhotos] = useState<string[]>(room.photos || []);

  const serverPhotosKey = JSON.stringify(room.photos ?? []);
  useEffect(() => {
    try {
      const parsed = JSON.parse(serverPhotosKey) as unknown;
      setPhotos(Array.isArray(parsed) ? [...parsed] : []);
    } catch {
      setPhotos([]);
    }
  }, [room.id, serverPhotosKey]);

  const handleTouchStart = useCallback(
    (bedId: number, e?: React.TouchEvent<HTMLButtonElement>) => {
      const bed = room.beds.find((b) => b.id === bedId);
      if (room.inactive && bed?.status === "empty") return;
      if (e?.touches?.[0]) {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        touchMovedRef.current = false;
      } else {
        touchStartRef.current = null;
        touchMovedRef.current = false;
      }
      setPressedBed(bedId);
      if (room.fullTaken && bed?.status === "empty") return;
      timerRef.current = setTimeout(() => {
        onBedLongPress(room.id, bedId);
        setPressedBed(null);
        timerRef.current = null;
      }, 800);
    },
    [room, onBedLongPress]
  );

  const handleTouchMove = useCallback(() => {
    if (!touchStartRef.current) return;
    // Scroll paytida accidental tap/long-press bo'lmasin.
    touchMovedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressedBed(null);
  }, []);

  const handleTouchEnd = useCallback(
    (bedId: number) => {
      const bed = room.beds.find((b) => b.id === bedId);
      if (room.inactive && bed?.status === "empty") {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setPressedBed(null);
        return;
      }
      if (room.fullTaken && bed?.status === "empty") {
        if (!touchMovedRef.current) {
          setConfirmRelease(false);
          setConfirmCancelBron(false);
          setShowRoomActions(true);
        }
        touchStartRef.current = null;
        touchMovedRef.current = false;
        setPressedBed(null);
        return;
      }
      if (timerRef.current && !touchMovedRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        onBedTap(room.id, bedId);
      }
      touchStartRef.current = null;
      touchMovedRef.current = false;
      setPressedBed(null);
    },
    [room, onBedTap]
  );

  const handleUploadPhotos = (files: FileList) => {
    const remaining = 3 - photos.length;
    Array.from(files)
      .slice(0, remaining)
      .forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos((prev) => [...prev, e.target?.result as string].slice(0, 3));
        };
        reader.readAsDataURL(file);
      });
  };

  const handleDeletePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReplacePhoto = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos((prev) => prev.map((p, i) => (i === index ? (e.target?.result as string) : p)));
    };
    reader.readAsDataURL(file);
  };

  const cleaningStatus = room.cleaningStatus || "clean";
  const inactive = Boolean(room.inactive);
  const fullTaken = Boolean(room.fullTaken);
  const fullTakenMode = room.fullTakenMode || "";
  const allBedsEmpty = room.beds.length > 0 && room.beds.every((b) => b.status === "empty");
  const bookedCount = room.beds.filter((b) => b.status === "booked").length;
  const checkInCount = room.beds.filter((b) => b.status === "booked" && b.bookingKind === "check_in").length;
  const bronCount = room.beds.filter((b) => b.status === "booked" && b.bookingKind === "bron").length;
  const canOpenRoomActions = !inactive;
  const canFullCheckIn = !fullTaken && checkInCount > 0 && checkInCount < room.totalBeds;
  const canFullBron = !fullTaken && allBedsEmpty;

  const isBronFull = !inactive && fullTaken && fullTakenMode === "bron";
  const isCheckInFull = !inactive && fullTaken && fullTakenMode !== "bron";

  return (
    <>
      <div
        className={`mx-4 mb-4 rounded-2xl overflow-hidden bg-foreground/90 animate-fade-in ${inactive ? "opacity-[0.88]" : ""} ${
          isBronFull ? "ring-2 ring-amber-400/70" : isCheckInFull ? "ring-2 ring-red-500/70" : ""
        }`}
      >
        {/* Status stripe */}
        {(isBronFull || isCheckInFull) && (
          <div className={`h-1.5 w-full ${isBronFull ? "bg-amber-400" : "bg-red-600"}`} />
        )}

        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => {
                if (!canOpenRoomActions) return;
                setConfirmRelease(false);
                setConfirmCancelBron(false);
                setShowRoomActions(true);
              }}
              className="text-left text-sm font-bold text-card truncate underline-offset-2 hover:underline"
            >
              {room.name}
            </button>
            {inactive && (
              <p className="text-[10px] font-semibold text-orange-300 mt-0.5">Nofaol</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(isBronFull || isCheckInFull) && (
              <button
                type="button"
                onClick={() => {
                  setConfirmRelease(false);
                  setConfirmCancelBron(false);
                  setShowRoomActions(true);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide active:scale-95 transition-transform ${
                  isBronFull ? "bg-amber-400 text-amber-950" : "bg-red-600 text-white"
                }`}
              >
                <Lock className="w-3 h-3" />
                {isBronFull ? "Bron" : "Band"}
              </button>
            )}
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                cleaningStatus === "clean"
                  ? "bg-accent/20 text-accent-foreground"
                  : "bg-orange-500/20 text-orange-300"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              {cleaningStatus === "clean" ? "Toza" : "Toza emas"}
            </div>
            <button
              type="button"
              onClick={() => setShowGallery(true)}
              className="p-1.5 rounded-lg bg-white/10 text-card/70 hover:bg-white/20 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 px-4 pb-3">
          {room.beds.map((bed) => {
            const debt = checkInHasDebt(bed);
            return (
            <button
              key={bed.id}
              type="button"
              disabled={inactive && bed.status === "empty"}
              title={debt ? "Qarz bor" : undefined}
              onTouchStart={(e) => handleTouchStart(bed.id, e)}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd(bed.id)}
              onTouchCancel={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                touchStartRef.current = null;
                touchMovedRef.current = false;
                setPressedBed(null);
              }}
              onMouseDown={() => handleTouchStart(bed.id)}
              onMouseUp={() => handleTouchEnd(bed.id)}
              onMouseLeave={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                touchStartRef.current = null;
                touchMovedRef.current = false;
                setPressedBed(null);
              }}
              className={`relative flex flex-col items-center justify-center rounded-xl py-2.5 min-h-[56px] font-bold transition-all select-none ${bedSurfaceClass(
                bed
              )} ${pressedBed === bed.id ? "scale-95" : ""} ${
                (inactive || fullTaken) && bed.status === "empty" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {debt && (
                <span
                  className="absolute top-1 right-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-amber-300 px-0.5 text-[9px] font-black leading-none text-amber-950 shadow-sm ring-1 ring-white/70"
                  aria-hidden
                >
                  !
                </span>
              )}
              <BedDouble className="w-5 h-5 mb-0.5" />
              <span className="text-xs">{bed.id}</span>
            </button>
            );
          })}
        </div>
      </div>

      {showGallery && (
        <RoomPhotoGallery
          roomName={room.name}
          photos={photos}
          onUpload={handleUploadPhotos}
          onDelete={handleDeletePhoto}
          onReplace={handleReplacePhoto}
          onClose={() => setShowGallery(false)}
        />
      )}
      <Dialog
        open={showRoomActions && canOpenRoomActions}
        onOpenChange={(v) => {
          setShowRoomActions(v);
          if (!v) {
            setConfirmRelease(false);
            setConfirmCancelBron(false);
          }
        }}
      >
        <DialogContent className="max-w-[min(100vw-1rem,24rem)] rounded-3xl border-border/80 bg-card p-0 overflow-hidden shadow-2xl">
          <div className="p-5 sm:p-6">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-base font-extrabold">{room.name}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Xonani to&apos;liq bron yoki band qilish:{" "}
                {isBronFull ? (
                  <span className="font-semibold text-amber-700 dark:text-amber-300">To&apos;liq bron</span>
                ) : isCheckInFull ? (
                  <span className="font-semibold text-red-600 dark:text-red-400">To&apos;liq band</span>
                ) : (
                  <span className="font-semibold">Tanlang</span>
                )}
              </p>
            </DialogHeader>

            {!fullTaken && !confirmCancelBron && !confirmRelease ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!onToggleFullTaken || !canFullCheckIn}
                  onClick={() => {
                    onToggleFullTaken?.(room.id, true, "check_in");
                    setShowRoomActions(false);
                  }}
                  className="h-11 rounded-xl border border-red-500/40 bg-red-600/90 text-sm font-bold text-white disabled:opacity-40"
                >
                  To&apos;liq band
                </button>
                <button
                  type="button"
                  disabled={!onFullRoomBron || !onToggleFullTaken || !canFullBron}
                  onClick={() => {
                    onFullRoomBron?.(room.id);
                    setShowRoomActions(false);
                  }}
                  className="h-11 rounded-xl border border-amber-400/50 bg-amber-400 text-sm font-bold text-amber-950 disabled:opacity-40"
                >
                  To&apos;liq bron
                </button>
              </div>
            ) : null}

            {isBronFull && onCancelFullRoomBron ? (
              <>
                {!confirmCancelBron ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancelBron(true)}
                    className="mt-3 h-11 w-full rounded-xl border border-amber-500/50 bg-amber-500/15 text-sm font-bold text-amber-800 dark:text-amber-200"
                  >
                    To&apos;liq bronni bekor qilish
                  </button>
                ) : (
                  <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mb-2">
                      Tasdiqlaysizmi? Xonadagi barcha bron yozuvlari bekor qilinadi.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmCancelBron(false)}
                        className="h-10 rounded-xl border border-border bg-background text-sm font-bold text-foreground"
                      >
                        Yo&apos;q
                      </button>
                      <button
                        type="button"
                        disabled={cancellingBron}
                        onClick={async () => {
                          if (!onCancelFullRoomBron) return;
                          setCancellingBron(true);
                          const ok = await onCancelFullRoomBron(room.id);
                          setCancellingBron(false);
                          if (!ok) return;
                          setConfirmCancelBron(false);
                          setShowRoomActions(false);
                        }}
                        className="h-10 rounded-xl bg-amber-500 text-sm font-bold text-amber-950 disabled:opacity-50"
                      >
                        {cancellingBron ? "Bekor qilinmoqda…" : "Ha, bekor qilish"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}

            {isCheckInFull ? (
              <>
                {!confirmRelease ? (
                  <button
                    type="button"
                    onClick={() => setConfirmRelease(true)}
                    className="mt-3 h-11 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/90 text-sm font-bold text-white"
                  >
                    To&apos;liq bandni bekor qilish
                  </button>
                ) : (
                  <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
                    <p className="text-xs font-semibold text-destructive mb-2">
                      Tasdiqlaysizmi? Xona yana bo&apos;sh joylash uchun ochiladi.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmRelease(false)}
                        className="h-10 rounded-xl border border-border bg-background text-sm font-bold text-foreground"
                      >
                        Yo&apos;q
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onToggleFullTaken?.(room.id, false, "");
                          setConfirmRelease(false);
                          setShowRoomActions(false);
                        }}
                        className="h-10 rounded-xl bg-destructive text-sm font-bold text-destructive-foreground"
                      >
                        Ha, o&apos;chirish
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RoomCard;
