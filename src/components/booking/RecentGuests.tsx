import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, isToday, isYesterday, parseISO } from "date-fns";
import { Users, Clock, Search, ChevronLeft } from "lucide-react";
import { fetchRecentGuests, recentGuestsQueryKey } from "@/lib/api";
import { checkInLabel } from "@/lib/dates";

export interface RecentGuest {
  lookupKey?: string;
  name: string;
  phone: string;
  passportSeries?: string;
  lastVisit: string;
  price: number;
  paid?: number;
  nights?: number;
  notes?: string;
  hostel?: string;
  room?: string;
  photos?: string[];
}

interface RecentGuestsProps {
  open: boolean;
  onClose: () => void;
  onSelect: (guest: RecentGuest) => void;
}

const filters = ["Hammasi", "Bugun", "Kecha", "2-3 kun"];

const RecentGuests = ({ open, onClose, onSelect }: RecentGuestsProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Hammasi");

  const limit = 120;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: recentGuestsQueryKey(limit),
    queryFn: () => fetchRecentGuests(limit),
    enabled: open,
    staleTime: 30_000,
  });

  type GuestRow = RecentGuest & { checkInIso: string };

  const guests: GuestRow[] = useMemo(() => {
    return (data?.guests ?? []).map((g) => ({
      ...g,
      checkInIso: g.lastVisit,
      lastVisit: checkInLabel(g.lastVisit),
    }));
  }, [data]);

  const filtered = guests.filter((g) => {
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search) ||
      (g.passportSeries || "").toLowerCase().includes(search.toLowerCase());

    if (filter === "Hammasi") return matchesSearch;

    try {
      const d = parseISO(g.checkInIso);
      if (filter === "Bugun") return matchesSearch && isToday(d);
      if (filter === "Kecha") return matchesSearch && isYesterday(d);
      if (filter === "2-3 kun") {
        const days = differenceInCalendarDays(new Date(), d);
        return matchesSearch && days >= 2 && days <= 3;
      }
    } catch {
      return false;
    }
    return matchesSearch;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="bg-card border-b border-border px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg px-3 text-muted-foreground hover:bg-muted transition-colors active:scale-[0.98] font-semibold text-sm"
          >
            <ChevronLeft className="h-5 w-5" />
            Ortga
          </button>
          <h1 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Mehmonlar
          </h1>
        </div>
      </div>

      <div className="px-4 pt-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon yoki pasport qidirish..."
            autoFocus
            className="w-full h-11 pl-9 pr-4 rounded-xl border border-input bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex gap-2 px-4 py-2 shrink-0">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="text-center text-sm text-muted-foreground py-12">Yuklanmoqda…</p>}
        {isError && (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-destructive mb-2">Yuklab bo'lmadi</p>
            <button type="button" onClick={() => refetch()} className="text-xs font-semibold text-primary underline">
              Qayta urinish
            </button>
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">Mehmon topilmadi</p>
        )}
        {!isLoading &&
          !isError &&
          filtered.map((guest) => (
            <button
              key={`${guest.lookupKey || guest.phone || "g"}-${guest.checkInIso}`}
              type="button"
              onClick={() =>
                onSelect({
                  lookupKey: guest.lookupKey,
                  name: guest.name,
                  phone: guest.phone,
                  passportSeries: guest.passportSeries,
                  lastVisit: guest.lastVisit,
                  price: guest.price,
                  paid: guest.paid,
                  nights: guest.nights,
                  notes: guest.notes,
                  hostel: guest.hostel,
                  room: guest.room,
                  photos: guest.photos,
                })
              }
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 active:bg-muted transition-colors text-left border-b border-border/50"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-primary">{guest.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-foreground truncate flex-1 min-w-0">{guest.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {guest.lastVisit}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="truncate">
                    {(() => {
                      const d = guest.phone.replace(/\D/g, "");
                      if (d.length >= 9) return `+${d}`;
                      return guest.passportSeries || guest.phone || "—";
                    })()}
                  </span>
                  <span>·</span>
                  <span className="font-semibold">{guest.price.toLocaleString()} so'm</span>
                </div>
                {guest.hostel && (
                  <span className="text-[10px] text-muted-foreground/70 mt-0.5 block">
                    {guest.hostel} · {guest.room}
                  </span>
                )}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
};

export default RecentGuests;
