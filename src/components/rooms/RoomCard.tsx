import React, { useState, useRef, useCallback } from "react";
import { BedDouble } from "lucide-react";

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
}

const statusStyles: Record<BedStatus, string> = {
  empty: "bg-accent text-accent-foreground",
  booked: "bg-destructive/80 text-destructive-foreground",
  selected: "bg-accent ring-4 ring-warning text-accent-foreground",
  processing: "bg-primary/40 text-primary-foreground animate-pulse",
};

const RoomCard = ({ room, onBedTap, onBedLongPress }: RoomCardProps) => {
  const bookedCount = room.beds.filter((b) => b.status === "booked").length;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressedBed, setPressedBed] = useState<number | null>(null);

  const cols =
    room.beds.length <= 2 ? "grid-cols-2" : room.beds.length <= 4 ? "grid-cols-4" : "grid-cols-4";

  const handleTouchStart = useCallback(
    (bedId: number) => {
      setPressedBed(bedId);
      timerRef.current = setTimeout(() => {
        onBedLongPress(room.id, bedId);
        setPressedBed(null);
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
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-bold text-card">{room.name}</h3>
        <span className="text-xs font-semibold bg-card/20 text-card px-2 py-0.5 rounded-md">
          {bookedCount}/{room.totalBeds}
        </span>
      </div>
      <div className={`grid ${cols} gap-3 px-4 pb-4`}>
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
            <BedDouble className="w-6 h-6 mb-1" />
            <span className="text-sm">{bed.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomCard;
