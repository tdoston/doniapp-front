import React, { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Upload, Share2, Image, Trash2, RefreshCw } from "lucide-react";

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
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);

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
      if (diff > 0 && activeIdx < photos.length - 1) setActiveIdx((p) => p + 1);
      if (diff < 0 && activeIdx > 0) setActiveIdx((p) => p - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    e.target.value = "";
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
        <h3 className="text-white font-bold text-sm">{roomName}</h3>
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <button onClick={handleShare} className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-full bg-white/10 text-white">
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
      <div className="flex-1 flex items-center justify-center px-4">
        {photos.length === 0 ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
              <Image className="w-10 h-10 text-white/40" />
            </div>
            <p className="text-white/60 text-sm">Rasm yo'q</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              <Upload className="w-4 h-4" />
              Rasm yuklash
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
                onClick={() => setActiveIdx((p) => p - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeIdx < photos.length - 1 && (
              <button
                onClick={() => setActiveIdx((p) => p + 1)}
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
        className="px-4 pb-6 shrink-0 grid grid-cols-1 sm:flex sm:justify-center gap-2.5 sm:gap-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        {photos.length > 0 && onReplace && (
          <button
            onClick={() => replaceRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Almashtirish
          </button>
        )}
        {photos.length > 0 && onDelete && (
          <button
            onClick={handleDelete}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/20 text-destructive text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            O'chirish
          </button>
        )}
        {photos.length < 3 && (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold"
          >
            <Upload className="w-4 h-4" />
            Qo'shish ({photos.length}/3)
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      <input ref={replaceRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceChange} />
    </div>
  );
};

export default RoomPhotoGallery;
