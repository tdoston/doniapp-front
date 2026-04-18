import { Sparkles, Check } from "lucide-react";

interface RepeatGuest {
  name: string;
  lastVisit: string;
  price: number;
  notes: string;
}

interface RepeatGuestBannerProps {
  guest: RepeatGuest | null;
  onApply: (guest: RepeatGuest) => void;
  applied?: boolean;
}

/**
 * Avval kelgan mehmon aniqlanganda chiqadigan banner.
 * Pasport seriyasi yoki telefon kiritilganda (yoki OCR orqali) aniqlanadi.
 * 1 ta tap orqali oxirgi check-in ma'lumotlari to'ldiriladi.
 */
const RepeatGuestBanner = ({ guest, onApply, applied }: RepeatGuestBannerProps) => {
  if (!guest) return null;

  if (applied) {
    return (
      <div className="rounded-xl bg-accent/10 border border-accent/40 px-3 py-2.5 flex items-center gap-2 animate-fade-in">
        <Check className="h-4 w-4 text-accent shrink-0" />
        <span className="text-sm font-semibold text-foreground truncate">
          {guest.name} ma'lumotlari to'ldirildi
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onApply(guest)}
      className="w-full rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border-2 border-primary/40 px-3 py-3 text-left animate-fade-in transition-all active:scale-[0.99] hover:from-primary/20 hover:to-accent/20"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-0.5">
            Avval kelgan mehmon
          </p>
          <p className="text-sm font-bold text-foreground truncate">{guest.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {guest.lastVisit} · {guest.price.toLocaleString()} so'm
          </p>
        </div>
        <div className="shrink-0 h-9 px-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center">
          Tanlash
        </div>
      </div>
    </button>
  );
};

export default RepeatGuestBanner;
