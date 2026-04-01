import { useRef } from "react";
import { Camera, X } from "lucide-react";

interface PhotoUploadProps {
  photos: string[];
  onAdd: (files: FileList) => void;
  onRemove: (index: number) => void;
}

const PhotoUpload = ({ photos, onAdd, onRemove }: PhotoUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        Hujjat rasmi (max 3 ta)
      </label>
      <div className="flex gap-3">
        {photos.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
            <img src={src} alt="" className="w-full h-full object-cover" />
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
        onChange={(e) => e.target.files && onAdd(e.target.files)}
      />
    </div>
  );
};

export default PhotoUpload;
