import React, { useState, useRef, useCallback } from "react";
import { BedDouble, Plus, ImageIcon, Sparkles } from "lucide-react";
import RoomPhotoGallery from "./RoomPhotoGallery";

export type BedStatus = "empty" | "booked" | "selected" | "processing";

export interface BedData {
  id: number;
  status: BedStatus;
  guestName?: string;
  guestPhone?: string;
  checkedInBy?: string;
}

export interface RoomData {
  id: string;
  name: string;
  totalBeds: number;
  beds: BedData[];
  photos?: string[];
  cleaningStatus?: "clean" | "dirty";
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
  const [photos, setPhotos] = useState<string[]>(room.photos || []);

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

  const cleaningStatus = room.cleaningStatus || "clean";

  return (
    <>
      <div className="mx-4 mb-4 rounded-2xl overflow-hidden bg-foreground/90 animate-fade-in">
        {/* Room Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-bold text-card">{room.name}</h3>
          <div className="flex items-center gap-2">
            {/* Cleaning status */}
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
            {/* Photo gallery button */}
            <button
              onClick={() => setShowGallery(true)}
              className="p-1.5 rounded-lg bg-white/10 text-card/70 hover:bg-white/20 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

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
            >
              <BedDouble className="w-5 h-5 mb-0.5" />
              <span className="text-xs">{bed.id}</span>
              {bed.status === "booked" && bed.guestName && (
                <span className="text-[10px] mt-0.5 opacity-90 truncate max-w-full px-1">{bed.guestName}</span>
              )}
              {bed.status === "booked" && bed.checkedInBy && (
                <span className="text-[8px] opacity-60 truncate max-w-full px-1">{bed.checkedInBy}</span>
              )}
            </button>
          ))}
        </div>

        {/* Full Room Booking Button */}
        <button
          onClick={() => onBookRoom(room.id)}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/20 text-primary text-sm font-bold transition-all active:bg-primary/30"
        >
          <Plus className="w-4 h-4" />
          To'liq xona bron qilish
        </button>
      </div>

      {/* Photo Gallery Modal */}
      {showGallery && (
        <RoomPhotoGallery
          roomName={room.name}
          photos={photos}
          onUpload={handleUploadPhotos}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
};

export default RoomCard;
