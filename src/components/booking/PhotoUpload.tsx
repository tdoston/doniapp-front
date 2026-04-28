import { useRef, useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { usePhotoSourcePicker } from "@/hooks/usePhotoSourcePicker";

interface PhotoUploadProps {
  photos: string[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  onReplace?: (index: number, file: File) => void;
  /** Faqat surat qatori (tez check-in forma). */
  hideLabel?: boolean;
  /** `express` — katta yuklash zonasi. */
  variant?: "default" | "express";
  /** Faqat ko'rish (taxtadan qayta ochilganda). */
  readOnly?: boolean;
}

const PhotoUpload = ({ photos, onAdd, onRemove, onReplace, hideLabel, variant = "default", readOnly }: PhotoUploadProps) => {
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const touchStartX = useRef(0);

  const { trigger: triggerAdd, sheet: addSheet } = usePhotoSourcePicker({
    onFiles: onAdd,
    multiple: true,
  });

  const replaceRef = useRef<HTMLInputElement>(null);

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewIdx !== null && onReplace) {
      onReplace(viewIdx, file);
    }
    e.target.value = "";
  };

  const handleViewerDelete = () => {
    if (viewIdx === null || readOnly) return;
    onRemove(viewIdx);
    if (photos.length <= 1) {
      setViewIdx(null);
      return;
    }
    if (viewIdx >= photos.length - 1) {
      setViewIdx(Math.max(0, photos.length - 2));
    }
  };

  const express = variant === "express";

  return (
    <div className={express ? "space-y-3" : "space-y-2"}>
      {!hideLabel ? (
        <label className="text-sm font-medium text-muted-foreground">Hujjat rasmi (max 3 ta)</label>
      ) : null}
      <div className={`flex gap-3 ${express ? "items-stretch flex-wrap" : "items-stretch flex-wrap"}`}>
        {photos.map((src, i) => (
          <div
            key={i}
            className={
              express
                ? "relative w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-muted/40 ring-1 ring-black/[0.06]"
                : "relative w-20 h-20 rounded-xl overflow-hidden bg-muted/40 ring-1 ring-black/[0.06]"
            }
          >
            <button
              type="button"
              onClick={() => setViewIdx(i)}
              className="w-full h-full"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
            {!readOnly ? (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm active:scale-95"
                aria-label="Rasmni o'chirish"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        ))}
        {photos.length < 3 && !readOnly && (
          <button
            type="button"
            onClick={triggerAdd}
            className={
              express
                ? "min-h-[7.5rem] flex-1 min-w-[7rem] rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/10 to-accent/15 flex flex-col items-center justify-center gap-2 text-primary shadow-sm shadow-primary/15 hover:border-primary/45 hover:from-primary/20 hover:to-accent/20 active:scale-[0.99] transition-all"
                : "h-24 min-w-[8.5rem] flex-1 rounded-2xl border border-input bg-card flex flex-col items-center justify-center gap-1.5 text-foreground hover:border-primary/40 active:scale-[0.985] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            }
          >
            <Camera className={express ? "w-7 h-7 sm:w-8 sm:h-8 opacity-90" : "w-5 h-5 text-muted-foreground"} />
            <span className={express ? "text-[0.9375rem] sm:text-base font-bold leading-tight" : "text-xs font-extrabold tracking-tight"}>
              {express ? "Suratga olish" : "Hujjatlarni yuklash"}
            </span>
            {express ? (
              <span className="text-xs text-muted-foreground font-medium px-2 text-center leading-snug">
                3 tagacha
              </span>
            ) : (
              <span className="text-[11px] font-medium text-muted-foreground">PNG/JPG, 3 tagacha</span>
            )}
          </button>
        )}
      </div>

      {addSheet}

      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleReplace}
      />

      {/* Fullscreen viewer */}
      {viewIdx !== null && photos[viewIdx] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
          >
            <h3 className="text-white font-bold text-sm">Hujjat rasmi {viewIdx + 1}/{photos.length}</h3>
            <button
              onClick={() => { setViewIdx(null); }}
              className="inline-flex h-12 w-12 touch-manipulation items-center justify-center rounded-full bg-white/20 text-white active:scale-[0.98]"
              aria-label="Yopish"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center px-4"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = touchStartX.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && viewIdx < photos.length - 1) setViewIdx(viewIdx + 1);
                if (diff < 0 && viewIdx > 0) setViewIdx(viewIdx - 1);
              }
            }}
          >
            <div className="relative w-full max-w-sm">
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white/5">
                <img src={photos[viewIdx]} alt="" className="w-full h-full object-contain" />
              </div>

              {viewIdx > 0 && (
                <button
                  onClick={() => setViewIdx(viewIdx - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {viewIdx < photos.length - 1 && (
                <button
                  onClick={() => setViewIdx(viewIdx + 1)}
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
                        i === viewIdx ? "bg-white scale-125" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom actions */}
          <div
            className="px-4 pb-6 shrink-0 grid grid-cols-1 sm:flex sm:justify-center gap-2.5 sm:gap-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
          >
            {!readOnly && onReplace ? (
              <button
                onClick={() => replaceRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Almashtirish
              </button>
            ) : null}
            {!readOnly ? (
              <button
                onClick={handleViewerDelete}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/20 text-destructive text-sm font-semibold"
              >
                <X className="w-4 h-4" />
                O&apos;chirish
              </button>
            ) : null}
            {!readOnly && photos.length < 3 ? (
              <button
                onClick={triggerAdd}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white text-sm font-semibold"
              >
                <Camera className="w-4 h-4" />
                Qo&apos;shish ({photos.length}/3)
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
