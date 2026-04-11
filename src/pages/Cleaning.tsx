import React, { useState, useRef } from "react";
import { Camera, Check, ChevronDown, ChevronUp, ImagePlus, DoorClosed, ShowerHead, BedDouble, Users, X, ChevronLeft, ChevronRight, Share2, Trash2, RefreshCw } from "lucide-react";

type CleaningStatus = "dirty" | "cleaned";
type RoomType = "room" | "bathroom";

interface CleaningRoom {
  id: string;
  name: string;
  hostel: string;
  guestName: string;
  status: CleaningStatus;
  type: RoomType;
  totalBeds: number;
  occupiedBeds: number;
  photosBefore: string[];
  photosAfter: string[];
}

const MOCK_CLEANING: CleaningRoom[] = [
  { id: "v1", name: "1-qavat Zal", hostel: "Vodnik", guestName: "Miroj", status: "dirty", type: "room", totalBeds: 4, occupiedBeds: 2, photosBefore: [], photosAfter: [] },
  { id: "v2", name: "1-qavat Lux", hostel: "Vodnik", guestName: "Fatima", status: "dirty", type: "room", totalBeds: 2, occupiedBeds: 1, photosBefore: [], photosAfter: [] },
  { id: "v4", name: "2-qavat Zal", hostel: "Vodnik", guestName: "Sherzod", status: "dirty", type: "room", totalBeds: 4, occupiedBeds: 2, photosBefore: [], photosAfter: [] },
  { id: "v5", name: "2-qavat Dvuxspalniy", hostel: "Vodnik", guestName: "Alisher", status: "dirty", type: "room", totalBeds: 2, occupiedBeds: 2, photosBefore: [], photosAfter: [] },
  { id: "v7", name: "2-qavat Koridor", hostel: "Vodnik", guestName: "Rustam", status: "dirty", type: "room", totalBeds: 1, occupiedBeds: 1, photosBefore: [], photosAfter: [] },
  { id: "v-bath", name: "Umumiy dush va hojatxona", hostel: "Vodnik", guestName: "", status: "dirty", type: "bathroom", totalBeds: 0, occupiedBeds: 0, photosBefore: [], photosAfter: [] },
  { id: "z1", name: "Xona 1", hostel: "Zargarlik", guestName: "Javohir", status: "dirty", type: "room", totalBeds: 3, occupiedBeds: 2, photosBefore: [], photosAfter: [] },
  { id: "z3", name: "Xona 3", hostel: "Zargarlik", guestName: "Hamid", status: "dirty", type: "room", totalBeds: 8, occupiedBeds: 4, photosBefore: [], photosAfter: [] },
  { id: "z4", name: "Xona 4", hostel: "Zargarlik", guestName: "Timur", status: "dirty", type: "room", totalBeds: 2, occupiedBeds: 1, photosBefore: [], photosAfter: [] },
  { id: "z-bath", name: "Umumiy dush va hojatxona", hostel: "Zargarlik", guestName: "", status: "dirty", type: "bathroom", totalBeds: 0, occupiedBeds: 0, photosBefore: [], photosAfter: [] },
  { id: "t1", name: "Xona 1", hostel: "Tabarruk", guestName: "Aziz", status: "dirty", type: "room", totalBeds: 1, occupiedBeds: 1, photosBefore: [], photosAfter: [] },
  { id: "t3", name: "Xona 3", hostel: "Tabarruk", guestName: "Bahor", status: "dirty", type: "room", totalBeds: 2, occupiedBeds: 1, photosBefore: [], photosAfter: [] },
  { id: "t5", name: "Xona 5", hostel: "Tabarruk", guestName: "Daler", status: "dirty", type: "room", totalBeds: 2, occupiedBeds: 2, photosBefore: [], photosAfter: [] },
  { id: "t7", name: "Xona 7", hostel: "Tabarruk", guestName: "Farkhod", status: "dirty", type: "room", totalBeds: 3, occupiedBeds: 1, photosBefore: [], photosAfter: [] },
  { id: "t8", name: "Xona 8", hostel: "Tabarruk", guestName: "Gulzira", status: "dirty", type: "room", totalBeds: 3, occupiedBeds: 1, photosBefore: [], photosAfter: [] },
  { id: "t-bath", name: "Umumiy dush va hojatxona", hostel: "Tabarruk", guestName: "", status: "dirty", type: "bathroom", totalBeds: 0, occupiedBeds: 0, photosBefore: [], photosAfter: [] },
];

const HOSTELS_LIST = ["Vodnik", "Zargarlik", "Tabarruk"];

// Returns max photos allowed for a room
const getMaxPhotos = (room: CleaningRoom): number => {
  if (room.type === "bathroom") return 4;
  if (room.name.toLowerCase().includes("lux")) return 4;
  if (room.hostel === "Tabarruk" && (room.name === "Xona 1" || room.name === "Xona 2")) return 4;
  return 1;
};

interface GalleryState {
  roomId: string;
  type: "before" | "after";
  title: string;
  activeIdx: number;
}

interface CleaningPageProps {
  activeHostel: string;
}

const CleaningPage = ({ activeHostel }: CleaningPageProps) => {
  const [rooms, setRooms] = useState<CleaningRoom[]>(MOCK_CLEANING);
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<{ roomId: string; type: "before" | "after" } | null>(null);
  const [gallery, setGallery] = useState<GalleryState | null>(null);
  const touchStartX = useRef(0);

  const filtered = rooms.filter((r) => r.hostel === activeHostel);
  const dirtyCount = filtered.filter((r) => r.status === "dirty").length;
  const cleanedCount = filtered.filter((r) => r.status === "cleaned").length;

  const handlePhotoUpload = (roomId: string, type: "before" | "after") => {
    setActiveUpload({ roomId, type });
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUpload) return;
    const room = rooms.find((r) => r.id === activeUpload.roomId);
    if (!room) return;

    const maxPhotos = getMaxPhotos(room);
    const url = URL.createObjectURL(file);
    const key = activeUpload.type === "before" ? "photosBefore" : "photosAfter";
    setRooms((prev) =>
      prev.map((r) =>
        r.id === activeUpload.roomId
          ? { ...r, [key]: [...r[key], url].slice(0, maxPhotos) }
          : r
      )
    );
    setActiveUpload(null);
    e.target.value = "";
  };

  const markCleaned = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: "cleaned" as CleaningStatus } : r))
    );
  };

  const openGallery = (roomId: string, type: "before" | "after", title: string) => {
    const room = rooms.find(r => r.id === roomId);
    const photos = type === "before" ? room?.photosBefore : room?.photosAfter;
    if (photos && photos.length > 0) {
      setGallery({ roomId, type, title, activeIdx: 0 });
    }
  };

  const getGalleryPhotos = (): string[] => {
    if (!gallery) return [];
    const room = rooms.find(r => r.id === gallery.roomId);
    return (gallery.type === "before" ? room?.photosBefore : room?.photosAfter) || [];
  };

  const handleGalleryDelete = () => {
    if (!gallery) return;
    const key = gallery.type === "before" ? "photosBefore" : "photosAfter";
    setRooms(prev => prev.map(r =>
      r.id === gallery.roomId ? { ...r, [key]: r[key].filter((_, i) => i !== gallery.activeIdx) } : r
    ));
    const photos = getGalleryPhotos();
    if (photos.length <= 1) {
      setGallery(null);
    } else if (gallery.activeIdx > 0) {
      setGallery({ ...gallery, activeIdx: gallery.activeIdx - 1 });
    }
  };

  const handleGalleryReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gallery) return;
    const url = URL.createObjectURL(file);
    const key = gallery.type === "before" ? "photosBefore" : "photosAfter";
    setRooms(prev => prev.map(r =>
      r.id === gallery.roomId ? { ...r, [key]: r[key].map((p, i) => i === gallery.activeIdx ? url : p) } : r
    ));
    e.target.value = "";
  };

  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleGalleryTouchEnd = (e: React.TouchEvent) => {
    if (!gallery) return;
    const photos = getGalleryPhotos();
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && gallery.activeIdx < photos.length - 1) {
        setGallery({ ...gallery, activeIdx: gallery.activeIdx + 1 });
      }
      if (diff < 0 && gallery.activeIdx > 0) {
        setGallery({ ...gallery, activeIdx: gallery.activeIdx - 1 });
      }
    }
  };

  const handleShareGallery = async () => {
    if (!gallery) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: gallery.title, url: window.location.href });
      } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="pb-4">

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

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Room list */}
      <div className="space-y-2 px-4">
        {filtered.map((room) => {
          const isExpanded = expandedRoom === room.id;
          const isDirty = room.status === "dirty";
          const isBathroom = room.type === "bathroom";
          const maxPhotos = getMaxPhotos(room);

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
                  {isBathroom ? (
                    <ShowerHead className={`w-5 h-5 ${isDirty ? "text-destructive" : "text-green-500"}`} />
                  ) : (
                    <DoorClosed className={`w-5 h-5 ${isDirty ? "text-destructive" : "text-green-500"}`} />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{room.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {!isBathroom && (
                        <>
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <BedDouble className="w-3 h-3" />
                            {room.totalBeds}
                          </span>
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {room.occupiedBeds}
                          </span>
                        </>
                      )}
                      {isBathroom && (
                        <span className="text-[10px] text-muted-foreground">{room.hostel}</span>
                      )}
                      {!isBathroom && room.guestName && (
                        <span className="text-[10px] text-muted-foreground">· {room.hostel}</span>
                      )}
                    </div>
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
                  {/* Before photos */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Oldin (Do)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {room.photosBefore.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => openGallery(room.id, "before", `${room.name} — Oldin`)}
                          className="w-full h-16 rounded-lg overflow-hidden border border-border"
                        >
                          <img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {room.photosBefore.length < maxPhotos && (
                        <button
                          onClick={() => handlePhotoUpload(room.id, "before")}
                          className="w-full h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-0.5 text-muted-foreground active:bg-secondary/50"
                        >
                          <Camera className="w-4 h-4" />
                          <span className="text-[8px] font-semibold">{room.photosBefore.length}/{maxPhotos}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* After photos */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Keyin (Posle)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {room.photosAfter.map((url, i) => (
                        <button
                          key={i}
                          onClick={() => openGallery(room.id, "after", `${room.name} — Keyin`)}
                          className="w-full h-16 rounded-lg overflow-hidden border border-border"
                        >
                          <img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      {room.photosAfter.length < maxPhotos && (
                        <button
                          onClick={() => handlePhotoUpload(room.id, "after")}
                          className="w-full h-16 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-0.5 text-muted-foreground active:bg-secondary/50"
                        >
                          <ImagePlus className="w-4 h-4" />
                          <span className="text-[8px] font-semibold">{room.photosAfter.length}/{maxPhotos}</span>
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

      {/* Photo Gallery Modal */}
      {gallery && (() => {
        const photos = getGalleryPhotos();
        return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <h3 className="text-white font-bold text-sm">{gallery.title}</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleShareGallery} className="p-2 rounded-full bg-white/10 text-white">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => setGallery(null)} className="p-2 rounded-full bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center px-4"
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >
            <div className="relative w-full max-w-sm">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/5">
                <img
                  src={photos[gallery.activeIdx]}
                  alt={`${gallery.title} ${gallery.activeIdx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {gallery.activeIdx > 0 && (
                <button
                  onClick={() => setGallery({ ...gallery, activeIdx: gallery.activeIdx - 1 })}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {gallery.activeIdx < photos.length - 1 && (
                <button
                  onClick={() => setGallery({ ...gallery, activeIdx: gallery.activeIdx + 1 })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {photos.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {photos.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === gallery.activeIdx ? "bg-white scale-125" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom edit actions */}
          <div className="px-4 pb-6 shrink-0 flex justify-center gap-3">
            <button
              onClick={() => replaceRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Almashtirish
            </button>
            <button
              onClick={handleGalleryDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/20 text-destructive text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              O'chirish
            </button>
          </div>

          <input ref={replaceRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleGalleryReplace} />
        </div>
        );
      })()}
    </div>
  );
};

export default CleaningPage;
