import React, { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Upload, Share2, Image, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { usePhotoSourcePicker } from "@/hooks/usePhotoSourcePicker";

interface RoomPhotoGalleryProps {
  roomName: string;
  photos: string[];
  onUpload: (files: FileList) => void;
  onDelete?: (index: number) => void;
  onReplace?: (index: number, file: File) => void;
  onClose: () => void;
}

const RoomPhotoGallery = ({ roomName, photos, onUpload, onDelete, onReplace, onClose }: RoomPhotoGalleryProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);

  const { trigger: triggerUpload, sheet: uploadSheet } = usePhotoSourcePicker({
    onFiles: onUpload,
    multiple: true,
  });

  // Reset confirm when photo changes
  const handleSetActive = (idx: number) => {
    setConfirmDelete(false);
    setActiveIdx(idx);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${roomName} - Xona rasmlari`,
          text: `${roomName} xonasini ko'ring`,
          url: window.location.href,
        });
      } catch {
        void 0;
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIdx < photos.length - 1) handleSetActive(activeIdx + 1);
      if (diff < 0 && activeIdx > 0) handleSetActive(activeIdx - 1);
    }
  };

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && onReplace) {
      onReplace(activeIdx, e.target.files[0]);
    }
    e.target.value = "";
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(activeIdx);
    setConfirmDelete(false);
    if (activeIdx > 0) setActiveIdx(activeIdx - 1);
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
      >
        <div>
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider mb-0.5">
            Xona rasmlari
          </p>
          <h3 className="text-white font-bold text-sm leading-tight">{roomName}</h3>
        </div>
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <button
              onClick={handleShare}
              className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-white/10 text-white"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-full bg-white/20 text-white active:scale-[0.98]"
            aria-label="Yopish"
          >
            <X className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <Image className="w-10 h-10 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Hali rasm qo'shilmagan</p>
            <button
              onClick={triggerUpload}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              Rasm qo'shish
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm">
            <div
              className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/5"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={photos[activeIdx]}
                alt={`${roomName} - ${activeIdx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {activeIdx > 0 && (
              <button
                onClick={() => handleSetActive(activeIdx - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeIdx < photos.length - 1 && (
              <button
                onClick={() => handleSetActive(activeIdx + 1)}
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
                      i === activeIdx ? "bg-white scale-125" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div
        className="px-4 shrink-0 space-y-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
      >
        {/* Add — always prominent */}
        {photos.length < 3 && (
          <button
            onClick={triggerUpload}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/15 text-white text-sm font-bold active:scale-[0.98] transition-transform"
          >
            <Upload className="w-4 h-4" />
            Rasm qo'shish ({photos.length}/3)
          </button>
        )}

        {/* Delete confirm or button */}
        {photos.length > 0 && onDelete && (
          confirmDelete ? (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-destructive text-xs font-semibold flex-1">Rasmni o'chirasizmi?</span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold"
              >
                Yo'q
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-bold"
              >
                O'chirish
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {onReplace && (
                <button
                  onClick={() => replaceRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/8 border border-white/10 text-white/60 text-xs font-semibold active:scale-[0.98] transition-transform"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Almashtirish
                </button>
              )}
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/8 border border-white/10 text-white/60 text-xs font-semibold active:scale-[0.98] transition-transform"
              >
                <Trash2 className="w-3.5 h-3.5" />
                O'chirish
              </button>
            </div>
          )
        )}
      </div>

      {uploadSheet}
      <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceChange} />
    </div>
  );
};

export default RoomPhotoGallery;
