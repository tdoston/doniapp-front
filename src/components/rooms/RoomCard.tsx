import React, { useState, useRef, useCallback, useEffect } from "react";
import { BedDouble, Plus, ImageIcon, Sparkles } from "lucide-react";
import RoomPhotoGallery from "./RoomPhotoGallery";
import { formatCheckInDateTime } from "@/lib/dates";

export type BedStatus = "empty" | "booked" | "selected" | "processing";

export interface BedData {
  id: number;
  status: BedStatus;
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
  /** true: bo'sh karavotlarga yangi bron yo'q; band karavot tahrirlash mumkin */
  inactive?: boolean;
}

interface RoomCardProps {
  room: RoomData;
  onBedTap: (roomId: string, bedId: number) => void;
  onBedLongPress: (roomId: string, bedId: number) => void;
  onBookRoom: (roomId: string) => void;
}

const statusStyles: Record<BedStatus, string> = {
  empty: "bg-accent text-accent-foreground",
  booked: "bg-destructive/80 text-destructive-foreground",
  selected: "bg-accent ring-4 ring-warning text-accent-foreground",
  processing: "bg-primary/40 text-primary-foreground animate-pulse",
};

const RoomCard = ({ room, onBedTap, onBedLongPress, onBookRoom }: RoomCardProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressedBed, setPressedBed] = useState<number | null>(null);
  const [showGallery, setShowGallery] = useState(false);
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
    (bedId: number) => {
      const bed = room.beds.find((b) => b.id === bedId);
      if (room.inactive && bed?.status === "empty") return;
      setPressedBed(bedId);
      timerRef.current = setTimeout(() => {
        onBedLongPress(room.id, bedId);
        setPressedBed(null);
        timerRef.current = null;
      }, 800);
    },
    [room, onBedLongPress]
  );

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
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        onBedTap(room.id, bedId);
      }
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

  return (
    <>
      <div
        className={`mx-4 mb-4 rounded-2xl overflow-hidden bg-foreground/90 animate-fade-in ${inactive ? "opacity-[0.88]" : ""}`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-card truncate">{room.name}</h3>
            {inactive && (
              <p className="text-[10px] font-semibold text-orange-300 mt-0.5">Nofaol — yangi bron yo&apos;q</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
            const checkInWhen = formatCheckInDateTime(bed.checkedInAt);
            return (
            <button
              key={bed.id}
              type="button"
              disabled={inactive && bed.status === "empty"}
              onTouchStart={() => handleTouchStart(bed.id)}
              onTouchEnd={() => handleTouchEnd(bed.id)}
              onMouseDown={() => handleTouchStart(bed.id)}
              onMouseUp={() => handleTouchEnd(bed.id)}
              onMouseLeave={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setPressedBed(null);
              }}
              className={`flex flex-col items-center justify-center rounded-xl py-2.5 min-h-[84px] font-bold transition-all select-none ${
                statusStyles[bed.status]
              } ${pressedBed === bed.id ? "scale-95" : ""} ${
                inactive && bed.status === "empty" ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <BedDouble className="w-5 h-5 mb-0.5" />
              <span className="text-xs">{bed.id}</span>
              {bed.status === "booked" && bed.guestName && (
                <span className="text-[10px] mt-0.5 opacity-90 truncate max-w-full px-1 text-center leading-tight">
                  <span className="block truncate">{bed.guestName}</span>
                  {checkInWhen ? (
                    <span className="block truncate font-semibold opacity-95 mt-0.5">{checkInWhen}</span>
                  ) : null}
                </span>
              )}
            </button>
          );
          })}
        </div>

        <button
          type="button"
          disabled={inactive}
          onClick={() => onBookRoom(room.id)}
          className={`flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold transition-all ${
            inactive
              ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
              : "bg-primary/20 text-primary active:bg-primary/30"
          }`}
        >
          <Plus className="w-4 h-4" />
          To'liq xona bron qilish
        </button>
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
    </>
  );
};

export default RoomCard;
