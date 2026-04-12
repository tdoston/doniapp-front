import React, { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Check, ChevronDown, ChevronUp, ImagePlus, DoorClosed, ShowerHead, BedDouble, Users, X, ChevronLeft, ChevronRight, Share2, Trash2, RefreshCw } from "lucide-react";
import { fetchCleaning, patchCleaning, type CleaningRoomDto } from "@/lib/api";
import { readFileAsDataUrl } from "@/lib/files";

type CleaningRoom = CleaningRoomDto;

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
  stayDateIso: string;
}

const CleaningPage = ({ activeHostel, stayDateIso }: CleaningPageProps) => {
  const queryClient = useQueryClient();
  const cleaningQueryKey = ["cleaning", activeHostel, stayDateIso] as const;

  const cleaningQuery = useQuery({
    queryKey: cleaningQueryKey,
    queryFn: () => fetchCleaning(activeHostel, stayDateIso),
  });

  const patchMut = useMutation({
    mutationFn: ({
      code,
      patch,
    }: {
      code: string;
      patch: { hostel: string; status?: "dirty" | "cleaned"; photosBefore?: string[]; photosAfter?: string[] };
    }) => patchCleaning(code, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cleaningQueryKey });
    },
  });

  const rooms = cleaningQuery.data?.rooms ?? [];

  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [activeUpload, setActiveUpload] = useState<{ roomId: string; type: "before" | "after" } | null>(null);
  const [gallery, setGallery] = useState<GalleryState | null>(null);
  const touchStartX = useRef(0);

  const filtered = rooms;
  const dirtyCount = filtered.filter((r) => r.status === "dirty").length;
  const cleanedCount = filtered.filter((r) => r.status === "cleaned").length;

  const getRoomSnapshot = (roomId: string) => rooms.find((r) => r.id === roomId);

  const handlePhotoUpload = (roomId: string, type: "before" | "after") => {
    setActiveUpload({ roomId, type });
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUpload) return;
    const room = getRoomSnapshot(activeUpload.roomId);
    if (!room) return;

    const maxPhotos = getMaxPhotos(room);
    const key = activeUpload.type === "before" ? "photosBefore" : "photosAfter";
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const next = [...room[key], dataUrl].slice(0, maxPhotos);
      patchMut.mutate({ code: room.id, patch: { hostel: activeHostel, [key]: next } });
    } catch {
      /* ignore */
    }
    setActiveUpload(null);
    e.target.value = "";
  };

  const markCleaned = (roomId: string) => {
    patchMut.mutate({ code: roomId, patch: { hostel: activeHostel, status: "cleaned" } });
  };

  const openGallery = (roomId: string, type: "before" | "after", title: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    // Build combined array: all before photos then all after photos
    const combined = [
      ...room.photosBefore.map(() => "before" as const),
      ...room.photosAfter.map(() => "after" as const),
    ];
    if (combined.length === 0) return;
    // Find starting index based on which section was tapped
    const startIdx = type === "before" ? 0 : room.photosBefore.length;
    const clampedIdx = Math.min(startIdx, combined.length - 1);
    setGallery({ roomId, type, title: room.name, activeIdx: clampedIdx });
  };

  const getGalleryPhotos = (): { url: string; label: string }[] => {
    if (!gallery) return [];
    const room = rooms.find(r => r.id === gallery.roomId);
    if (!room) return [];
    return [
      ...room.photosBefore.map(url => ({ url, label: "Oldin (Do)" })),
      ...room.photosAfter.map(url => ({ url, label: "Keyin (Posle)" })),
    ];
  };

  const getGalleryCurrentType = (): "before" | "after" => {
    if (!gallery) return "before";
    const room = rooms.find(r => r.id === gallery.roomId);
    if (!room) return "before";
    return gallery.activeIdx < room.photosBefore.length ? "before" : "after";
  };

  const getGalleryCurrentLocalIdx = (): number => {
    if (!gallery) return 0;
    const room = rooms.find(r => r.id === gallery.roomId);
    if (!room) return 0;
    return gallery.activeIdx < room.photosBefore.length
      ? gallery.activeIdx
      : gallery.activeIdx - room.photosBefore.length;
  };

  const handleGalleryDelete = () => {
    if (!gallery) return;
    const room = getRoomSnapshot(gallery.roomId);
    if (!room) return;
    const currentType = getGalleryCurrentType();
    const localIdx = getGalleryCurrentLocalIdx();
    const photosBefore =
      currentType === "before" ? room.photosBefore.filter((_, i) => i !== localIdx) : [...room.photosBefore];
    const photosAfter =
      currentType === "after" ? room.photosAfter.filter((_, i) => i !== localIdx) : [...room.photosAfter];
    const total = photosBefore.length + photosAfter.length;
    patchMut.mutate({ code: gallery.roomId, patch: { hostel: activeHostel, photosBefore, photosAfter } });
    if (total <= 0) {
      setGallery(null);
      return;
    }
    if (gallery.activeIdx >= total) {
      setGallery({ ...gallery, activeIdx: Math.max(0, total - 1) });
    }
  };

  const handleGalleryReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !gallery) return;
    const room = getRoomSnapshot(gallery.roomId);
    if (!room) return;
    const currentType = getGalleryCurrentType();
    const localIdx = getGalleryCurrentLocalIdx();
    const photosBefore = [...room.photosBefore];
    const photosAfter = [...room.photosAfter];
    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (currentType === "before") photosBefore[localIdx] = dataUrl;
      else photosAfter[localIdx] = dataUrl;
      patchMut.mutate({ code: gallery.roomId, patch: { hostel: activeHostel, photosBefore, photosAfter } });
    } catch {
      /* ignore */
    }
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
      } catch {
        void 0;
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="pb-4">
      {cleaningQuery.isLoading && (
        <p className="text-center text-sm text-muted-foreground py-4 px-4">Tozalash ro&apos;yxati yuklanmoqda…</p>
      )}
      {cleaningQuery.isError && (
        <p className="text-center text-sm text-destructive py-4 px-4">Ma&apos;lumot olinmadi. API va Postgresni tekshiring.</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <div className="bg-destructive/10 rounded-xl p-4 flex flex-col items-center justify-center min-h-[80px]">
          <span className="text-3xl font-extrabold text-destructive">{dirtyCount}</span>
          <span className="text-xs font-semibold text-destructive/70">Tozalanmagan</span>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 flex flex-col items-center justify-center min-h-[80px]">
          <span className="text-3xl font-extrabold text-green-600">{cleanedCount}</span>
          <span className="text-xs font-semibold text-green-600/70">Tozalangan</span>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {/* Room list */}
      <div className="space-y-2 px-4 pt-1">
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
                  {maxPhotos === 1 ? (
                    /* Side-by-side layout for single-photo rooms */
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Oldin</p>
                        {room.photosBefore.length > 0 ? (
                          <button
                            onClick={() => openGallery(room.id, "before", `${room.name} — Oldin`)}
                            className="w-full h-24 rounded-lg overflow-hidden border border-border"
                          >
                            <img src={room.photosBefore[0]} alt="Before" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePhotoUpload(room.id, "before")}
                            className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground active:bg-secondary/50"
                          >
                            <Camera className="w-5 h-5" />
                            <span className="text-[9px] font-semibold">Rasmga olish</span>
                          </button>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Keyin</p>
                        {room.photosAfter.length > 0 ? (
                          <button
                            onClick={() => openGallery(room.id, "after", `${room.name} — Keyin`)}
                            className="w-full h-24 rounded-lg overflow-hidden border border-border"
                          >
                            <img src={room.photosAfter[0]} alt="After" className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePhotoUpload(room.id, "after")}
                            className="w-full h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground active:bg-secondary/50"
                          >
                            <ImagePlus className="w-5 h-5" />
                            <span className="text-[9px] font-semibold">Rasmga olish</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Stacked layout for multi-photo rooms */
                    <>
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
                    </>
                  )}

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
        const currentPhoto = photos[gallery.activeIdx];
        return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <div>
              <h3 className="text-white font-bold text-sm">{gallery.title}</h3>
              {currentPhoto && (
                <span className={`text-[11px] font-semibold ${
                  getGalleryCurrentType() === "before" ? "text-orange-400" : "text-green-400"
                }`}>
                  {currentPhoto.label}
                </span>
              )}
            </div>
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
                {currentPhoto && (
                  <img
                    src={currentPhoto.url}
                    alt={`${gallery.title} ${currentPhoto.label}`}
                    className="w-full h-full object-cover"
                  />
                )}
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
                  {photos.map((p, i) => {
                    const room = rooms.find(r => r.id === gallery.roomId);
                    const beforeCount = room?.photosBefore.length || 0;
                    const isBefore = i < beforeCount;
                    return (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === gallery.activeIdx
                            ? (isBefore ? "bg-orange-400 scale-125" : "bg-green-400 scale-125")
                            : (isBefore ? "bg-orange-400/30" : "bg-green-400/30")
                        }`}
                      />
                    );
                  })}
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
