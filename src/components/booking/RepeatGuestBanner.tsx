import { Sparkles, Check, ChevronRight } from "lucide-react";

/** CRM (`/guests/recent`) dan kelgan takroriy mehmon snapshot */
export interface RepeatGuest {
  name: string;
  lastVisit: string;
  price: number;
  paid: number;
  /** Oxirgi yozuvdagi kechalar — takroriy check-in / qarz ko‘rinishi uchun */
  nights?: number;
  notes: string;
  phone: string;
  passportSeries: string;
  hostel?: string;
  room?: string;
  /** Oxirgi check-in suratlari (max 3) */
  photos?: string[];
}

interface RepeatGuestBannerProps {
  guest: RepeatGuest | null;
  onApply: (guest: RepeatGuest) => void;
  applied?: boolean;
}

/**
 * Avval kelgan mehmon aniqlanganda chiqadigan banner.
 * Pasport seriyasi yoki telefon kiritilganda aniqlanadi.
 * Bir marta bosish — telefon, hujjat, narx, suratlar (bo‘lsa) to‘ldiriladi.
 */
const RepeatGuestBanner = ({ guest, onApply, applied }: RepeatGuestBannerProps) => {
  if (!guest) return null;

  if (applied) {
    return (
      <div
        className="rounded-xl border border-emerald-600/30 bg-emerald-500/[0.08] px-3 py-2.5 flex gap-2.5 animate-fade-in dark:border-emerald-500/35 dark:bg-emerald-950/40"
        role="status"
        aria-live="polite"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/15 dark:bg-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-800 dark:text-emerald-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Avval kelgan mehmon tanlandi</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">{guest.name}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onApply(guest)}
      aria-label={`Avval ro'yxatdan olingan mehmon: ${guest.name}. Bosib, tanlash va to'ldirishni bajaring.`}
      className="w-full rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 border-2 border-primary/40 px-3 py-3 text-left animate-fade-in transition-all active:scale-[0.99] hover:from-primary/20 hover:to-accent/20"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs font-bold text-primary">Avval ro&apos;yxatdan olingan mehmon</p>
          <p className="mt-1 text-[0.9375rem] font-bold text-foreground sm:text-sm truncate">{guest.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {guest.lastVisit} · {guest.price.toLocaleString()} so'm
          </p>
          <p className="mt-2 text-[0.6875rem] font-semibold leading-snug text-muted-foreground">Tanlash va to&apos;ldirish</p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      </div>
    </button>
  );
};

export default RepeatGuestBanner;
