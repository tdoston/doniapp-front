import React, { useState, useRef } from "react";
import { Camera, Check, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";
import { toast } from "sonner";

type CleaningStatus = "dirty" | "cleaned";

interface CleaningRoom {
  id: string;
  name: string;
  hostel: string;
  guestName: string;
  status: CleaningStatus;
  photoBefore: string | null;
  photoAfter: string | null;
}

const MOCK_CLEANING: CleaningRoom[] = [
  { id: "v1", name: "1-qavat Zal", hostel: "Vodnik", guestName: "Miroj", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "v2", name: "1-qavat Lux", hostel: "Vodnik", guestName: "Fatima", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "v4", name: "2-qavat Zal", hostel: "Vodnik", guestName: "Sherzod", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "v5", name: "2-qavat Dvuxspalniy", hostel: "Vodnik", guestName: "Alisher", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "v7", name: "2-qavat Koridor", hostel: "Vodnik", guestName: "Rustam", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "z1", name: "Xona 1", hostel: "Zargarlik", guestName: "Javohir", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "z3", name: "Xona 3", hostel: "Zargarlik", guestName: "Hamid", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "z4", name: "Xona 4", hostel: "Zargarlik", guestName: "Timur", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "t1", name: "Xona 1", hostel: "Tabarruk", guestName: "Aziz", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "t3", name: "Xona 3", hostel: "Tabarruk", guestName: "Bahor", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "t5", name: "Xona 5", hostel: "Tabarruk", guestName: "Daler", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "t7", name: "Xona 7", hostel: "Tabarruk", guestName: "Farkhod", status: "dirty", photoBefore: null, photoAfter: null },
  { id: "t8", name: "Xona 8", hostel: "Tabarruk", guestName: "Gulzira", status: "dirty", photoBefore: null, photoAfter: null },
];

const HOSTELS = ["Barchasi", "Vodnik", "Zargarlik", "Tabarruk"];

const CleaningPage = () => {
  const [rooms, setRooms] = useState<CleaningRoom[]>(MOCK_CLEANING);
  const [activeHostel, setActiveHostel] = useState("Barchasi");
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<{ roomId: string; type: "before" | "after" } | null>(null);

  const filtered = activeHostel === "Barchasi" ? rooms : rooms.filter((r) => r.hostel === activeHostel);
  const dirtyCount = filtered.filter((r) => r.status === "dirty").length;
  const cleanedCount = filtered.filter((r) => r.status === "cleaned").length;

  const handlePhotoUpload = (roomId: string, type: "before" | "after") => {
    setActiveUpload({ roomId, type });
    if (type === "before") {
      beforeRef.current?.click();
    } else {
      afterRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUpload) return;

    const url = URL.createObjectURL(file);
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeUpload.roomId
          ? { ...r, [activeUpload.type === "before" ? "photoBefore" : "photoAfter"]: url }
          : r
      )
    );
    toast.success(activeUpload.type === "before" ? "Oldingi rasm yuklandi" : "Keyingi rasm yuklandi");
    setActiveUpload(null);
    e.target.value = "";
  };

  const markCleaned = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: "cleaned" as CleaningStatus } : r))
    );
    toast.success("Xona tozalandi ✓");
  };

  return (
    <div className="pb-4">
      {/* Hostel filter */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        {HOSTELS.map((h) => (
          <button
            key={h}
            onClick={() => setActiveHostel(h)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeHostel === h
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-3">
        <div className="bg-destructive/10 rounded-xl p-3 text-center">
          <span className="text-2xl font-black text-destructive">{dirtyCount}</span>
          <p className="text-[10px] font-semibold text-destructive/70 mt-0.5">Tozalanmagan</p>
        </div>
        <div className="bg-green-500/10 rounded-xl p-3 text-center">
          <span className="text-2xl font-black text-green-600">{cleanedCount}</span>
          <p className="text-[10px] font-semibold text-green-600/70 mt-0.5">Tozalangan</p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={beforeRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={afterRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Room list */}
      <div className="space-y-2 px-4">
        {filtered.map((room) => {
          const isExpanded = expandedRoom === room.id;
          const isDirty = room.status === "dirty";

          return (
            <div
              key={room.id}
              className={`rounded-2xl overflow-hidden transition-all ${
                isDirty ? "bg-destructive/5 border border-destructive/20" : "bg-green-500/5 border border-green-500/20"
              }`}
            >
              <button
                onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                className="flex items-center justify-between w-full px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isDirty ? "bg-destructive animate-pulse" : "bg-green-500"
                    }`}
                  />
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{room.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {room.hostel} · {room.guestName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isDirty
                        ? "bg-destructive/20 text-destructive"
                        : "bg-green-500/20 text-green-600"
                    }`}
                  >
                    {isDirty ? "Toza emas" : "Tayyor ✓"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Photo upload section */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Before photo */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Oldin (Do)</p>
                      {room.photoBefore ? (
                        <img
                          src={room.photoBefore}
                          alt="Before"
                          className="w-full h-24 object-cover rounded-xl border border-border"
                        />
                      ) : (
                        <button
                          onClick={() => handlePhotoUpload(room.id, "before")}
                          className="w-full h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground active:bg-secondary/50"
                        >
                          <Camera className="w-6 h-6" />
                          <span className="text-[10px] font-semibold">Rasm olish</span>
                        </button>
                      )}
                    </div>

                    {/* After photo */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Keyin (Posle)</p>
                      {room.photoAfter ? (
                        <img
                          src={room.photoAfter}
                          alt="After"
                          className="w-full h-24 object-cover rounded-xl border border-border"
                        />
                      ) : (
                        <button
                          onClick={() => handlePhotoUpload(room.id, "after")}
                          className="w-full h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground active:bg-secondary/50"
                        >
                          <ImagePlus className="w-6 h-6" />
                          <span className="text-[10px] font-semibold">Rasm olish</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mark as cleaned */}
                  {isDirty && (
                    <button
                      onClick={() => markCleaned(room.id)}
                      className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold flex items-center justify-center gap-2 active:bg-green-600"
                    >
                      <Check className="w-4 h-4" />
                      Tozalandi
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Tozalanishi kerak xonalar yo'q
          </div>
        )}
      </div>
    </div>
  );
};

export default CleaningPage;
