import { useRef, useState } from "react";
import { Camera, Images, X } from "lucide-react";

interface UsePhotoSourcePickerOptions {
  onFiles: (files: FileList) => void;
  multiple?: boolean;
}

export function usePhotoSourcePicker({ onFiles, multiple = false }: UsePhotoSourcePickerOptions) {
  const [open, setOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const trigger = () => setOpen(true);
  const close = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(e.target.files);
    }
    e.target.value = "";
    close();
  };

  const sheet = (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />

      {open && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          onClick={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Sheet */}
          <div
            className="relative bg-card rounded-t-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/25" />

            <p className="text-sm font-semibold text-muted-foreground text-center mb-4">
              Rasm manbasini tanlang
            </p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-primary/10 border border-primary/20 text-primary active:scale-[0.97] transition-transform"
              >
                <Camera className="w-7 h-7" />
                <span className="text-sm font-bold">Kamera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 h-24 rounded-2xl bg-muted/60 border border-border text-foreground active:scale-[0.97] transition-transform"
              >
                <Images className="w-7 h-7" />
                <span className="text-sm font-bold">Galereya</span>
              </button>
            </div>

            <button
              type="button"
              onClick={close}
              className="w-full h-12 rounded-2xl border border-border bg-background text-sm font-bold text-muted-foreground active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Bekor qilish
            </button>
          </div>
        </div>
      )}
    </>
  );

  return { trigger, sheet };
}
