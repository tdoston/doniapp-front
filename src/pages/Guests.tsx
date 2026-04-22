import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Users, Clock, Search, MapPin, Phone, FileText } from "lucide-react";
import { differenceInCalendarDays, isToday, isYesterday, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  fetchGuestHistory,
  fetchRecentGuests,
  recentGuestsQueryKey,
  type GuestHistoryRow,
  type RecentGuestDto,
} from "@/lib/api";
import { checkInLabel } from "@/lib/dates";
import { PENDING_CHECKIN_GUEST_KEY } from "@/lib/recentGuestPrefill";

const FILTERS = ["Hammasi", "Bugun", "Kecha", "2-3 kun"] as const;
type FilterKey = (typeof FILTERS)[number];

interface GuestsPageProps {
  /** Mehmonlar ro‘yxatidan tanlanganda — taxtada «Yangi mehmon» bilan check-in prefili */
  onGuestPickForCheckIn?: (guest: RecentGuestDto) => void;
}

const GuestsPage = ({ onGuestPickForCheckIn }: GuestsPageProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("Hammasi");
  const [selectedGuest, setSelectedGuest] = useState<RecentGuestDto | null>(null);

  const limit = 200;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: recentGuestsQueryKey(limit),
    queryFn: () => fetchRecentGuests(limit),
    staleTime: 30_000,
  });

  const guests = useMemo(() => data?.guests ?? [], [data?.guests]);
  const selectedLookupKey = selectedGuest?.lookupKey || "";
  const historyQuery = useQuery({
    queryKey: ["guestHistory", selectedLookupKey],
    queryFn: () => fetchGuestHistory(selectedLookupKey),
    enabled: !!selectedGuest && !onGuestPickForCheckIn && selectedLookupKey.length > 0,
    staleTime: 20_000,
  });

  const eventLabel = (row: GuestHistoryRow): string => {
    if (row.eventType === "check_in") return "Check-in";
    if (row.eventType === "check_out") return "Check-out";
    if (row.eventType === "bron_cancel") return "Bron bekor";
    return "Bron";
  };

  const historyRows = historyQuery.data?.history ?? [];
  const historyStats = useMemo(() => {
    const checkIns = historyRows.filter((h) => h.eventType === "check_in").length;
    const checkOuts = historyRows.filter((h) => h.eventType === "check_out").length;
    const totalPaid = historyRows.reduce((sum, h) => sum + Number(h.paid || 0), 0);
    const totalDebt = historyRows.reduce((sum, h) => sum + Math.max(0, Number(h.price || 0) - Number(h.paid || 0)), 0);
    const comments = historyRows
      .map((h) => (h.notes || "").trim())
      .filter(Boolean)
      .slice(0, 50);
    const anonymousComments = comments.filter((n) => /anonim|anonymous|yashirin/i.test(n));
    const rated = comments.filter((n) => /baho|rating|yulduz|\b[1-5]\s*\/\s*5\b/i.test(n));
    return { checkIns, checkOuts, totalPaid, totalDebt, comments, anonymousComments, rated };
  }, [historyRows]);

  const handlePlaceGuest = (guest: RecentGuestDto) => {
    if (onGuestPickForCheckIn) {
      onGuestPickForCheckIn(guest);
      setSelectedGuest(null);
      return;
    }
    sessionStorage.setItem(PENDING_CHECKIN_GUEST_KEY, JSON.stringify(guest));
    setSelectedGuest(null);
    navigate("/");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.phone || "").toLowerCase().includes(q) ||
        (g.passportSeries || "").toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filter === "Hammasi") return true;

      try {
        const d = parseISO(g.lastVisit);
        if (filter === "Bugun") return isToday(d);
        if (filter === "Kecha") return isYesterday(d);
        if (filter === "2-3 kun") {
          const days = differenceInCalendarDays(new Date(), d);
          return days >= 2 && days <= 3;
        }
      } catch {
        return false;
      }
      return true;
    });
  }, [guests, search, filter]);

  return (
    <div className="px-4 pb-6">
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism, telefon yoki pasport qidirish…"
          className="w-full h-11 pl-9 pr-9 rounded-xl border-2 border-primary/40 bg-card text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:bg-muted text-xs"
            aria-label="Tozalash"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto -mx-1 px-1 scrollbar-none">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mb-2 opacity-40 animate-pulse" />
          <p className="text-sm font-semibold">Yuklanmoqda…</p>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <Users className="w-10 h-10 mb-2 opacity-40 text-muted-foreground" />
          <p className="text-sm font-semibold text-destructive">Ma&apos;lumot olinmadi</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-xs font-bold text-primary underline"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {!isLoading && !isError && guests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm font-semibold">Hozircha mehmon yo&apos;q</p>
        </div>
      )}

      {!isLoading && !isError && guests.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm font-semibold">Mehmon topilmadi</p>
          <p className="text-xs mt-1">Boshqa kalit so&apos;z bilan urinib ko&apos;ring</p>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-3 px-1 leading-snug">
            Mehmon kartasini bosing — tarixini ko&apos;ring, keyin kerak bo&apos;lsa{" "}
            <span className="font-bold text-foreground">Mehmonni joylashtirish</span> ni bosing.
          </p>
          <p className="text-[11px] text-muted-foreground font-semibold mb-2 px-1">
            {filtered.length} ta mehmon
          </p>
          <ul className="space-y-2">
            {filtered.map((g) => {
              const remaining = Math.max(0, (g.price || 0) - (g.paid || 0));
              const isFullyPaid = remaining === 0 && (g.paid || 0) > 0;
              const phoneDigits = (g.phone || "").replace(/\D/g, "");
              const contactDisplay =
                phoneDigits.length >= 9
                  ? `+${phoneDigits}`
                  : g.passportSeries || g.phone || "—";
              const isPhone = phoneDigits.length >= 9;

              const cardClass =
                "w-full rounded-xl border border-border bg-card p-3 text-left transition-colors " +
                (onGuestPickForCheckIn
                  ? "hover:border-primary/50 active:scale-[0.99]"
                  : "hover:border-primary/40");

              const inner = (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-base font-bold text-primary">
                        {g.name[0]?.toUpperCase() || "?"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name + last visit */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground truncate">
                          {g.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-0.5 shrink-0">
                          <Clock className="w-3 h-3" />
                          {checkInLabel(g.lastVisit)}
                        </span>
                      </div>

                      {/* Contact */}
                      <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                        {isPhone ? (
                          <Phone className="w-3 h-3" />
                        ) : (
                          <FileText className="w-3 h-3" />
                        )}
                        <span className="truncate">{contactDisplay}</span>
                      </p>

                      {/* Hostel · room */}
                      {(g.hostel || g.room) && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">
                            {g.hostel}
                            {g.room ? ` · ${g.room}` : ""}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price row */}
                  <div className="mt-2 pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        Narx
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {(g.price || 0).toLocaleString()} so&apos;m
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        {isFullyPaid ? "To'langan" : "Qoldi"}
                      </span>
                      <span
                        className={`text-sm font-extrabold ${
                          isFullyPaid ? "text-emerald-600" : "text-destructive"
                        }`}
                      >
                        {isFullyPaid
                          ? "✓ To'liq"
                          : `${remaining.toLocaleString()} so'm`}
                      </span>
                    </div>
                  </div>
                </>
              );

              return (
                <li key={`${g.lookupKey || g.phone}-${g.lastVisit}`}>
                  <button type="button" onClick={() => setSelectedGuest(g)} className={cardClass}>
                    {inner}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Dialog open={!!selectedGuest} onOpenChange={(v) => !v && setSelectedGuest(null)}>
        <DialogContent className="max-w-[min(100vw-1rem,36rem)] p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/70">
            <DialogTitle className="text-base font-extrabold">
              {selectedGuest?.name || "Mehmon"} tarixi
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-4 py-3 space-y-2">
            {!selectedLookupKey ? (
              <p className="text-sm text-muted-foreground">Tarixni ko'rish uchun lookupKey topilmadi.</p>
            ) : historyQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Tarix yuklanmoqda…</p>
            ) : historyQuery.isError ? (
              <p className="text-sm text-destructive">Tarixni olib bo'lmadi.</p>
            ) : (historyQuery.data?.history ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Tarix yozuvlari yo'q.</p>
            ) : (
              <>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p>
                      Check-inlar: <span className="font-bold">{historyStats.checkIns}</span>
                    </p>
                    <p>
                      Check-outlar: <span className="font-bold">{historyStats.checkOuts}</span>
                    </p>
                    <p>
                      Jami to'langan: <span className="font-bold">{historyStats.totalPaid.toLocaleString()} so'm</span>
                    </p>
                    <p>
                      Jami qoldiq: <span className="font-bold text-destructive">{historyStats.totalDebt.toLocaleString()} so'm</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectedGuest && handlePlaceGuest(selectedGuest)}
                    className="mt-3 h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground active:scale-[0.98]"
                  >
                    Mehmonni joylashtirish
                  </button>
                </div>

                {historyStats.rated.length > 0 ? (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-primary mb-2">Baholashlar</p>
                    <div className="space-y-1.5">
                      {historyStats.rated.slice(0, 6).map((c, idx) => (
                        <p key={`rate-${idx}`} className="text-xs whitespace-pre-wrap">
                          • {c}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(historyStats.anonymousComments.length > 0 || historyStats.comments.length > 0) ? (
                  <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-primary mb-2">
                      Fikr va izohlar {historyStats.anonymousComments.length > 0 ? "(anonim ham bor)" : ""}
                    </p>
                    <div className="space-y-1.5">
                      {(historyStats.anonymousComments.length > 0
                        ? historyStats.anonymousComments
                        : historyStats.comments
                      )
                        .slice(0, 8)
                        .map((c, idx) => (
                          <p key={`comment-${idx}`} className="text-xs whitespace-pre-wrap">
                            • {c}
                          </p>
                        ))}
                    </div>
                  </div>
                ) : null}

                {historyRows.map((h) => (
                  <div key={h.bookingId} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{eventLabel(h)}</p>
                      <p className="text-[11px] text-muted-foreground">{checkInLabel(h.checkInDate)}</p>
                    </div>
                    <p className="text-sm font-semibold mt-1">
                      {h.hostel} · {h.roomName} · K{h.bedIndex}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Narx: {Number(h.price || 0).toLocaleString()} so'm · To'langan:{" "}
                      {Number(h.paid || 0).toLocaleString()} so'm
                    </p>
                    {h.notes?.trim() ? (
                      <p className="text-xs mt-2 whitespace-pre-wrap">
                        <span className="font-bold">Izoh:</span> {h.notes.trim()}
                      </p>
                    ) : null}
                    {h.cancelReasonCheckin?.trim() ? (
                      <p className="text-xs mt-1 whitespace-pre-wrap">
                        <span className="font-bold">Check-out sababi:</span> {h.cancelReasonCheckin.trim()}
                      </p>
                    ) : null}
                    {h.cancelReasonBron?.trim() ? (
                      <p className="text-xs mt-1 whitespace-pre-wrap">
                        <span className="font-bold">Bron bekor sababi:</span> {h.cancelReasonBron.trim()}
                      </p>
                    ) : null}
                  </div>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuestsPage;
