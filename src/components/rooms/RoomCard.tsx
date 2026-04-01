import React, { useState, useRef, useCallback } from "react";
import { BedDouble, Plus, User, Phone } from "lucide-react";

export type BedStatus = "empty" | "booked" | "selected" | "processing";

export interface BedData {
  id: number;
  status: BedStatus;
  guestName?: string;
  guestPhone?: string;
}

export interface RoomData {
  id: string;
  name: string;
  totalBeds: number;
  beds: BedData[];
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
  const bookedCount = room.beds.filter((b) => b.status === "booked").length;
  const emptyCount = room.beds.filter((b) => b.status === "empty" || b.status === "selected").length;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressedBed, setPressedBed] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleTouchStart = useCallback(
    (bedId: number) => {
      setPressedBed(bedId);
      timerRef.current = setTimeout(() => {
        onBedLongPress(room.id, bedId);
        setPressedBed(null);
        timerRef.current = null;
      }, 800);
    },
    [room.id, onBedLongPress]
  );

  const handleTouchEnd = useCallback(
    (bedId: number) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        onBedTap(room.id, bedId);
      }
      setPressedBed(null);
    },
    [room.id, onBedTap]
  );

  return (
    <div className="mx-4 mb-4 rounded-2xl overflow-hidden bg-foreground/90 animate-fade-in">
      {/* Room Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 w-full text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-card">{room.name}</h3>
          <span className="text-xs text-card/60">({room.totalBeds} ta)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-destructive/30 text-destructive-foreground px-2 py-0.5 rounded-md">
            {bookedCount}
          </span>
          <span className="text-xs font-semibold bg-accent/30 text-accent-foreground px-2 py-0.5 rounded-md">
            {emptyCount}
          </span>
        </div>
      </button>

      {/* Beds Grid */}
      <div className="grid grid-cols-4 gap-3 px-4 pb-3">
        {room.beds.map((bed) => (
          <button
            key={bed.id}
            onTouchStart={() => handleTouchStart(bed.id)}
            onTouchEnd={() => handleTouchEnd(bed.id)}
            onMouseDown={() => handleTouchStart(bed.id)}
            onMouseUp={() => handleTouchEnd(bed.id)}
            onMouseLeave={() => {
              if (timerRef.current) clearTimeout(timerRef.current);
              setPressedBed(null);
            }}
            className={`flex flex-col items-center justify-center rounded-xl py-3 min-h-[72px] font-bold transition-all select-none ${
              statusStyles[bed.status]
            } ${pressedBed === bed.id ? "scale-95" : ""}`}
            aria-label={`Karavot ${bed.id} - ${bed.status}`}
          >
            <BedDouble className="w-5 h-5 mb-0.5" />
            <span className="text-xs">{bed.id}</span>
            {bed.status === "booked" && bed.guestName && (
              <span className="text-[10px] mt-0.5 opacity-90 truncate max-w-full px-1">{bed.guestName}</span>
            )}
          </button>
        ))}
      </div>

      {/* Expanded guest details */}
      {expanded && bookedCount > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {room.beds
            .filter((b) => b.status === "booked" && b.guestName)
            .map((bed) => (
              <div key={bed.id} className="flex items-center gap-2 bg-card/10 rounded-lg px-3 py-2">
                <User className="w-3.5 h-3.5 text-card/70" />
                <span className="text-xs text-card font-medium flex-1">{bed.guestName}</span>
                {bed.guestPhone && (
                  <a href={`tel:${bed.guestPhone}`} className="flex items-center gap-1 text-info text-xs">
                    <Phone className="w-3 h-3" />
                    {bed.guestPhone}
                  </a>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Full Room Booking Button */}
      <button
        onClick={() => onBookRoom(room.id)}
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/20 text-primary text-sm font-bold transition-all active:bg-primary/30"
      >
        <Plus className="w-4 h-4" />
        To'liq xona bron qilish
      </button>
    </div>
  );
};

export default RoomCard;
