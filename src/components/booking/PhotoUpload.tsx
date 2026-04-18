import { useRef, useState } from "react";
import { Camera, X, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface PhotoUploadProps {
  photos: string[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
  onReplace?: (index: number, file: File) => void;
}

const PhotoUpload = ({ photos, onAdd, onRemove, onReplace }: PhotoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const touchStartX = useRef(0);

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && viewIdx !== null && onReplace) {
      onReplace(viewIdx, file);
      setConfirmReplace(false);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        {photos.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => setViewIdx(i)}
              className="w-full h-full"
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-foreground/70 flex items-center justify-center"
            >
              <X className="w-3 h-3 text-card" />
            </button>
          </div>
        ))}
        {photos.length < 3 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px]">Yuklash</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) onAdd(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplace}
      />

      {/* Fullscreen viewer */}
      {viewIdx !== null && photos[viewIdx] && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <h3 className="text-white font-bold text-sm">Hujjat rasmi {viewIdx + 1}/{photos.length}</h3>
            <button onClick={() => { setViewIdx(null); setConfirmReplace(false); }} className="p-2 rounded-full bg-white/10 text-white">
              <X className="w-5 h-5" />
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
          <div className="px-4 pb-6 shrink-0">
            {!confirmReplace ? (
              <div className="flex justify-center gap-3">
                {onReplace && (
                  <button
                    onClick={() => setConfirmReplace(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Almashtirish
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-2xl p-4 mx-auto max-w-sm">
                <p className="text-sm font-semibold text-foreground mb-3 text-center">
                  Rasmni almashtirasizmi?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfirmReplace(false)}
                    className="h-10 rounded-xl font-bold text-sm bg-muted text-foreground border border-border active:scale-[0.98]"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={() => replaceRef.current?.click()}
                    className="h-10 rounded-xl font-bold text-sm bg-primary text-primary-foreground active:scale-[0.98]"
                  >
                    Yangi rasm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
